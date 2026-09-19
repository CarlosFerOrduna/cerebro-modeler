export interface ColumnRow {
  tableName: string;
  columnName: string;
  dataType: string;
  isNullable: boolean;
  isIdentity: boolean;
  // max_length/precision/scale are NOT NULL in sys.columns (type-appropriate defaults, e.g. 0,
  // when the concept doesn't apply); only defaultValue can be SQL NULL, via the LEFT JOIN below.
  maxLength: number;
  precision: number;
  scale: number;
  defaultValue: string | null;
}

export interface PrimaryKeyRow {
  pkName: string;
  tableName: string;
  columnName: string;
}

export interface IndexRow {
  tableName: string;
  indexName: string;
  isUnique: boolean;
  // fetchIndexes filters `WHERE i.is_primary_key = 0`, so this is always false in practice, and
  // builder.ts never reads it (it hardcodes isPrimaryKey: false itself). Kept for fidelity to the
  // real row shape, not because anything downstream depends on it.
  isPrimaryKey: boolean;
  columnName: string;
}

export interface ForeignKeyRow {
  fkName: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
}

export interface PrimaryKeyGroup {
  tableName: string;
  pkName: string;
  columns: string[];
}

export interface IndexGroup {
  tableName: string;
  indexName: string;
  isPrimaryKey: boolean;
  isUnique: boolean;
  columns: string[];
}
