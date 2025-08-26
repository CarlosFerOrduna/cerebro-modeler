import path from 'path';
import { parseArgs } from './cli/arg-parser';
import { DB } from './db/connect';
import { readSchema } from './readers/schema-reader';
import { EntityWriter } from './writers/entity-writer';
import { writeFiles } from './writers/file-writer';

const main = async () => {
  try {
    const args = await parseArgs();
    const pool = await DB.getPool(args);

    const schema = await readSchema(pool, args.schema, args.tables);
    await DB.close(args.verbose);

    const files = new EntityWriter(schema).generateEntities();
    const baseDir = process.cwd();
    const outputPath = path.resolve(baseDir, args.output);

    await writeFiles(files, outputPath);
  } catch (error) {
    console.error('❌ Error while parsing arguments:', error);
    process.exit(1);
  }
};

main();
