import { Table } from '../../schema';

export class IndexDecoratorGenerator {
  constructor(
    private table: Table,
    private used: Set<string>
  ) {}

  generate(): string {
    if (!this.table.indexes?.length) return '';

    this.used.add('Index');

    return this.table.indexes
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(idx => {
        const cols = idx.columns.map(col => `'${col}'`).join(', ');
        const options = idx.isUnique ? ', { unique: true }' : '';
        return `@Index('${idx.name}', [${cols}]${options})`;
      })
      .join('\n');
  }
}
