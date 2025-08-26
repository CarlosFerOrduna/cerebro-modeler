import { ConnectionPool } from 'mssql';
import { Database } from './models/Database';

export interface SchemaReader {
  read(connection: ConnectionPool, schema: string, tables?: string[]): Promise<Database>;
}
