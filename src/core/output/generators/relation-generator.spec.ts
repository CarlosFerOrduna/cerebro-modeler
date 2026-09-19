import { ForeignKey, Table } from '../../schema';
import { NameFormatterContextual } from '../../utils';

import { RelationGenerator } from './relation-generator';

function makeFormatter(): NameFormatterContextual {
  return new NameFormatterContextual({
    class: { case: 'pascal' },
    property: { case: 'camel' },
  });
}

describe('RelationGenerator', () => {
  it('many-to-one falls back to toPluralPropertyFormat(table.name) when relationContext is empty', () => {
    const fk = new ForeignKey('FK_orders_users', 'orders', ['userId'], 'users', ['id']);
    const orders = new Table('orders', 'dbo', [], [fk]);
    const used = new Set<string>();
    const relationContext = new Map<string, string>();

    const generator = new RelationGenerator(orders, used, makeFormatter(), relationContext);
    const [line] = generator.generate();

    expect(line).toBe(
      '\t@ManyToOne(() => Users, user => user.orders)\n' +
        "\t@JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])\n" +
        '\tuser: Users;'
    );
    expect(used.has('ManyToOne')).toBe(true);
    expect(used.has('JoinColumn')).toBe(true);
    expect(relationContext.size).toBe(0);
  });

  it('many-to-one uses the stored inverse name from relationContext instead of the fallback', () => {
    const fk = new ForeignKey('FK_orders_users', 'orders', ['userId'], 'users', ['id']);
    const orders = new Table('orders', 'dbo', [], [fk]);
    const used = new Set<string>();
    const relationContext = new Map<string, string>([['orders.userId', 'placedOrders']]);

    const generator = new RelationGenerator(orders, used, makeFormatter(), relationContext);
    const [line] = generator.generate();

    expect(line).toBe(
      '\t@ManyToOne(() => Users, user => user.placedOrders)\n' +
        "\t@JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])\n" +
        '\tuser: Users;'
    );
  });

  it('one-to-many generates the expected line, tracks OneToMany usage, and writes relationContext', () => {
    const fk = new ForeignKey('FK_orders_users', 'orders', ['userId'], 'users', ['id']);
    const users = new Table('users', 'dbo', [], [], [], [fk]);
    const used = new Set<string>();
    const relationContext = new Map<string, string>();

    const generator = new RelationGenerator(users, used, makeFormatter(), relationContext);
    const [line] = generator.generate();

    expect(line).toBe('\t@OneToMany(() => Orders, orders => orders.user)\n\torders: Orders[];');
    expect(used.has('OneToMany')).toBe(true);
    expect(relationContext.get('orders.userId')).toBe('orders');
  });

  it('suffixes the second property when two FKs from the same source table target the same table', () => {
    const fkBilling = new ForeignKey('FK_orders_billingUser', 'orders', ['billingUserId'], 'users', ['id']);
    const fkShipping = new ForeignKey('FK_orders_shippingUser', 'orders', ['shippingUserId'], 'users', ['id']);
    const users = new Table('users', 'dbo', [], [], [], [fkBilling, fkShipping]);
    const used = new Set<string>();
    const relationContext = new Map<string, string>();

    const generator = new RelationGenerator(users, used, makeFormatter(), relationContext);
    const [firstLine, secondLine] = generator.generate();

    expect(firstLine).toContain('orders: Orders[]');
    expect(secondLine).toContain('orders2: Orders[]');
    expect(relationContext.get('orders.billingUserId')).toBe('orders');
    expect(relationContext.get('orders.shippingUserId')).toBe('orders2');
  });

  it('a many-to-one lookup for the suffixed relation picks up the suffixed name, not the plain fallback', () => {
    const relationContext = new Map<string, string>([
      ['orders.billingUserId', 'orders'],
      ['orders.shippingUserId', 'orders2'],
    ]);

    const fkShipping = new ForeignKey('FK_orders_shippingUser', 'orders', ['shippingUserId'], 'users', ['id']);
    const orders = new Table('orders', 'dbo', [], [fkShipping]);
    const used = new Set<string>();

    const generator = new RelationGenerator(orders, used, makeFormatter(), relationContext);
    const [line] = generator.generate();

    // The plain fallback would be toPluralPropertyFormat('orders') === 'orders'; the suffixed
    // context entry ('orders2') must win instead, proving the context lookup is actually used.
    expect(line).toContain('shippingUser => shippingUser.orders2');
  });

  it('generate() emits all many-to-one entries before any one-to-many entries', () => {
    const outgoingFk = new ForeignKey('FK_orders_users', 'orders', ['userId'], 'users', ['id']);
    const incomingFk = new ForeignKey('FK_items_orders', 'order_items', ['orderId'], 'orders', ['id']);
    const orders = new Table('orders', 'dbo', [], [outgoingFk], [], [incomingFk]);
    const used = new Set<string>();
    const relationContext = new Map<string, string>();

    const generator = new RelationGenerator(orders, used, makeFormatter(), relationContext);
    const lines = generator.generate();

    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('@ManyToOne');
    expect(lines[1]).toContain('@OneToMany');
  });
});
