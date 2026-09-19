export const CASE_TYPES = ['pascal', 'camel', 'snake', 'kebab'] as const;

export type CaseType = (typeof CASE_TYPES)[number];
