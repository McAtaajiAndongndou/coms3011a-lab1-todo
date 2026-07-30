PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS topics (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT    NOT NULL DEFAULT '',
  due_date    TEXT    NOT NULL CHECK (due_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  topic_id    INTEGER NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
  status      TEXT    NOT NULL DEFAULT 'todo'
                      CHECK (status IN ('todo', 'in_progress', 'complete')),
  archived_at TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(archived_at);
CREATE INDEX IF NOT EXISTS idx_tasks_topic    ON tasks(topic_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);