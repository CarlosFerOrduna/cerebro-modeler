import { Database } from '../schema';
import { NameFormatterContextual } from '../utils';
import { EntityGenerator } from './generators';
import { ImportPathResolver } from '../utils/import-path-resolver';

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
      const className = generator.getClassName();
      const code = await generator.generate();
      files.set(`${this.formatter.toFileFormat(className)}.ts`, code);
    }

    return files;
  }
}
