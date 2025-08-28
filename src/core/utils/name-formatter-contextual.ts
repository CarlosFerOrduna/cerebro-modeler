import { NameFormatter } from './name-formatter';

export interface NameFormatterOptions {
  file?: FileNamingOptions;
  class?: NamingOptions;
  property?: NamingOptions;
}

export interface FileNamingOptions extends NamingOptions {
  fileExtension?: string;
}

export interface NamingOptions {
  case: 'camel' | 'pascal' | 'snake' | 'kebab';
  prefix?: string;
  suffix?: string;
}

export class NameFormatterContextual {
  constructor(private options: NameFormatterOptions) {}

  toFileFormat(name: string): string {
    const config = this.options.file;
    if (!config) return name;

    return NameFormatter.formatName(name, config.case, config.prefix, config.suffix, config.fileExtension);
  }

  toClassFormat(name: string): string {
    return this.format(name, this.options.class);
  }

  toPropertyFormat(name: string): string {
    return this.format(name, this.options.property);
  }

  private format(name: string, config?: NamingOptions): string {
    if (!config) return name;
    return NameFormatter.formatName(name, config.case, config.prefix, config.suffix);
  }
}
