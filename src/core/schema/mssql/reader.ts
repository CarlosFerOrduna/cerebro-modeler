import { ConnectionPool } from 'mssql';
import { Database } from '../models/Database';
import { SchemaReader } from '../schema-reader';
import { MssqlSchemaBuilder } from './builder';
import { MssqlSchemaFetcher } from './fetcher';

export class MssqlReader implements SchemaReader {
  async read(pool: ConnectionPool, schema: string, tables: string[]): Promise<Database> {
    const fetcher = new MssqlSchemaFetcher(pool);
    const builder = new MssqlSchemaBuilder(schema);

    const [columns, pks, indexes, fks] = await Promise.all([
      fetcher.fetchColumns(schema, tables),
      fetcher.fetchPrimaryKeys(schema, tables),
      fetcher.fetchIndexes(schema, tables),
      fetcher.fetchForeignKeys(schema, tables),
    ]);

    return builder.buildDatabase(columns, pks, indexes, fks);
  }
}
