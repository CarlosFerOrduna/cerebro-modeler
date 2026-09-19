import { parseArgs as parseNodeArgs } from 'node:util';

import { WRITE_MODES } from '../core/output/types';
import { CASE_TYPES } from '../core/utils/types';

import { OPTION_DEFS } from './option-catalog';
import { Prompt } from './prompt';
import { CliArgs, ParseArgsOptionSpec, PromptAnswers, RawArgValues } from './types';

export class ArgParser {
  static async parse(): Promise<CliArgs> {
    const argv = ArgParser.parseRawArgs(process.argv.slice(2));

    const answers: PromptAnswers = {};

    if (!argv.host) {
      answers.host = await Prompt.text('Enter database host:', input => (input.trim() !== '' ? true : 'Host is required.'));
    }

    if (!argv.user) {
      answers.user = await Prompt.text('Enter database user:', input => (input.trim() !== '' ? true : 'User is required.'));
    }

    if (!argv.password) {
      answers.password = await Prompt.password('Enter database password:');
    }

    if (!argv.database) {
      answers.database = await Prompt.text('Enter database name:', input => (input.trim() !== '' ? true : 'Database is required.'));
    }

    if (!argv.tables) {
      const allTables = await Prompt.confirm('No tables were specified. Do you want to generate models for all tables?', true);

      if (!allTables) {
        answers.tables = await Prompt.text('Enter table names (comma-separated):', input =>
          input.trim() !== '' ? true : 'Please specify at least one table.'
        );
      }
    }

    const tables = ArgParser.getString(argv, 'tables');
    const ignoreTables = ArgParser.getString(argv, 'ignoreTables');
    const port = Number(argv.port);

    return {
      engine: ArgParser.getChoice(argv, 'engine', ['mssql'] as const),
      host: (answers.host ?? ArgParser.getString(argv, 'host'))!,
      port: Number.isNaN(port) ? 1433 : port,
      user: (answers.user ?? ArgParser.getString(argv, 'user'))!,
      password: (answers.password ?? ArgParser.getString(argv, 'password'))!,
      database: (answers.database ?? ArgParser.getString(argv, 'database'))!,
      schema: ArgParser.getString(argv, 'schema')!,
      tables: answers.tables
        ? answers.tables.split(',').map(t => t.trim())
        : tables
          ? tables.split(',').map(t => t.trim())
          : [],
      output: ArgParser.getString(argv, 'output')!,
      ssl: ArgParser.getBoolean(argv, 'ssl'),
      writeMode: ArgParser.getChoice(argv, 'writeMode', WRITE_MODES),
      caseFile: ArgParser.getChoice(argv, 'caseFile', CASE_TYPES),
      caseClass: ArgParser.getChoice(argv, 'caseClass', ['pascal', 'camel', 'snake'] as const),
      caseProperty: ArgParser.getChoice(argv, 'caseProperty', ['pascal', 'camel', 'snake'] as const),
      prefixFile: ArgParser.getString(argv, 'prefixFile'),
      prefixClass: ArgParser.getString(argv, 'prefixClass'),
      prefixProperty: ArgParser.getString(argv, 'prefixProperty'),
      suffixFile: ArgParser.getString(argv, 'suffixFile'),
      suffixClass: ArgParser.getString(argv, 'suffixClass'),
      suffixProperty: ArgParser.getString(argv, 'suffixProperty'),
      fileExtension: ArgParser.getString(argv, 'fileExtension'),
      ignoreTables: ignoreTables ? ignoreTables.split(',').map(t => t.trim()) : [],
    };
  }

  private static getString(values: RawArgValues, name: string): string | undefined {
    const value = values[name];
    return typeof value === 'string' ? value : undefined;
  }

  private static getBoolean(values: RawArgValues, name: string): boolean {
    return values[name] === true;
  }

  /** `validateChoice` already guaranteed `values[name]` is one of `choices` before `parse()` runs. */
  private static getChoice<T extends string>(values: RawArgValues, name: string, choices: readonly T[]): T {
    const value = values[name];
    if (typeof value === 'string' && choices.some(choice => choice === value)) {
      return value as T;
    }

    throw new Error(`Expected --${name} to be one of: ${choices.join(', ')}.`);
  }

  private static parseRawArgs(rawArgs: string[]): RawArgValues {
    const { values } = parseNodeArgs({
      args: ArgParser.expandLongAliases(rawArgs),
      options: ArgParser.buildParseArgsOptions(),
      strict: false,
    });

    if (values.help) {
      ArgParser.printHelp();
      process.exit(0);
    }

    for (const def of OPTION_DEFS) {
      const value = values[def.name];
      if (def.choices && typeof value === 'string') {
        ArgParser.validateChoice(def.name, value, def.choices);
      }
    }

    // node:util's typings for parseArgs can't infer a precise per-option result type from an
    // options object built at runtime (buildParseArgsOptions), so this is the one unavoidable
    // seam between its generic result and this module's own RawArgValues shape.
    return values as RawArgValues;
  }

  private static expandLongAliases(rawArgs: string[]): string[] {
    return rawArgs.map(arg => {
      const matchingDef = OPTION_DEFS.find(def => def.alias && (arg === `--${def.alias}` || arg.startsWith(`--${def.alias}=`)));
      if (!matchingDef) return arg;

      const equalsIndex = arg.indexOf('=');
      if (equalsIndex === -1) return `--${matchingDef.name}`;

      return `--${matchingDef.name}=${arg.slice(equalsIndex + 1)}`;
    });
  }

  private static buildParseArgsOptions(): Record<string, ParseArgsOptionSpec> {
    const options: Record<string, ParseArgsOptionSpec> = {};

    for (const def of OPTION_DEFS) {
      options[def.name] = {
        type: def.type,
        ...(def.short ? { short: def.short } : {}),
        ...(def.default !== undefined ? { default: def.default } : {}),
      };
    }

    return options;
  }

  private static printHelp(): void {
    console.log('Usage: cerebro-modeler [options]\n');

    for (const def of OPTION_DEFS) {
      const flags = [`--${def.name}`, def.short ? `-${def.short}` : undefined, def.alias ? `--${def.alias}` : undefined]
        .filter(Boolean)
        .join(', ');

      const meta = [
        def.choices ? `[choices: ${def.choices.join(', ')}]` : undefined,
        def.default !== undefined ? `[default: ${JSON.stringify(def.default)}]` : undefined,
      ]
        .filter(Boolean)
        .join(' ');

      console.log(`  ${flags}\n      ${def.description}${meta ? ` ${meta}` : ''}`);
    }
  }

  private static validateChoice(name: string, value: string, choices: readonly string[]): void {
    if (!choices.includes(value)) {
      throw new Error(`Invalid value "${value}" for --${name}. Expected one of: ${choices.join(', ')}.`);
    }
  }
}
