import { ConnectionPool } from 'mssql';
import { Database } from '../models/Database';
import { SchemaReader } from '../schema-reader';
import { MssqlSchemaBuilder } from './builder';
import { MssqlSchemaFetcher } from './fetcher';

export class MssqlReader implements SchemaReader {
  async read(pool: ConnectionPool, schema: string, tables: string[], ignoreTables: string[]): Promise<Database> {
    const fetcher = new MssqlSchemaFetcher(pool);
    const builder = new MssqlSchemaBuilder(schema);

    const [columns, pks, indexes, fks] = await Promise.all([
      fetcher.fetchColumns(schema, tables, ignoreTables),
      fetcher.fetchPrimaryKeys(schema, tables, ignoreTables),
      fetcher.fetchIndexes(schema, tables, ignoreTables),
      fetcher.fetchForeignKeys(schema, tables, ignoreTables),
    ]);

    return builder.buildDatabase(columns, pks, indexes, fks);
  }
}
