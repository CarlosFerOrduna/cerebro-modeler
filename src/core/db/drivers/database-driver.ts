import { ConnectionPool } from 'mssql';
import { Database } from '../../schema';

export abstract class DatabaseDriver {
  abstract connect(): Promise<void>;

  abstract getConnection(): ConnectionPool;

  abstract readSchema(schema: string, tables: string[], ignoreTables: string[]): Promise<Database>;

  abstract close(): Promise<void>;

  protected log(...args: unknown[]) {
    console.log('[DB]', ...args);
  }
}
