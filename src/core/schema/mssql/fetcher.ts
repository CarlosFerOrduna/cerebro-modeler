import { ConnectionPool } from 'mssql';

export class MssqlSchemaFetcher {
  constructor(private pool: ConnectionPool) {}

  async fetchColumns(schema: string, tables: string[], ignoreTables: string[]) {
    const tableCondition = tables.length > 0 ? `AND t.name IN (${tables.map((_, i) => `@table${i}`).join(', ')})` : '';
    const ignoreTableCondition =
      ignoreTables.length > 0
        ? `AND t.name NOT IN (${ignoreTables.map((_, i) => `@ignore_table${i}`).join(', ')})`
        : '';

    const columnRequest = this.pool.request().input('schema', schema);
    tables.forEach((table, i) => columnRequest.input(`table${i}`, table));
    ignoreTables.forEach((table, i) => columnRequest.input(`ignore_table${i}`, table));

    const query = `
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
      ${ignoreTableCondition}
    `;

    const result = await columnRequest.query(query);

    return result.recordset;
  }

  async fetchPrimaryKeys(schema: string, tables: string[], ignoreTables: string[]) {
    const tableCondition = tables.length > 0 ? `AND t.name IN (${tables.map((_, i) => `@table${i}`).join(', ')})` : '';
    const ignoreTableCondition =
      ignoreTables.length > 0
        ? `AND t.name NOT IN (${ignoreTables.map((_, i) => `@ignore_table${i}`).join(', ')})`
        : '';

    const pkRequest = this.pool.request().input('schema', schema);
    tables.forEach((table, i) => pkRequest.input(`table${i}`, table));
    ignoreTables.forEach((table, i) => pkRequest.input(`ignore_table${i}`, table));

    const query = `
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
      ${ignoreTableCondition}
    `;

    const result = await pkRequest.query(query);

    return result.recordset;
  }

  async fetchIndexes(schema: string, tables: string[], ignoreTables: string[]) {
    const tableCondition = tables.length > 0 ? `AND t.name IN (${tables.map((_, i) => `@table${i}`).join(', ')})` : '';
    const ignoreTableCondition =
      ignoreTables.length > 0
        ? `AND t.name NOT IN (${ignoreTables.map((_, i) => `@ignore_table${i}`).join(', ')})`
        : '';

    const indexRequest = this.pool.request().input('schema', schema);
    tables.forEach((table, i) => indexRequest.input(`table${i}`, table));
    ignoreTables.forEach((table, i) => indexRequest.input(`ignore_table${i}`, table));

    const query = `
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
      ${ignoreTableCondition}
    `;

    const result = await indexRequest.query(query);

    return result.recordset;
  }

  async fetchForeignKeys(schema: string, tables: string[], ignoreTables: string[]) {
    const fkTableCondition =
      tables.length > 0
        ? `AND (t.name IN (${tables.map((_, i) => `@table${i}`).join(', ')}) OR tgt.name IN (${tables.map((_, i) => `@table${i}_tgt`).join(', ')}))`
        : '';
    const fkIgnoreTableCondition =
      ignoreTables.length > 0
        ? `AND (t.name NOT IN (${ignoreTables.map((_, i) => `@ignore_table${i}`).join(', ')}) AND tgt.name NOT IN (${ignoreTables.map((_, i) => `@ignore_table${i}_tgt`).join(', ')}))`
        : '';

    const fkRequest = this.pool.request().input('schema', schema);
    tables.forEach((table, i) => {
      fkRequest.input(`table${i}`, table);
      fkRequest.input(`table${i}_tgt`, table);
    });
    ignoreTables.forEach((table, i) => {
      fkRequest.input(`ignore_table${i}`, table);
      fkRequest.input(`ignore_table${i}_tgt`, table);
    });

    const query = `
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
      ${fkIgnoreTableCondition}
    `;

    const result = await fkRequest.query(query);

    return result.recordset;
  }
}
