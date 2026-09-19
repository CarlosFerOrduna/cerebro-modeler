import { MssqlSchemaBuilder } from './builder';

describe('MssqlSchemaBuilder.buildDatabase', () => {
  it('returns an empty database for empty input', () => {
    const builder = new MssqlSchemaBuilder('dbo');
    const db = builder.buildDatabase([], [], [], []);

    expect(db.schema).toBe('dbo');
    expect(db.tables).toHaveLength(0);
  });

  it('builds a realistic two-table schema with a foreign key', () => {
    const builder = new MssqlSchemaBuilder('dbo');

    const columns = [
      {
        tableName: 'users',
        columnName: 'id',
        dataType: 'int',
        isNullable: false,
        isIdentity: true,
        maxLength: 4,
        precision: 10,
        scale: 0,
        defaultValue: null,
      },
      {
        tableName: 'users',
        columnName: 'name',
        dataType: 'nvarchar',
        isNullable: false,
        isIdentity: false,
        maxLength: 510,
        precision: 0,
        scale: 0,
        defaultValue: null,
      },
      {
        tableName: 'orders',
        columnName: 'id',
        dataType: 'int',
        isNullable: false,
        isIdentity: true,
        maxLength: 4,
        precision: 10,
        scale: 0,
        defaultValue: null,
      },
      {
        tableName: 'orders',
        columnName: 'userId',
        dataType: 'int',
        isNullable: false,
        isIdentity: false,
        maxLength: 4,
        precision: 10,
        scale: 0,
        defaultValue: null,
      },
    ];

    const primaryKeys = [
      { tableName: 'users', pkName: 'PK_users', columnName: 'id' },
      { tableName: 'orders', pkName: 'PK_orders', columnName: 'id' },
    ];

    const indexes = [
      { tableName: 'users', indexName: 'IX_users_name', isUnique: false, isPrimaryKey: false, columnName: 'name' },
      { tableName: 'orders', indexName: 'IX_orders_userId', isUnique: true, isPrimaryKey: false, columnName: 'userId' },
    ];

    const foreignKeys = [
      { fkName: 'FK_orders_users', sourceTable: 'orders', sourceColumn: 'userId', targetTable: 'users', targetColumn: 'id' },
    ];

    const db = builder.buildDatabase(columns, primaryKeys, indexes, foreignKeys);

    const users = db.getTableByName('users')!;
    const orders = db.getTableByName('orders')!;

    expect(db.tables).toHaveLength(2);
    expect(users.primaryColumns.map(c => c.name)).toEqual(['id']);
    expect(orders.primaryColumns.map(c => c.name)).toEqual(['id']);

    expect(orders.foreignKeys).toHaveLength(1);
    expect(orders.foreignKeys[0].sourceTable).toBe('orders');
    expect(orders.foreignKeys[0].targetTable).toBe('users');

    expect(users.inverseForeignKeys).toHaveLength(1);
    expect(users.inverseForeignKeys[0]).toBe(orders.foreignKeys[0]);

    const usersNameIndex = users.indexes.find(i => i.name === 'IX_users_name')!;
    expect(usersNameIndex.columns).toEqual(['name']);
    expect(usersNameIndex.isUnique).toBe(false);
    expect(usersNameIndex.isPrimaryKey).toBe(false);

    const ordersUserIdIndex = orders.indexes.find(i => i.name === 'IX_orders_userId')!;
    expect(ordersUserIdIndex.columns).toEqual(['userId']);
    expect(ordersUserIdIndex.isUnique).toBe(true);
    // isPrimaryKey is hardcoded to false by the builder for regular (non-PK) index rows, even though
    // this particular index happens to be unique; assert the current as-is behavior.
    expect(ordersUserIdIndex.isPrimaryKey).toBe(false);
  });

  it('groups a composite primary key spanning multiple rows into a single index', () => {
    const builder = new MssqlSchemaBuilder('dbo');

    const columns = [
      {
        tableName: 'order_items',
        columnName: 'orderId',
        dataType: 'int',
        isNullable: false,
        isIdentity: false,
        maxLength: 4,
        precision: 10,
        scale: 0,
        defaultValue: null,
      },
      {
        tableName: 'order_items',
        columnName: 'productId',
        dataType: 'int',
        isNullable: false,
        isIdentity: false,
        maxLength: 4,
        precision: 10,
        scale: 0,
        defaultValue: null,
      },
    ];

    const primaryKeys = [
      { tableName: 'order_items', pkName: 'PK_order_items', columnName: 'orderId' },
      { tableName: 'order_items', pkName: 'PK_order_items', columnName: 'productId' },
    ];

    const db = builder.buildDatabase(columns, primaryKeys, [], []);
    const table = db.getTableByName('order_items')!;

    expect(table.primaryColumns.map(c => c.name).sort()).toEqual(['orderId', 'productId']);

    const pkIndexes = table.indexes.filter(i => i.isPrimaryKey);
    expect(pkIndexes).toHaveLength(1);
    expect(pkIndexes[0].columns).toEqual(['orderId', 'productId']);
  });

  it('marks a column as unique when covered by a unique index row', () => {
    const builder = new MssqlSchemaBuilder('dbo');

    const columns = [
      {
        tableName: 'users',
        columnName: 'email',
        dataType: 'nvarchar',
        isNullable: false,
        isIdentity: false,
        maxLength: 510,
        precision: 0,
        scale: 0,
        defaultValue: null,
      },
    ];
    const indexes = [
      { tableName: 'users', indexName: 'UQ_users_email', isUnique: true, isPrimaryKey: false, columnName: 'email' },
    ];

    const db = builder.buildDatabase(columns, [], indexes, []);
    const table = db.getTableByName('users')!;

    expect(table.getColumn('email')!.isUnique).toBe(true);
  });

  it('does not throw on an orphan foreign key whose source table is missing, and still attaches the inverse side', () => {
    const builder = new MssqlSchemaBuilder('dbo');

    const columns = [
      {
        tableName: 'users',
        columnName: 'id',
        dataType: 'int',
        isNullable: false,
        isIdentity: true,
        maxLength: 4,
        precision: 10,
        scale: 0,
        defaultValue: null,
      },
    ];
    const foreignKeys = [
      { fkName: 'FK_ghost_users', sourceTable: 'ghost_table', sourceColumn: 'userId', targetTable: 'users', targetColumn: 'id' },
    ];

    expect(() => builder.buildDatabase(columns, [], [], foreignKeys)).not.toThrow();

    const db = builder.buildDatabase(columns, [], [], foreignKeys);
    const users = db.getTableByName('users')!;

    expect(db.getTableByName('ghost_table')).toBeUndefined();
    expect(users.inverseForeignKeys).toHaveLength(1);
    expect(users.inverseForeignKeys[0].sourceTable).toBe('ghost_table');
  });

  it('does not throw on an orphan primary key row whose table is missing, and leaves no bogus state', () => {
    const builder = new MssqlSchemaBuilder('dbo');

    const primaryKeys = [{ tableName: 'ghost_table', pkName: 'PK_ghost', columnName: 'id' }];

    expect(() => builder.buildDatabase([], primaryKeys, [], [])).not.toThrow();

    const db = builder.buildDatabase([], primaryKeys, [], []);
    expect(db.tables).toHaveLength(0);
  });

  it('maps column fields faithfully, coercing a null default value to undefined', () => {
    const builder = new MssqlSchemaBuilder('dbo');

    const columns = [
      {
        tableName: 'products',
        columnName: 'price',
        dataType: 'decimal',
        isNullable: true,
        defaultValue: null,
        isIdentity: false,
        maxLength: 9,
        precision: 10,
        scale: 2,
      },
    ];

    const db = builder.buildDatabase(columns, [], [], []);
    const col = db.getTableByName('products')!.getColumn('price')!;

    expect(col.name).toBe('price');
    expect(col.type).toBe('decimal');
    expect(col.isNullable).toBe(true);
    expect(col.defaultValue).toBeUndefined();
    expect(col.isIdentity).toBe(false);
    expect(col.length).toBe(9);
    expect(col.precision).toBe(10);
    expect(col.scale).toBe(2);
  });
});
