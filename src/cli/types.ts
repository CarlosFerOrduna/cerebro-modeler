import { WriteMode } from '../core/output/types';
import { CaseType } from '../core/utils/types';

export const ENGINE_CHOICES = ['mssql'] as const;

export type EngineChoice = (typeof ENGINE_CHOICES)[number];

export const IDENTIFIER_CASE_CHOICES = ['pascal', 'camel', 'snake'] as const;

export type IdentifierCaseChoice = (typeof IDENTIFIER_CASE_CHOICES)[number];

export interface CliArgs {
  engine?: EngineChoice;
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
  writeMode: WriteMode;
  caseFile: CaseType;
  caseClass: IdentifierCaseChoice;
  caseProperty: IdentifierCaseChoice;
  prefixFile?: string;
  prefixClass?: string;
  prefixProperty?: string;
  suffixFile?: string;
  suffixClass?: string;
  suffixProperty?: string;
  fileExtension?: string;
}

export interface OptionDef {
  name: string;
  short?: string;
  alias?: string;
  type: 'string' | 'boolean';
  default?: string | boolean;
  choices?: readonly string[];
  description: string;
}

export interface ParseArgsOptionSpec {
  type: 'string' | 'boolean';
  short?: string;
  default?: string | boolean;
}

export type RawArgValues = Record<string, string | boolean | undefined>;

export type PromptAnswers = Partial<Pick<CliArgs, 'host' | 'user' | 'password' | 'database' | 'writeMode'>> & {
  tables?: string;
};
