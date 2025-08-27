import { Table } from '../../schema';
import { ImportPathResolver, NameFormatterContextual } from '../../utils';
import { ImportGenerator } from './import-generator';
import { IndexDecoratorGenerator } from './index-decorator-generator';
import { PropertyGenerator } from './property-generator';
import { RelationGenerator } from './relation-generator';

export class EntityGenerator {
  private usedImports = new Set<string>(['Entity']);

  constructor(
    private table: Table,
    private formatter: NameFormatterContextual,
    private importPathResolver: ImportPathResolver
  ) {}

  async generate(): Promise<string> {
    const indices = new IndexDecoratorGenerator(this.table, this.usedImports).generate();
    const properties = new PropertyGenerator(this.table, this.usedImports, this.formatter).generate();
    const relations = new RelationGenerator(this.table, this.usedImports, this.formatter).generate();
    const imports = await new ImportGenerator(
      this.table,
      this.usedImports,
      this.formatter,
      this.importPathResolver
    ).generate();

    const className = this.formatter.toClassFormat(this.table.name);

    return [
      imports,
      '',
      indices,
      `@Entity('${this.table.name}', { schema: '${this.table.schema}' })`,
      `export class ${className} {`,
      [...properties, ...relations].map(p => `  ${p}`).join('\n\n'),
      `}`,
    ]
      .filter(Boolean)
      .join('\n');
  }
}
