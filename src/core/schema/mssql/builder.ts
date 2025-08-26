import { Column } from '../models/Column';
import { Database } from '../models/Database';
import { ForeignKey } from '../models/ForeignKey';
import { Index } from '../models/Index';
import { Table } from '../models/Table';

export class MssqlSchemaBuilder {
  constructor(private schema: string) {}

  buildDatabase(columns: any[], primaryKeys: any[], indexes: any[], foreignKeys: any[]): Database {
    const db = new Database(this.schema);
    const tableMap = new Map<string, Table>();

    for (const row of columns) {
      const key = row.tableName;
      if (!tableMap.has(key)) tableMap.set(key, new Table(key, this.schema));

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
    for (const row of primaryKeys) {
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

    for (const row of indexes) {
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
    for (const row of foreignKeys) {
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
  }
}
