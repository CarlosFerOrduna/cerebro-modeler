import pluralize from 'pluralize';

import { NameFormatterContextual } from './name-formatter-contextual';

describe('NameFormatterContextual', () => {
  describe('when the matching config key is absent', () => {
    const formatter = new NameFormatterContextual({});

    it('toFileFormat returns the input unchanged', () => {
      expect(formatter.toFileFormat('userAccount')).toBe('userAccount');
    });

    it('toClassFormat returns the input unchanged', () => {
      expect(formatter.toClassFormat('userAccount')).toBe('userAccount');
    });

    it('toPropertyFormat returns the input unchanged', () => {
      expect(formatter.toPropertyFormat('userAccount')).toBe('userAccount');
    });
  });

  it('toFileFormat applies case, affixes and file extension', () => {
    const formatter = new NameFormatterContextual({
      file: { case: 'kebab', prefix: 'i-', suffix: '-model', fileExtension: 'entity' },
    });

    expect(formatter.toFileFormat('userAccount')).toBe('i-user-account-model.entity');
  });

  it('toClassFormat applies case and affixes independently of base casing', () => {
    const formatter = new NameFormatterContextual({
      class: { case: 'pascal', prefix: 'I', suffix: 'Entity' },
    });

    expect(formatter.toClassFormat('user_account')).toBe('IUserAccountEntity');
  });

  it('toPropertyFormat applies case', () => {
    const formatter = new NameFormatterContextual({
      property: { case: 'camel' },
    });

    expect(formatter.toPropertyFormat('created_at')).toBe('createdAt');
  });

  describe('toPluralPropertyFormat', () => {
    it('pluralizes a regular multi-word name', () => {
      const formatter = new NameFormatterContextual({ property: { case: 'camel' } });
      expect(formatter.toPluralPropertyFormat('order_item')).toBe(pluralize('orderItem'));
    });

    it('pluralizes an irregular word correctly', () => {
      const formatter = new NameFormatterContextual({ property: { case: 'camel' } });
      expect(formatter.toPluralPropertyFormat('category')).toBe(pluralize('category'));
    });

    it('falls back to pluralizing the raw name when no property config is set', () => {
      const formatter = new NameFormatterContextual({});
      expect(formatter.toPluralPropertyFormat('order')).toBe(pluralize('order'));
    });
  });
});
