import { Table } from '../../schema';
import { NameFormatterContextual } from '../../utils';

export class RelationGenerator {
  constructor(
    private table: Table,
    private used: Set<string>,
    private formatter: NameFormatterContextual,
    private relationContext: Map<string, string>
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

      const inverseKey = `${this.table.name}.${source}`;

      const inverseProperty =
        this.relationContext.get(inverseKey) ?? this.formatter.toPluralPropertyFormat(this.table.name);

      return (
        `\t@ManyToOne(() => ${targetClass}, ${property} => ${property}.${inverseProperty})\n` +
        `\t@JoinColumn([{ name: '${source}', referencedColumnName: '${target}' }])\n` +
        `\t${property}: ${targetClass};`
      );
    });
  }

  generateOneToMany(): string[] {
    const count: Record<string, number> = {};

    return this.table.inverseForeignKeys.map(fk => {
      this.used.add('OneToMany');

      const alias = this.formatter.toPropertyFormat(fk.sourceTable);
      count[alias] = (count[alias] ?? 0) + 1;

      const baseProperty = this.formatter.toPluralPropertyFormat(fk.sourceTable);
      const property = `${baseProperty}${count[alias] > 1 ? count[alias] : ''}`;

      const sourceClass = this.formatter.toClassFormat(fk.sourceTable);
      const inverse = this.formatter.toPropertyFormat(fk.sourceColumns[0].replace(/Id$/, ''));

      const inverseKey = `${fk.sourceTable}.${fk.sourceColumns[0]}`;
      this.relationContext.set(inverseKey, property);

      return `\t@OneToMany(() => ${sourceClass}, ${alias} => ${alias}.${inverse})\n\t${property}: ${sourceClass}[];`;
    });
  }
}
