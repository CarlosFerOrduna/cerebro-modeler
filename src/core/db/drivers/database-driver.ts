import { ConnectionPool } from 'mssql';
import { Database } from '../../schema';

export abstract class DatabaseDriver {
  constructor(protected verbose: boolean = false) {}

  abstract connect(): Promise<void>;

  abstract getConnection(): ConnectionPool;

  abstract readSchema(schema: string, tables: string[]): Promise<Database>;

  abstract close(): Promise<void>;

  protected log(...args: unknown[]) {
    if (this.verbose) console.log('[DB]', ...args);
  }
}
