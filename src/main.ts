#!/usr/bin/env node

import path from 'path';
import { parseArgs } from './cli/arg-parser';
import { DriverFactory } from './core/db';
import { EntityWriter, FileWriter } from './core/output';
import { ImportPathResolver, NameFormatterContextual } from './core/utils';

const main = async () => {
  try {
    const args = await parseArgs();
    const driver = DriverFactory.create(args);

    await driver.connect();

    const schema = await driver.readSchema(args.schema, args.tables);

    await driver.close();

    const formatter = new NameFormatterContextual({
      file: {
        case: args.caseFile,
        prefix: args.prefixFile,
        suffix: args.suffixFile,
        treatSuffixAsExtension: args.fileExtension,
      },
      class: { case: args.caseClass, prefix: args.prefixClass, suffix: args.suffixClass },
      property: { case: args.caseProperty, prefix: args.prefixProperty, suffix: args.suffixProperty },
    });

    const fileWriter = new FileWriter(path.resolve(args.output), args.writeMode);
    const importPathResolver = new ImportPathResolver(fileWriter);
    const writer = new EntityWriter(schema, formatter, importPathResolver);
    const files = await writer.generateEntities();

    await fileWriter.writeFiles(files);
  } catch (error) {
    console.error('❌ Error while parsing arguments:', error);
    process.exit(1);
  }
};

main();
