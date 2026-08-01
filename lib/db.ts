import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

let instance: Database.Database | null = null;

/**
 * Resolved on every call rather than once at module load, so the value of
 * DATABASE_PATH at the moment the database is opened is the one that counts.
 *
 * The guard is deliberate: under Vitest, anything other than an in-memory
 * database is a bug, and failing loudly is better than quietly writing to
 * the developer's todo.db.
 */
function resolveDbPath(): string {
  const configured = process.env.DATABASE_PATH;

  if (process.env.VITEST && configured !== ':memory:') {
    throw new Error(
      `Refusing to run tests against ${configured ?? 'todo.db'}. ` +
        `Tests must use an in-memory database; check DATABASE_PATH in vitest.config.ts.`
    );
  }

  return configured ?? path.join(process.cwd(), 'todo.db');
}

export function currentDbPath(): string {
  return resolveDbPath();
}

export function getDb(): Database.Database {
  if (instance) return instance;

  const db = new Database(resolveDbPath());
  db.pragma('foreign_keys = ON');
  db.exec(fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf-8'));

  instance = db;
  return instance;
}

export function closeDb(): void {
  instance?.close();
  instance = null;
}