import { Column } from './Column';
import { ForeignKey } from './ForeignKey';
import { Index } from './Index';

export class Table {
  public pkName?: string;

  constructor(
    public name: string,
    public schema: string,
    public columns: Column[] = [],
    public foreignKeys: ForeignKey[] = [],
    public indexes: Index[] = [],
    public inverseForeignKeys: ForeignKey[] = []
  ) {}

  get primaryColumns(): Column[] {
    return this.columns.filter(c => c.isPrimary);
  }

  getColumn(name: string): Column | undefined {
    return this.columns.find(c => c.name === name);
  }

  setPrimaryKey(pkName: string) {
    this.pkName = pkName;
  }
}
