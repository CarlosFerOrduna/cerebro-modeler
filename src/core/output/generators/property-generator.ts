import { Column, Table } from '../../schema';
import { NameFormatterContextual } from '../../utils';

import { BOOLEAN_SQL_TYPES, DATE_SQL_TYPES, LENGTHLESS_SQL_TYPES, NUMBER_SQL_TYPES } from './sql-type-catalog';

export class PropertyGenerator {
  constructor(
    private table: Table,
    private used: Set<string>,
    private formatter: NameFormatterContextual
  ) {}

  generate(): string[] {
    const fkCols = new Set(this.table.foreignKeys.map(fk => fk.sourceColumns[0]));
    const idxCol = new Set(this.table.indexes.flatMap(idx => idx.columns));

    const columns = this.table.columns.filter(col => idxCol.has(col.name) || !fkCols.has(col.name));
    const primaryColumns = columns.filter(col => col.isPrimary || col.isIdentity);
    const remainingColumns = columns.filter(col => !col.isPrimary && !col.isIdentity);

    return [...primaryColumns, ...remainingColumns].map(col => this.buildColumn(col));
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
    const isNotLengthyType = !LENGTHLESS_SQL_TYPES.includes(col.type);

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
      opts.push(`default: () => '${col.defaultValue.replace(/'/g, '').replace(/^\((.+)\)$/, '$1')}'`);
    }
    return opts.length ? ', ' + opts.join(', ') : '';
  }

  private tsType(sqlType: string): string {
    const type = sqlType.toLowerCase();
    if (NUMBER_SQL_TYPES.includes(type)) return 'number';
    if (BOOLEAN_SQL_TYPES.includes(type)) return 'boolean';
    if (DATE_SQL_TYPES.includes(type)) return 'Date';
    return 'string';
  }
}
