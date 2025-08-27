import { CliArgs } from '../../cli/arg-parser';
import { DatabaseDriver, MssqlDriver } from './drivers';

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
