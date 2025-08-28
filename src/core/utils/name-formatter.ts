export class NameFormatter {
  static toCamelCase(str: string): string {
    const words = this.splitWords(str);
    return [words[0].toLowerCase(), ...words.slice(1).map(this.capitalize)].join('');
  }

  static toPascalCase(str: string): string {
    return this.splitWords(str).map(this.capitalize).join('');
  }

  static toSnakeCase(str: string): string {
    return this.splitWords(str)
      .map(w => w.toLowerCase())
      .join('_');
  }

  static toKebabCase(str: string): string {
    return this.splitWords(str)
      .map(w => w.toLowerCase())
      .join('-');
  }

  static applyCase(str: string, caseType: 'camel' | 'pascal' | 'snake' | 'kebab'): string {
    switch (caseType) {
      case 'camel':
        return this.toCamelCase(str);
      case 'pascal':
        return this.toPascalCase(str);
      case 'snake':
        return this.toSnakeCase(str);
      case 'kebab':
        return this.toKebabCase(str);
    }
  }

  static applyAffixes(str: string, prefix?: string, suffix?: string): string {
    return `${prefix ?? ''}${str}${suffix ?? ''}`;
  }

  static formatName(
    raw: string,
    caseType: 'camel' | 'pascal' | 'snake' | 'kebab',
    prefix?: string,
    suffix?: string,
    fileExtension?: string
  ): string {
    const result = this.applyCase(this.applyAffixes(raw, prefix, suffix), caseType);
    return fileExtension ? `${result}.${fileExtension}` : result;
  }

  private static splitWords(str: string): string[] {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[-_]/g, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
  }

  private static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}
