import { WRITE_MODES } from '../core/output/types';
import { CASE_TYPES } from '../core/utils/types';

import { ENGINE_CHOICES, IDENTIFIER_CASE_CHOICES, OptionDef } from './types';

export const OPTION_DEFS: readonly OptionDef[] = [
  { name: 'engine', short: 'e', type: 'string', default: 'mssql', choices: ENGINE_CHOICES, description: 'Database engine' },
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
    choices: WRITE_MODES,
    description: 'Write strategy: "inline" to overwrite project entities, "out" to export to standalone folder',
  },
  {
    name: 'caseFile',
    alias: 'cf',
    type: 'string',
    default: 'pascal',
    choices: CASE_TYPES,
    description: 'Naming convention for generated file names (e.g., MyEntity.ts, myEntity.ts, my_entity.ts)',
  },
  {
    name: 'caseClass',
    alias: 'cc',
    type: 'string',
    default: 'pascal',
    choices: IDENTIFIER_CASE_CHOICES,
    description: 'Naming convention for class names inside entity files (e.g., MyEntity, myEntity, my_entity)',
  },
  {
    name: 'caseProperty',
    alias: 'cp',
    type: 'string',
    default: 'camel',
    choices: IDENTIFIER_CASE_CHOICES,
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
