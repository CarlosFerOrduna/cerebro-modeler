import { CliArgs } from '../../cli/arg-parser';
import { DatabaseDriver } from './drivers/database-driver';
import { MssqlDriver } from './drivers/mssql-driver';

export class DriverFactory {
  static create(args: CliArgs): DatabaseDriver {
    switch (args.engine) {
      case 'mssql':
        return new MssqlDriver(args);

      default:
        throw new Error(`Unsupported database engine: ${args.engine}`);
    }
  }
}
