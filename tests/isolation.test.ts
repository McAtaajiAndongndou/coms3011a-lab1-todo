import { afterAll, describe, expect, it } from 'vitest';
import { closeDb, currentDbPath, getDb } from '../lib/db';

afterAll(() => {
  closeDb();
});

/**
 * These assertions exist because an earlier version of the suite silently ran
 * against the developer's todo.db and destroyed its contents. They fail loudly
 * if the in-memory override ever stops taking effect.
 */
describe('test isolation', () => {
  it('resolves the database path to an in-memory database', () => {
    expect(currentDbPath()).toBe(':memory:');
  });

  it('is not attached to any file on disk', () => {
    const attached = getDb().pragma('database_list') as { name: string; file: string }[];

    expect(attached).toHaveLength(1);
    expect(attached[0].name).toBe('main');
    expect(attached[0].file).toBe('');
  });
});
