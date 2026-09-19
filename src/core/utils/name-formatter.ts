import { CaseType } from './types';

export class NameFormatter {
  static toCamelCase(str: string): string {
    const words = NameFormatter.splitWords(str);
    return [words[0].toLowerCase(), ...words.slice(1).map(NameFormatter.capitalize)].join('');
  }

  static toPascalCase(str: string): string {
    return NameFormatter.splitWords(str).map(NameFormatter.capitalize).join('');
  }

  static toSnakeCase(str: string): string {
    return NameFormatter.splitWords(str)
      .map(w => w.toLowerCase())
      .join('_');
  }

  static toKebabCase(str: string): string {
    return NameFormatter.splitWords(str)
      .map(w => w.toLowerCase())
      .join('-');
  }

  static applyCase(str: string, caseType: CaseType): string {
    switch (caseType) {
      case 'camel':
        return NameFormatter.toCamelCase(str);
      case 'pascal':
        return NameFormatter.toPascalCase(str);
      case 'snake':
        return NameFormatter.toSnakeCase(str);
      case 'kebab':
        return NameFormatter.toKebabCase(str);
    }
  }

  static applyAffixes(str: string, prefix?: string, suffix?: string): string {
    return `${prefix ?? ''}${str}${suffix ?? ''}`;
  }

  static formatName(
    raw: string,
    caseType: CaseType,
    prefix?: string,
    suffix?: string,
    fileExtension?: string
  ): string {
    const result = NameFormatter.applyAffixes(NameFormatter.applyCase(raw, caseType), prefix, suffix);
    return fileExtension ? `${result}.${fileExtension}` : result;
  }

  private static splitWords(str: string): string[] {
    return str
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
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
