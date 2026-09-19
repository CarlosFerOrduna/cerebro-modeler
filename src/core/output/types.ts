export const WRITE_MODES = ['inline', 'out'] as const;

export type WriteMode = (typeof WRITE_MODES)[number];
