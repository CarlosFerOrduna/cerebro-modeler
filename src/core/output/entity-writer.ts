import { Database } from '../schema';
import { ImportPathResolver, NameFormatterContextual } from '../utils';
import { EntityGenerator } from './generators';

export class EntityWriter {
  constructor(
    private schema: Database,
    private formatter: NameFormatterContextual,
    private importPathResolver: ImportPathResolver
  ) {}

  async generateEntities(): Promise<Map<string, string>> {
    const files = new Map<string, string>();

    for (const table of this.schema.tables) {
      const generator = new EntityGenerator(table, this.formatter, this.importPathResolver);

      const code = await generator.generate();
      files.set(`${this.formatter.toFileFormat(table.name)}.ts`, code);
    }

    return files;
  }
}
