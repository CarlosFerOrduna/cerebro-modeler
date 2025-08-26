import sql, { ConnectionPool, config as SqlConfig } from 'mssql';
import { CliArgs } from '../cli/arg-parser';

export class DB {
  private static pool: ConnectionPool | null = null;

  static async getPool(args: CliArgs): Promise<ConnectionPool> {
    if (DB.pool) {
      if (args.verbose) console.log('✔ Reusing existing database connection');
      return DB.pool;
    }

    const config: SqlConfig = {
      user: args.user,
      password: args.password,
      server: args.host,
      port: args.port,
      database: args.database,
      options: {
        encrypt: args.ssl,
        trustServerCertificate: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    if (args.verbose) {
      console.log('[DB] Connecting with config:', {
        ...config,
        password: '*****',
      });
    }

    try {
      DB.pool = await sql.connect(config);
      if (args.verbose) console.log('[DB] Connected to database');
      return DB.pool;
    } catch (err) {
      throw new Error(`✖ Failed to connect to database: ${(err as Error).message}`);
    }
  }

  static async close(verbose = false) {
    try {
      if (!DB.pool) {
        if (verbose) console.log('✔ No database connection to close');
        return;
      }

      await DB.pool.close();
      DB.pool = null;

      if (verbose) console.log('✔ Database connection closed');
    } catch (err) {
      console.error('✖ Error closing database connection:', err);
    }
  }
}
