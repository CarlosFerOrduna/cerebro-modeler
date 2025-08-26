import { Table } from '../../schema';
import { NameFormatterContextual } from '../../utils';

export class RelationGenerator {
  constructor(
    private table: Table,
    private used: Set<string>,
    private formatter: NameFormatterContextual
  ) {}

  generate(): string[] {
    return [...this.generateManyToOne(), ...this.generateOneToMany()];
  }

  private generateManyToOne(): string[] {
    return this.table.foreignKeys.map(fk => {
      this.used.add('ManyToOne');
      this.used.add('JoinColumn');

      const source = fk.sourceColumns[0];
      const target = fk.targetColumns[0];
      const property = this.formatter.toPropertyFormat(source.replace(/Id$/, ''));
      const targetClass = this.formatter.toClassFormat(fk.targetTable);

      return (
        `\t@ManyToOne(() => ${targetClass}, ${property} => ${property}.${this.formatter.toPropertyFormat(this.table.name)}s)\n` +
        `\t@JoinColumn([{ name: '${source}', referencedColumnName: '${target}' }])\n` +
        `\t${property}: ${targetClass};`
      );
    });
  }

  private generateOneToMany(): string[] {
    const count: Record<string, number> = {};

    return this.table.inverseForeignKeys.map(fk => {
      this.used.add('OneToMany');

      const alias = this.formatter.toPropertyFormat(fk.sourceTable);
      const property = count[alias] ? `${alias}s${++count[alias]}` : `${alias}s`;
      const sourceClass = this.formatter.toClassFormat(fk.sourceTable);
      const inverse = this.formatter.toPropertyFormat(fk.sourceColumns[0].replace(/Id$/, ''));

      return `\t@OneToMany(() => ${sourceClass}, ${alias} => ${alias}.${inverse})\n\t${property}: ${sourceClass}[];`;
    });
  }
}
