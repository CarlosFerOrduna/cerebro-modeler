import { Column } from '../../schema/models/Column';
import { ForeignKey } from '../../schema/models/ForeignKey';
import { Index } from '../../schema/models/Index';
import { Table } from '../../schema/models/Table';
import { NameFormatterContextual } from '../../utils/name-formatter-contextual';

import { PropertyGenerator } from './property-generator';

function makeFormatter(): NameFormatterContextual {
  return new NameFormatterContextual({ property: { case: 'camel' } });
}

describe('PropertyGenerator', () => {
  it('puts primary/identity columns first, otherwise preserving table order', () => {
    const table = new Table('orders', 'dbo', [
      new Column('total', 'decimal', false),
      new Column('id', 'int', false, false, false, undefined, true),
      new Column('createdAt', 'datetime', false),
      new Column('userId', 'int', false, true),
    ]);

    const generator = new PropertyGenerator(table, new Set(), makeFormatter());
    const lines = generator.generate();

    expect(lines[0]).toContain('id: number;');
    expect(lines[1]).toContain('userId: number;');
    expect(lines[2]).toContain('total: number;');
    expect(lines[3]).toContain('createdAt: Date;');
  });

  it('drops an unindexed foreign-key source column', () => {
    const table = new Table(
      'orders',
      'dbo',
      [new Column('id', 'int', false, false, false, undefined, true), new Column('userId', 'int', false)],
      [new ForeignKey('FK_orders_users', 'orders', ['userId'], 'users', ['id'])]
    );

    const generator = new PropertyGenerator(table, new Set(), makeFormatter());
    const lines = generator.generate();

    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('id:');
  });

  it('keeps a foreign-key source column that is also indexed', () => {
    const table = new Table(
      'orders',
      'dbo',
      [new Column('id', 'int', false, false, false, undefined, true), new Column('userId', 'int', false)],
      [new ForeignKey('FK_orders_users', 'orders', ['userId'], 'users', ['id'])],
      [new Index('IX_orders_userId', ['userId'], false, false)]
    );

    const generator = new PropertyGenerator(table, new Set(), makeFormatter());
    const lines = generator.generate();

    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('userId:');
  });

  it('generates the right decorator per column kind', () => {
    const table = new Table('users', 'dbo', [
      new Column('id', 'int', false, false, false, undefined, true),
      new Column('email', 'varchar', false, false, true),
      new Column('name', 'varchar', true),
    ]);
    const used = new Set<string>();

    const generator = new PropertyGenerator(table, used, makeFormatter());
    const lines = generator.generate();

    expect(lines[0]).toContain('@PrimaryGeneratedColumn(');
    expect(lines[1]).toContain('@Column(');
    expect(lines[1]).toContain('unique: true');
    expect(lines[2]).toContain('@Column(');
    expect(lines[2]).toContain('nullable: true');
    expect(lines[2]).toContain('name: string | null;');
    expect(used).toEqual(new Set(['PrimaryGeneratedColumn', 'Column']));
  });
});
