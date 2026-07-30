import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

// Tests override this to point at a throwaway file.
const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'todo.db');
const SCHEMA_PATH = path.join(process.cwd(), 'db', 'schema.sql');

let instance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (instance) return instance;

  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');
  db.exec(fs.readFileSync(SCHEMA_PATH, 'utf-8'));

  instance = db;
  return instance;
}

export function closeDb(): void {
  instance?.close();
  instance = null;
}