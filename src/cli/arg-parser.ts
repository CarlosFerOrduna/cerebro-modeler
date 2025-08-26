import inquirer, { DistinctQuestion } from 'inquirer';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export interface CliArgs {
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
}

type PromptAnswers = Partial<Pick<CliArgs, 'host' | 'user' | 'password' | 'database' | 'writeMode'>> & {
  tables?: string;
  allTables?: boolean;
};

export const parseArgs = async (): Promise<CliArgs> => {
  const argv = yargs(hideBin(process.argv))
    .scriptName('cerebro-modeler')
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
    .option('write-mode', {
      alias: 'w',
      choices: ['inline', 'out'] as const,
      description: 'Write strategy: "inline" to overwrite project entities, "out" to export to standalone folder',
      default: 'out',
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

  if (!argv.writeMode) {
    questions.push({
      type: 'list',
      name: 'writeMode',
      message: 'Where should the generated entities be saved?',
      choices: [
        { name: 'Export to ./out directory', value: 'out' },
        { name: 'Replace existing entities in current project', value: 'inline' },
      ],
      default: 'out',
    });
  }

  const answers = await inquirer.prompt<PromptAnswers>(questions);

  return {
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
  };
};
