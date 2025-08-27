import inquirer, { DistinctQuestion } from 'inquirer';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export interface CliArgs {
  engine?: 'mssql';
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  schema: string;
  tables: string[];
  output: string;
  ssl: boolean;
  verbose: boolean;
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
  fileExtension?: boolean;
}

type PromptAnswers = Partial<Pick<CliArgs, 'host' | 'user' | 'password' | 'database' | 'writeMode'>> & {
  tables?: string;
  allTables?: boolean;
};

export const parseArgs = async (): Promise<CliArgs> => {
  const argv = yargs(hideBin(process.argv))
    .scriptName('cerebro-modeler')
    .option('engine', {
      alias: 'e',
      choices: ['mssql'] as const,
      description: 'Database engine',
      default: 'mssql',
    })
    .option('host', {
      alias: 'h',
      type: 'string',
      description: 'Database host',
    })
    .option('port', {
      alias: 'p',
      type: 'number',
      description: 'Database port',
      default: 1433,
    })
    .option('user', {
      alias: 'u',
      type: 'string',
      description: 'Database user',
    })
    .option('password', {
      alias: 'x',
      type: 'string',
      description: 'Database password',
    })
    .option('database', {
      alias: 'd',
      type: 'string',
      description: 'Database name',
    })
    .option('schema', {
      alias: 's',
      type: 'string',
      description: 'Schema name',
      default: 'dbo',
    })
    .option('tables', {
      alias: 't',
      type: 'string',
      description: 'List of tables to generate (comma-separated)',
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      description: 'Output directory for generated files',
      default: './out',
    })
    .option('ssl', {
      type: 'boolean',
      description: 'Use SSL connection to the database',
      default: false,
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Enable verbose logging',
      default: false,
    })
    .option('writeMode', {
      alias: 'w',
      choices: ['inline', 'out'] as const,
      description: 'Write strategy: "inline" to overwrite project entities, "out" to export to standalone folder',
      default: 'out',
    })
    .option('caseFile', {
      alias: 'cf',
      choices: ['pascal', 'camel', 'snake', 'kebab'] as const,
      description: 'Naming convention for generated file names (e.g., MyEntity.ts, myEntity.ts, my_entity.ts)',
      default: 'pascal',
    })
    .option('caseClass', {
      alias: 'cc',
      choices: ['pascal', 'camel', 'snake'] as const,
      description: 'Naming convention for class names inside entity files (e.g., MyEntity, myEntity, my_entity)',
      default: 'pascal',
    })
    .option('caseProperty', {
      alias: 'cp',
      choices: ['pascal', 'camel', 'snake'] as const,
      description: 'Naming convention for property names in entity fields (e.g., createdAt, CreatedAt, created_at)',
      default: 'camel',
    })
    .option('prefixFile', {
      alias: 'pf',
      type: 'string',
      description: 'Optional prefix for generated file names (e.g., "I" → IMyEntity.ts)',
    })
    .option('suffixFile', {
      alias: 'sf',
      type: 'string',
      description: 'Optional suffix for generated file names (e.g., ".model" → MyEntity.model.ts)',
    })
    .option('prefixClass', {
      alias: 'pc',
      type: 'string',
      description: 'Optional prefix for class names (e.g., "I" → IMyEntity)',
    })
    .option('suffixClass', {
      alias: 'sc',
      type: 'string',
      description: 'Optional suffix for class names (e.g., "Model" → MyEntityModel)',
    })
    .option('prefixProperty', {
      alias: 'pp',
      type: 'string',
      description: 'Optional prefix for property names (e.g., "_" → _createdAt)',
    })
    .option('suffixProperty', {
      alias: 'sp',
      type: 'string',
      description: 'Optional suffix for property names (e.g., "_" → createdAt_)',
    })
    .option('file-extension', {
      alias: 'fs',
      type: 'boolean',
      description: 'Treat the file suffix as a file extension (e.g "entity" → user.entity.ts instead of userEntity.ts)',
      default: false,
    })
    .help()
    .parseSync();

  const questions: DistinctQuestion<PromptAnswers>[] = [];

  if (!argv.host) {
    questions.push({
      type: 'input',
      name: 'host',
      message: 'Enter database host:',
      validate: input => input.trim() !== '' || 'Host is required.',
    });
  }

  if (!argv.user) {
    questions.push({
      type: 'input',
      name: 'user',
      message: 'Enter database user:',
      validate: input => input.trim() !== '' || 'User is required.',
    });
  }

  if (!argv.password) {
    questions.push({
      type: 'password',
      name: 'password',
      message: 'Enter database password:',
      mask: '*',
    });
  }

  if (!argv.database) {
    questions.push({
      type: 'input',
      name: 'database',
      message: 'Enter database name:',
      validate: input => input.trim() !== '' || 'Database is required.',
    });
  }

  if (!argv.tables) {
    questions.push({
      type: 'confirm',
      name: 'allTables',
      message: 'No tables were specified. Do you want to generate models for all tables?',
      default: true,
    });

    questions.push({
      type: 'input',
      name: 'tables',
      message: 'Enter table names (comma-separated):',
      when: answers => answers.allTables === false,
      validate: input => input.trim() !== '' || 'Please specify at least one table.',
    });
  }

  const answers = await inquirer.prompt<PromptAnswers>(questions);

  return {
    engine: argv.engine as 'mssql',
    host: (answers.host ?? argv.host)!,
    port: argv.port,
    user: (answers.user ?? argv.user)!,
    password: (answers.password ?? argv.password)!,
    database: (answers.database ?? argv.database)!,
    schema: argv.schema,
    tables: answers.tables
      ? answers.tables.split(',').map(t => t.trim())
      : argv.tables
        ? argv.tables.split(',').map(t => t.trim())
        : [],
    output: argv.output,
    ssl: argv.ssl,
    verbose: argv.verbose,
    writeMode: (answers.writeMode ?? argv.writeMode) as 'inline' | 'out',
    caseFile: argv.caseFile as 'pascal' | 'camel' | 'snake' | 'kebab',
    caseClass: argv.caseClass as 'pascal' | 'camel' | 'snake',
    caseProperty: argv.caseProperty as 'pascal' | 'camel' | 'snake',
    prefixFile: argv.prefixFile,
    prefixClass: argv.prefixClass,
    prefixProperty: argv.prefixProperty,
    suffixFile: argv.suffixFile,
    suffixClass: argv.suffixClass,
    suffixProperty: argv.suffixProperty,
    fileExtension: argv.fileExtension,
  };
};
