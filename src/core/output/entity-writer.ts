import { Database } from '../schema';
import { ImportPathResolver, NameFormatterContextual } from '../utils';
import { EntityGenerator, RelationGenerator } from './generators';

export class EntityWriter {
  constructor(
    private schema: Database,
    private formatter: NameFormatterContextual,
    private importPathResolver: ImportPathResolver
  ) {}

  async generateEntities(): Promise<Map<string, string>> {
    const files = new Map<string, string>();

    const relationContext = new Map<string, string>();

    for (const table of this.schema.tables) {
      const relationGen = new RelationGenerator(table, new Set(), this.formatter, relationContext);
      relationGen.generateOneToMany();
    }

    for (const table of this.schema.tables) {
      const generator = new EntityGenerator(table, this.formatter, this.importPathResolver, relationContext);

      const code = await generator.generate();
      files.set(`${this.formatter.toFileFormat(table.name)}.ts`, code);
    }

    return files;
  }
}
