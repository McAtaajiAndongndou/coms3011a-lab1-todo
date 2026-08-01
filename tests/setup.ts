// lib/db.ts reads DATABASE_PATH once, at module load. This setup file runs
// before any test file is imported, so setting it here is what keeps the
// suite off the developer's todo.db. ':memory:' is discarded when the
// process exits, so there is nothing to clean up and nothing to leak
// between runs.
process.env.DATABASE_PATH = ':memory:';
