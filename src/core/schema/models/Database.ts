import { Table } from './Table';

export class Database {
  readonly schema: string;
  readonly tables: Table[] = [];

  constructor(schema: string) {
    this.schema = schema;
  }

  addTable(table: Table) {
    this.tables.push(table);
  }

  getTableByName(name: string): Table | undefined {
    return this.tables.find(t => t.name === name);
  }
}
