import { Column, Table } from '../../schema';
import { NameFormatterContextual } from '../../utils';

export class PropertyGenerator {
  constructor(
    private table: Table,
    private used: Set<string>,
    private formatter: NameFormatterContextual
  ) {}

  generate(): string[] {
    const fkCols = new Set(this.table.foreignKeys.map(fk => fk.sourceColumns[0]));

    return this.table.columns
      .filter(col => !fkCols.has(col.name))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(col => this.buildColumn(col));
  }

  private buildColumn(col: Column): string {
    const decorators: string[] = [];

    if (col.isIdentity) {
      this.used.add('PrimaryGeneratedColumn');
      decorators.push(
        `@PrimaryGeneratedColumn({ type: '${col.type}', name: '${col.name}'${this.columnOptions(col)} })`
      );
    } else if (col.isPrimary) {
      this.used.add('PrimaryColumn');
      decorators.push(`@PrimaryColumn('${col.type}', { name: '${col.name}'${this.columnOptions(col)} })`);
    } else {
      this.used.add('Column');
      decorators.push(`@Column('${col.type}', { name: '${col.name}'${this.columnOptions(col)} })`);
    }

    const type = this.tsType(col.type);
    const nullable = col.isNullable ? ' | null' : '';
    return `  ${decorators.join('\n\t')}\n\t${this.formatter.toPropertyFormat(col.name)}: ${type}${nullable};`;
  }

  private columnOptions(col: Column): string {
    const opts: string[] = [];
    const isNotLengthyType = !['datetime', 'datetime2', 'bit', 'date', 'int', 'bigint', 'smallint'].includes(col.type);

    if (col.isNullable) {
      opts.push(`nullable: true`);
    }
    if (col.isUnique) {
      opts.push(`unique: true`);
    }
    if (isNotLengthyType && col.length && !['text', 'decimal'].includes(col.type)) {
      opts.push(`length: ${col.length}`);
    }
    if (isNotLengthyType && col.precision) {
      opts.push(`precision: ${col.precision}`);
    }
    if (isNotLengthyType && col.scale) {
      opts.push(`scale: ${col.scale}`);
    }
    if (col.defaultValue) {
      opts.push(`default: () => '${col.defaultValue.replace(/\'/g, '').replace(/^\((.+)\)$/, '$1')}'`);
    }
    return opts.length ? ', ' + opts.join(', ') : '';
  }

  private tsType(sqlType: string): string {
    const type = sqlType.toLowerCase();
    if (['int', 'decimal', 'float', 'bigint', 'smallint', 'numeric', 'money'].includes(type)) return 'number';
    if (['bit'].includes(type)) return 'boolean';
    if (['datetime', 'date', 'smalldatetime', 'timestamp'].includes(type)) return 'Date';
    return 'string';
  }
}
