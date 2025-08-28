import sql, { ConnectionPool, config as SqlConfig } from 'mssql';
import { CliArgs } from '../../../cli/arg-parser';
import { Database, MssqlReader } from '../../schema';
import { DatabaseDriver } from './database-driver';

export class MssqlDriver extends DatabaseDriver {
  private pool: ConnectionPool | null = null;

  constructor(
    private args: CliArgs,
    private reader = new MssqlReader()
  ) {
    super();
  }

  async connect(): Promise<void> {
    if (this.pool) {
      this.log('✔ Reusing existing database connection');
      return;
    }

    const config: SqlConfig = {
      user: this.args.user,
      password: this.args.password,
      server: this.args.host,
      port: this.args.port,
      database: this.args.database,
      options: {
        encrypt: this.args.ssl,
        trustServerCertificate: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    try {
      this.pool = await sql.connect(config);
      this.log('✔ Connected to database');
    } catch (err) {
      throw new Error(`✖ Failed to connect to database: ${(err as Error).message}`);
    }
  }

  getConnection(): ConnectionPool {
    if (!this.pool) {
      throw new Error('No active MSSQL connection');
    }
    return this.pool;
  }

  async readSchema(schema: string, tables: string[]): Promise<Database> {
    return this.reader.read(this.getConnection(), schema, tables);
  }

  async close(): Promise<void> {
    if (!this.pool) {
      this.log('✔ No database connection to close');
      return;
    }

    await this.pool.close();
    this.pool = null;
    this.log('✔ Database connection closed');
  }
}
