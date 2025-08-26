import { Table } from '../../schema';
import { ImportPathResolver, NameFormatterContextual } from '../../utils';

export class ImportGenerator {
  constructor(
    private table: Table,
    private used: Set<string>,
    private formatter: NameFormatterContextual,
    private importPathResolver: ImportPathResolver
  ) {}

  async generate(): Promise<string> {
    const related = new Set<string>();
    for (const fk of this.table.foreignKeys) {
      related.add(fk.targetTable);
    }

    for (const fk of this.table.inverseForeignKeys) {
      related.add(fk.sourceTable);
    }

    const relImports = await Promise.all(
      [...related]
        .filter(n => n.toLowerCase() !== this.table.name.toLowerCase())
        .sort()
        .map(async relatedTableName => {
          const currentFilename = this.formatter.toFileFormat(this.table.name) + '.ts';
          const relatedFilename = this.formatter.toFileFormat(relatedTableName) + '.ts';
          const importPath = await this.importPathResolver.getImportPath(currentFilename, relatedFilename);
          return `import { ${this.formatter.toClassFormat(relatedTableName)} } from '${importPath}';`;
        })
    );

    const base = `import { ${Array.from(this.used).sort().join(', ')} } from 'typeorm';`;
    return `${[base, ...relImports].filter(Boolean).join('\n')}\n`;
  }
}
