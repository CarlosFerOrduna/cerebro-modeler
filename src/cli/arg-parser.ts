import { parseArgs as parseNodeArgs } from 'node:util';

import { Prompt } from './prompt';

export interface CliArgs {
  engine?: 'mssql';
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  schema: string;
  tables: string[];
  ignoreTables: string[];
  output: string;
  ssl: boolean;
  writeMode: 'inline' | 'out';
  caseFile: 'pascal' | 'camel' | 'snake' | 'kebab';
  caseClass: 'pascal' | 'camel' | 'snake';
  caseProperty: 'pascal' | 'camel' | 'snake';
  prefixFile?: string;
  prefixClass?: string;
  prefixProperty?: string;
  suffixFile?: string;
  suffixClass?: string;
  suffixProperty?: string;
  fileExtension?: string;
}

interface OptionDef {
  name: string;
  short?: string;
  alias?: string;
  type: 'string' | 'boolean';
  default?: string | boolean;
  choices?: readonly string[];
  description: string;
}

type RawArgValues = Record<string, string | boolean | undefined>;

type PromptAnswers = Partial<Pick<CliArgs, 'host' | 'user' | 'password' | 'database' | 'writeMode'>> & {
  tables?: string;
};

export class ArgParser {
  private static readonly OPTION_DEFS: OptionDef[] = [
    { name: 'engine', short: 'e', type: 'string', default: 'mssql', choices: ['mssql'], description: 'Database engine' },
    { name: 'host', short: 'h', type: 'string', description: 'Database host' },
    { name: 'port', short: 'p', type: 'string', default: '1433', description: 'Database port' },
    { name: 'user', short: 'u', type: 'string', description: 'Database user' },
    { name: 'password', short: 'x', type: 'string', description: 'Database password' },
    { name: 'database', short: 'd', type: 'string', description: 'Database name' },
    { name: 'schema', short: 's', type: 'string', default: 'dbo', description: 'Schema name' },
    { name: 'tables', short: 't', type: 'string', description: 'List of tables to generate (comma-separated)' },
    { name: 'output', short: 'o', type: 'string', default: './out', description: 'Output directory for generated files' },
    { name: 'ssl', type: 'boolean', default: false, description: 'Use SSL connection to the database' },
    {
      name: 'writeMode',
      short: 'w',
      type: 'string',
      default: 'out',
      choices: ['inline', 'out'],
      description: 'Write strategy: "inline" to overwrite project entities, "out" to export to standalone folder',
    },
    {
      name: 'caseFile',
      alias: 'cf',
      type: 'string',
      default: 'pascal',
      choices: ['pascal', 'camel', 'snake', 'kebab'],
      description: 'Naming convention for generated file names (e.g., MyEntity.ts, myEntity.ts, my_entity.ts)',
    },
    {
      name: 'caseClass',
      alias: 'cc',
      type: 'string',
      default: 'pascal',
      choices: ['pascal', 'camel', 'snake'],
      description: 'Naming convention for class names inside entity files (e.g., MyEntity, myEntity, my_entity)',
    },
    {
      name: 'caseProperty',
      alias: 'cp',
      type: 'string',
      default: 'camel',
      choices: ['pascal', 'camel', 'snake'],
      description: 'Naming convention for property names in entity fields (e.g., createdAt, CreatedAt, created_at)',
    },
    { name: 'prefixFile', alias: 'pf', type: 'string', description: 'Optional prefix for generated file names (e.g., "I" -> IMyEntity.ts)' },
    { name: 'suffixFile', alias: 'sf', type: 'string', description: 'Optional suffix for generated file names (e.g., ".model" -> MyEntity.model.ts)' },
    { name: 'prefixClass', alias: 'pc', type: 'string', description: 'Optional prefix for class names (e.g., "I" -> IMyEntity)' },
    { name: 'suffixClass', alias: 'sc', type: 'string', description: 'Optional suffix for class names (e.g., "Model" -> MyEntityModel)' },
    { name: 'prefixProperty', alias: 'pp', type: 'string', description: 'Optional prefix for property names (e.g., "_" -> _createdAt)' },
    { name: 'suffixProperty', alias: 'sp', type: 'string', description: 'Optional suffix for property names (e.g., "_" -> createdAt_)' },
    { name: 'fileExtension', alias: 'fe', type: 'string', description: 'Optional suffix for generated file names before ".ts" (e.g., "entity" -> user.entity.ts)' },
    { name: 'ignoreTables', alias: 'it', type: 'string', description: 'List of tables to ignore (comma-separated)' },
    { name: 'help', type: 'boolean', default: false, description: 'Show this help message' },
  ];

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

    const port = Number(argv.port);

    return {
      engine: argv.engine as 'mssql',
      host: (answers.host ?? (argv.host as string))!,
      port: Number.isNaN(port) ? 1433 : port,
      user: (answers.user ?? (argv.user as string))!,
      password: (answers.password ?? (argv.password as string))!,
      database: (answers.database ?? (argv.database as string))!,
      schema: argv.schema as string,
      tables: answers.tables
        ? answers.tables.split(',').map(t => t.trim())
        : argv.tables
          ? (argv.tables as string).split(',').map(t => t.trim())
          : [],
      output: argv.output as string,
      ssl: argv.ssl as boolean,
      writeMode: argv.writeMode as 'inline' | 'out',
      caseFile: argv.caseFile as 'pascal' | 'camel' | 'snake' | 'kebab',
      caseClass: argv.caseClass as 'pascal' | 'camel' | 'snake',
      caseProperty: argv.caseProperty as 'pascal' | 'camel' | 'snake',
      prefixFile: argv.prefixFile as string | undefined,
      prefixClass: argv.prefixClass as string | undefined,
      prefixProperty: argv.prefixProperty as string | undefined,
      suffixFile: argv.suffixFile as string | undefined,
      suffixClass: argv.suffixClass as string | undefined,
      suffixProperty: argv.suffixProperty as string | undefined,
      fileExtension: argv.fileExtension as string | undefined,
      ignoreTables: argv.ignoreTables ? (argv.ignoreTables as string).split(',').map(t => t.trim()) : [],
    };
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

    for (const def of ArgParser.OPTION_DEFS) {
      if (def.choices && values[def.name] !== undefined) {
        ArgParser.validateChoice(def.name, values[def.name] as string, def.choices);
      }
    }

    return values as RawArgValues;
  }

  private static expandLongAliases(rawArgs: string[]): string[] {
    return rawArgs.map(arg => {
      const matchingDef = ArgParser.OPTION_DEFS.find(
        def => def.alias && (arg === `--${def.alias}` || arg.startsWith(`--${def.alias}=`))
      );
      if (!matchingDef) return arg;

      const equalsIndex = arg.indexOf('=');
      if (equalsIndex === -1) return `--${matchingDef.name}`;

      return `--${matchingDef.name}=${arg.slice(equalsIndex + 1)}`;
    });
  }

  private static buildParseArgsOptions(): Record<string, { type: 'string' | 'boolean'; short?: string; default?: string | boolean }> {
    const options: Record<string, { type: 'string' | 'boolean'; short?: string; default?: string | boolean }> = {};

    for (const def of ArgParser.OPTION_DEFS) {
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

    for (const def of ArgParser.OPTION_DEFS) {
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
