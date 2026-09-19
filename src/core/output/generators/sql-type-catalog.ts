// Checked via `.includes(dynamicString)` against a plain `string`, so these stay `string[]`
// rather than `as const` tuples, which would reject that wider argument under `strict`.
export const LENGTHLESS_SQL_TYPES: readonly string[] = ['datetime', 'datetime2', 'bit', 'date', 'int', 'bigint', 'smallint'];

export const NUMBER_SQL_TYPES: readonly string[] = ['int', 'decimal', 'float', 'bigint', 'smallint', 'numeric', 'money'];

export const BOOLEAN_SQL_TYPES: readonly string[] = ['bit'];

export const DATE_SQL_TYPES: readonly string[] = ['datetime', 'date', 'smalldatetime', 'timestamp'];
