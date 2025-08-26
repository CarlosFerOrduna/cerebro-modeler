import { ConnectionPool } from 'mssql';
import { Column } from './models/Column';
import { Database } from './models/Database';
import { ForeignKey } from './models/ForeignKey';
import { Index } from './models/Index';
import { Table } from './models/Table';

export const readSchema = async (pool: ConnectionPool, schema: string, tables: string[] = []): Promise<Database> => {
  const db = new Database(schema);
  const tableCondition = tables.length > 0 ? `AND t.name IN (${tables.map((_, i) => `@table${i}`).join(', ')})` : '';
  const fkTableCondition =
    tables.length > 0
      ? `AND (t.name IN (${tables.map((_, i) => `@table${i}`).join(', ')}) OR tgt.name IN (${tables.map((_, i) => `@table${i}_tgt`).join(', ')}))`
      : '';

  const columnRequest = pool.request().input('schema', schema);
  const pkRequest = pool.request().input('schema', schema);
  const indexRequest = pool.request().input('schema', schema);
  const fkRequest = pool.request().input('schema', schema);

  tables.forEach((table, i) => {
    columnRequest.input(`table${i}`, table);
    pkRequest.input(`table${i}`, table);
    indexRequest.input(`table${i}`, table);
    fkRequest.input(`table${i}`, table);
    fkRequest.input(`table${i}_tgt`, table);
  });

  const [columnsResult, primaryKeyResult, indexResult, fkResult] = await Promise.all([
    columnRequest.query(`
      SELECT
        t.name AS tableName,
        c.name AS columnName,
        ty.name AS dataType,
        c.is_nullable AS isNullable,
        c.is_identity AS isIdentity,
        c.max_length AS maxLength,
        c.precision AS precision,
        c.scale AS scale,
        dc.definition AS defaultValue
      FROM sys.columns c
      JOIN sys.tables t ON c.object_id = t.object_id
      JOIN sys.types ty ON c.user_type_id = ty.user_type_id
      LEFT JOIN sys.default_constraints dc ON c.default_object_id = dc.object_id
      JOIN sys.schemas s ON t.schema_id = s.schema_id
      WHERE s.name = @schema
      ${tableCondition}
    `),
    pkRequest.query(`
      SELECT 
        kc.name AS pkName,
        t.name AS tableName,
        c.name AS columnName
      FROM sys.key_constraints kc
      JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
      JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      JOIN sys.tables t ON kc.parent_object_id = t.object_id
      JOIN sys.schemas s ON t.schema_id = s.schema_id
      WHERE kc.type = 'PK' AND s.name = @schema
      ${tableCondition}
    `),
    indexRequest.query(`
      SELECT
        t.name AS tableName,
        i.name AS indexName,
        i.is_unique AS isUnique,
        i.is_primary_key AS isPrimaryKey,
        c.name AS columnName
      FROM sys.indexes i
      JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      JOIN sys.tables t ON i.object_id = t.object_id
      JOIN sys.schemas s ON t.schema_id = s.schema_id
      WHERE s.name = @schema AND i.is_primary_key = 0
      ${tableCondition}
    `),
    fkRequest.query(`
      SELECT
        fk.name AS fkName,
        t.name AS sourceTable,
        sc.name AS sourceColumn,
        tgt.name AS targetTable,
        tc.name AS targetColumn
      FROM sys.foreign_keys fk
      JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      JOIN sys.tables t ON fkc.parent_object_id = t.object_id
      JOIN sys.columns sc ON fkc.parent_object_id = sc.object_id AND fkc.parent_column_id = sc.column_id
      JOIN sys.tables tgt ON fkc.referenced_object_id = tgt.object_id
      JOIN sys.columns tc ON fkc.referenced_object_id = tc.object_id AND fkc.referenced_column_id = tc.column_id
      JOIN sys.schemas s ON t.schema_id = s.schema_id
      WHERE s.name = @schema
      ${fkTableCondition}
    `),
  ]);

  const tableMap = new Map<string, Table>();

  for (const row of columnsResult.recordset) {
    const key = row.tableName;
    if (!tableMap.has(key)) tableMap.set(key, new Table(key, schema));

    const col = new Column(
      row.columnName,
      row.dataType,
      row.isNullable,
      false,
      false,
      row.defaultValue ?? undefined,
      row.isIdentity,
      row.maxLength ?? undefined,
      row.precision ?? undefined,
      row.scale ?? undefined
    );

    tableMap.get(key)!.columns.push(col);
  }

  const pkGroups = new Map<string, { tableName: string; pkName: string; columns: string[] }>();
  for (const row of primaryKeyResult.recordset) {
    const key = row.tableName;
    if (!pkGroups.has(key)) pkGroups.set(key, { tableName: key, pkName: row.pkName, columns: [] });
    pkGroups.get(key)!.columns.push(row.columnName);
  }

  for (const { tableName, pkName, columns } of pkGroups.values()) {
    const table = tableMap.get(tableName);
    if (!table) continue;

    for (const colName of columns) {
      const col = table.getColumn(colName);
      if (!col) continue;
      col.isPrimary = true;
    }

    table.indexes.push(new Index(pkName, columns, true, true));
  }

  const indexGroups = new Map<
    string,
    { tableName: string; indexName: string; isPrimaryKey: boolean; isUnique: boolean; columns: string[] }
  >();

  for (const row of indexResult.recordset) {
    console.log(row);

    const key = `${row.tableName}::${row.indexName}`;
    if (!indexGroups.has(key)) {
      indexGroups.set(key, {
        tableName: row.tableName,
        indexName: row.indexName,
        isPrimaryKey: false,
        isUnique: row.isUnique,
        columns: [],
      });
    }
    indexGroups.get(key)!.columns.push(row.columnName);
  }

  for (const { tableName, indexName, isPrimaryKey, isUnique, columns } of indexGroups.values()) {
    const table = tableMap.get(tableName);
    if (!table) continue;

    for (const colName of columns) {
      const col = table.getColumn(colName);
      if (!col) continue;
      if (isUnique) col.isUnique = true;
    }

    table.indexes.push(new Index(indexName, columns, isPrimaryKey, isUnique));
  }

  const fkGroups = new Map<string, ForeignKey>();
  for (const row of fkResult.recordset) {
    const key = row.fkName;
    let fk = fkGroups.get(key);

    if (!fk) {
      fk = new ForeignKey(key, row.sourceTable, [], row.targetTable, []);
      fkGroups.set(key, fk);
    }

    fk.sourceColumns.push(row.sourceColumn);
    fk.targetColumns.push(row.targetColumn);
  }

  for (const fk of fkGroups.values()) {
    const table = tableMap.get(fk.sourceTable);
    if (table) table.foreignKeys.push(fk);
  }

  for (const fk of fkGroups.values()) {
    const targetTable = tableMap.get(fk.targetTable);
    if (targetTable) targetTable.inverseForeignKeys.push(fk);
  }

  for (const table of tableMap.values()) {
    db.addTable(table);
  }

  return db;
};
