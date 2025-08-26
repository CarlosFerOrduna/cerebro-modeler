import { Column } from '../readers/models/Column';
import { Database } from '../readers/models/Database';
import { Table } from '../readers/models/Table';

export class EntityWriter {
  constructor(private schema: Database) {}

  generateEntities(): Map<string, string> {
    const files = new Map<string, string>();

    for (const table of this.schema.tables) {
      const className = this.getClassName(table.name);
      const entityCode = this.generateEntity(table, className);
      files.set(`${className}.ts`, entityCode);
    }

    return files;
  }

  private generateEntity(table: Table, className: string): string {
    const usedImports = new Set<string>(['Entity']);
    const fkColumnNames = new Set(table.foreignKeys.map(fk => fk.sourceColumns[0]));

    const indexDecorators = this.generateIndexDecorators(table, usedImports);

    const properties = [
      ...this.generateColumns(table, fkColumnNames, usedImports),
      ...this.generateManyToOneRelations(table, usedImports),
      ...this.generateOneToManyRelations(table, usedImports),
    ];

    const imports = this.generateImports(table, usedImports);

    return `${imports}

${indexDecorators}
@Entity('${table.name}', { schema: '${table.schema}' })
export class ${className} {
${properties.join('\n\n')}
}`;
  }

  private generateImports(table: Table, used: Set<string>): string {
    const relatedEntities = new Set<string>();
    for (const fk of table.foreignKeys) relatedEntities.add(this.getClassName(fk.targetTable));
    for (const fk of table.inverseForeignKeys) relatedEntities.add(this.getClassName(fk.sourceTable));

    const typeormImport = `import { ${Array.from(used).sort().join(', ')} } from 'typeorm';`;
    const relatedImports = Array.from(relatedEntities)
      .filter(name => name.toLowerCase() !== table.name.toLowerCase())
      .sort()
      .map(name => `import { ${name} } from './${name}';`)
      .join('\n');

    return [typeormImport, relatedImports].filter(Boolean).join('\n');
  }

  private generateIndexDecorators(table: Table, used: Set<string>): string {
    if (!table.indexes?.length) return '';
    used.add('Index');

    return table.indexes
      .sort((i1, i2) => i1.name.localeCompare(i2.name))
      .map(idx => {
        const cols = idx.columns.map(c => `'${c}'`).join(', ');
        const unique = idx.isUnique ? ', { unique: true }' : '';
        return `@Index('${idx.name}', [${cols}]${unique})`;
      })
      .join('\n');
  }

  private generateColumns(table: Table, fkColumns: Set<string>, used: Set<string>): string[] {
    return table.columns
      .filter(col => !fkColumns.has(col.name))
      .sort()
      .map(col => {
        const decorators: string[] = [];

        if (col.isIdentity) {
          used.add('PrimaryGeneratedColumn');
          decorators.push(
            `@PrimaryGeneratedColumn({ type: '${col.type}', name: '${col.name}'${this.getColumnOptions(col)} })`
          );
        } else if (col.isPrimary) {
          used.add('PrimaryColumn');
          decorators.push(`@PrimaryColumn('${col.type}', { name: '${col.name}'${this.getColumnOptions(col)} })`);
        } else {
          used.add('Column');
          decorators.push(`@Column('${col.type}', { name: '${col.name}'${this.getColumnOptions(col)} })`);
        }

        const nullableFlag = col.isNullable ? ' | null' : '';
        return `  ${decorators.join('\n  ')}\n  ${col.name}: ${this.getTSDataType(col.type)}${nullableFlag};`;
      });
  }

  private generateManyToOneRelations(table: Table, used: Set<string>): string[] {
    return table.foreignKeys.sort().map(fk => {
      used.add('ManyToOne');
      used.add('JoinColumn');

      const targetClass = this.getClassName(fk.targetTable);
      const sourceColumn = fk.sourceColumns[0];
      const targetColumn = fk.targetColumns[0];
      const property = this.camelCase(sourceColumn.replace(/Id$/, ''));

      return (
        `  @ManyToOne(() => ${targetClass}, ${property} => ${property}.${this.camelCase(table.name)}s)\n  ` +
        `@JoinColumn([{ name: '${sourceColumn}', referencedColumnName: '${targetColumn}' }])\n  ` +
        `${property}: ${targetClass};`
      );
    });
  }

  private generateOneToManyRelations(table: Table, used: Set<string>): string[] {
    const entityUsed: Record<string, number> = {};

    return table.inverseForeignKeys.sort().map(fk => {
      used.add('OneToMany');

      const sourceClass = this.getClassName(fk.sourceTable);
      const alias = this.camelCase(fk.sourceTable);
      const property = alias + 's';

      entityUsed[property] = (entityUsed[property] || 0) + 1;

      return (
        `  @OneToMany(() => ${sourceClass}, ${alias} => ${alias}.${this.camelCase(fk.sourceColumns[0].replace(/Id$/, ''))})\n  ` +
        `${entityUsed[property] > 1 ? property + entityUsed[property] : property}: ${sourceClass}[];`
      );
    });
  }

  private getColumnOptions(col: Column): string {
    const opts: string[] = [];
    const isNotLengthyType = !['datetime', 'bit', 'date', 'int', 'bigint', 'smallint'].includes(col.type);

    if (col.isNullable) opts.push(`nullable: true`);
    if (col.isUnique) opts.push(`unique: true`);
    if (isNotLengthyType && col.length && col.type !== 'text') opts.push(`length: ${col.length}`);
    if (isNotLengthyType && col.precision) opts.push(`precision: ${col.precision}`);
    if (isNotLengthyType && col.scale) opts.push(`scale: ${col.scale}`);
    if (col.defaultValue) {
      opts.push(`default: () => '${col.defaultValue.replace(/^\((.+)\)$/, '$1')}'`);
    }

    return opts.length ? ', ' + opts.join(', ') : '';
  }

  private getTSDataType(sqlType: string): string {
    const type = sqlType.toLowerCase();
    if (['int', 'decimal', 'float', 'bigint', 'smallint', 'numeric', 'money'].includes(type)) return 'number';
    if (['bit'].includes(type)) return 'boolean';
    if (['datetime', 'date', 'smalldatetime', 'timestamp'].includes(type)) return 'Date';
    return 'string';
  }

  private getClassName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  private camelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
}
