import { NameFormatter } from './name-formatter';

describe('NameFormatter', () => {
  describe('toCamelCase', () => {
    it('converts snake_case', () => {
      expect(NameFormatter.toCamelCase('user_name')).toBe('userName');
    });

    it('converts PascalCase', () => {
      expect(NameFormatter.toCamelCase('UserName')).toBe('userName');
    });

    it('converts kebab-case', () => {
      expect(NameFormatter.toCamelCase('user-name')).toBe('userName');
    });

    it('splits acronyms correctly', () => {
      expect(NameFormatter.toCamelCase('HTTPServer')).toBe('httpServer');
    });
  });

  describe('toPascalCase', () => {
    it('converts snake_case', () => {
      expect(NameFormatter.toPascalCase('user_name')).toBe('UserName');
    });

    it('converts camelCase', () => {
      expect(NameFormatter.toPascalCase('UserName')).toBe('UserName');
    });

    it('converts kebab-case', () => {
      expect(NameFormatter.toPascalCase('user-name')).toBe('UserName');
    });

    it('splits acronyms correctly', () => {
      expect(NameFormatter.toPascalCase('HTTPServer')).toBe('HttpServer');
    });
  });

  describe('toSnakeCase', () => {
    it('converts camelCase', () => {
      expect(NameFormatter.toSnakeCase('UserName')).toBe('user_name');
    });

    it('converts kebab-case', () => {
      expect(NameFormatter.toSnakeCase('user-name')).toBe('user_name');
    });

    it('is idempotent on snake_case', () => {
      expect(NameFormatter.toSnakeCase('user_name')).toBe('user_name');
    });
  });

  describe('toKebabCase', () => {
    it('converts camelCase', () => {
      expect(NameFormatter.toKebabCase('UserName')).toBe('user-name');
    });

    it('converts snake_case', () => {
      expect(NameFormatter.toKebabCase('user_name')).toBe('user-name');
    });

    it('is idempotent on kebab-case', () => {
      expect(NameFormatter.toKebabCase('user-name')).toBe('user-name');
    });
  });

  describe('applyCase', () => {
    const cases: Array<['camel' | 'pascal' | 'snake' | 'kebab', string]> = [
      ['camel', 'userName'],
      ['pascal', 'UserName'],
      ['snake', 'user_name'],
      ['kebab', 'user-name'],
    ];

    it.each(cases)('dispatches %s to the matching toXCase conversion', (caseType, expected) => {
      expect(NameFormatter.applyCase('user_name', caseType)).toBe(expected);
    });
  });

  describe('applyAffixes', () => {
    it('concatenates prefix and suffix around the base string', () => {
      expect(NameFormatter.applyAffixes('user', 'pre_', '_post')).toBe('pre_user_post');
    });

    it('is a no-op when prefix and suffix are both omitted', () => {
      expect(NameFormatter.applyAffixes('user')).toBe('user');
    });
  });

  describe('formatName', () => {
    it('keeps a pure-separator prefix instead of dropping it (README example)', () => {
      expect(NameFormatter.formatName('created_at', 'camel', '_')).toBe('_createdAt');
    });

    it('keeps a letter prefix in its own casing, independent of the base casing', () => {
      expect(NameFormatter.formatName('user_account', 'pascal', 'I')).toBe('IUserAccount');
    });

    it('applies a suffix after casing the base name', () => {
      expect(NameFormatter.formatName('user', 'pascal', undefined, 'Entity')).toBe('UserEntity');
    });

    it('appends the file extension after casing and affixes', () => {
      expect(NameFormatter.formatName('user', 'kebab', undefined, undefined, 'entity')).toBe('user.entity');
    });

    it('omits the trailing dot when no file extension is given', () => {
      expect(NameFormatter.formatName('user', 'kebab')).toBe('user');
    });
  });
});
