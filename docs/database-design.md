# Database design

The database is a single SQLite file, `todo.db`, created in the project root on
first run. The schema lives in [`db/schema.sql`](../db/schema.sql) and is applied
every time a connection opens. Every statement in it uses `IF NOT EXISTS`, so on
an existing database it does nothing, and on a clean clone it creates the tables.
There is no separate migration command.

## Tables

### `topics`

| Column | Type | Constraints | Purpose |
| --- | --- | --- | --- |
| `id` | INTEGER | `PRIMARY KEY AUTOINCREMENT` | Identifier referenced by `tasks.topic_id`. |
| `name` | TEXT | `NOT NULL UNIQUE COLLATE NOCASE` | The topic name as typed by the user. |
| `created_at` | TEXT | `NOT NULL DEFAULT (datetime('now'))` | When the topic was first used. |

`COLLATE NOCASE` on `name` means SQLite treats `COMS3011A` and `coms3011a` as the
same value. Combined with `UNIQUE`, this makes duplicate topics differing only by
case impossible at the database level rather than something application code has
to remember to check. The same collation also makes the lookup in
`findOrCreateTopic` case-insensitive without any extra query logic.

### `tasks`

| Column | Type | Constraints | Purpose |
| --- | --- | --- | --- |
| `id` | INTEGER | `PRIMARY KEY AUTOINCREMENT` | Task identifier. |
| `title` | TEXT | `NOT NULL CHECK (length(trim(title)) > 0)` | The task title. |
| `description` | TEXT | `NOT NULL DEFAULT ''` | Optional detail; empty string rather than NULL. |
| `due_date` | TEXT | `NOT NULL`, `CHECK` on format | Due date as `YYYY-MM-DD`. |
| `topic_id` | INTEGER | `NOT NULL REFERENCES topics(id) ON DELETE RESTRICT` | The task's topic. |
| `status` | TEXT | `NOT NULL DEFAULT 'todo'`, `CHECK (status IN (...))` | One of `todo`, `in_progress`, `complete`. |
| `archived_at` | TEXT | nullable | `NULL` while active; a timestamp once archived. |
| `created_at` | TEXT | `NOT NULL DEFAULT (datetime('now'))` | Creation time. |
| `updated_at` | TEXT | `NOT NULL DEFAULT (datetime('now'))` | Last edit time, set explicitly on update. |

`CHECK (length(trim(title)) > 0)` is stricter than `NOT NULL`, which would still
accept a title consisting only of spaces.

The `due_date` check is `GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`. It
enforces the shape of the string, not that the date is real — `9999-99-99` would
pass. The application layer supplies the value from an HTML date input, so the
check exists to stop malformed data reaching the table, not to validate calendars.

### Indexes

```sql
CREATE INDEX idx_tasks_archived ON tasks(archived_at);
CREATE INDEX idx_tasks_topic    ON tasks(topic_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

These cover the three things every list query does: filter on `archived_at`, join
to `topics`, and order by `due_date`. At the data volumes a single user produces
they make no measurable difference, but they match how the data is actually read.

## The relationship

One topic has many tasks. One task has exactly one topic.

```
topics                          tasks
------                          -----
id       ◄──────────────────────  topic_id   (NOT NULL, ON DELETE RESTRICT)
name                              id
created_at                        title
                                  description
                                  due_date
                                  status
                                  archived_at
                                  created_at
                                  updated_at
```

`topic_id` is `NOT NULL`, so every task belongs to a topic. `ON DELETE RESTRICT`
prevents deleting a topic while tasks still reference it, which would otherwise
leave rows pointing at nothing.

Foreign key enforcement is off by default in SQLite. It is switched on in two
places: `PRAGMA foreign_keys = ON` at the top of `db/schema.sql`, and
`db.pragma('foreign_keys = ON')` in `lib/db.ts` immediately after the connection
opens. The pragma is per-connection, so setting it in code is what actually
guarantees it.

### Why a separate table rather than a text column

A `topic TEXT` column on `tasks` would have been simpler and is defensible for a
single-user application. A separate table was chosen because it makes duplicate
topics impossible rather than merely discouraged, and because renaming a topic
becomes a single-row update rather than an update across every task that
mentions it.

## Two decisions worth stating explicitly

### Archiving is a timestamp, not a deletion or a copy

The brief requires that tasks cannot be deleted, only archived, and remain
viewable. `archived_at` is `NULL` for an active task and holds a timestamp once
archived. Archiving is:

```sql
UPDATE tasks SET archived_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
```

The row never moves and is never removed. The active list filters on
`archived_at IS NULL`, the archived tab on `archived_at IS NOT NULL` — the same
query either side of one condition. Restoring sets the column back to `NULL`.

A timestamp was used rather than a boolean flag because it records *when* a task
was archived at no additional cost, and the archived tab displays that date.

### Overdue is derived at read time, never stored

There is no `overdue` column and `overdue` is not one of the permitted values of
`status`. Every read computes it:

```sql
CASE WHEN t.status != 'complete' AND t.due_date < date('now')
     THEN 1 ELSE 0 END AS is_overdue
```

A task is overdue when its due date has passed *and* it is not complete. A
completed task that was finished late is not flagged.

Storing this as a column would mean it is correct only until the next midnight,
and would require a scheduled job or a check on every application start to keep
accurate. Deriving it means it cannot go stale: a task that becomes overdue at
midnight is flagged the next time the page is read, with nothing to run.

`tests/tasks.test.ts` asserts this structurally — it reads `PRAGMA
table_info(tasks)` and fails if a column named `overdue` or `is_overdue` ever
appears.

## Test isolation

`lib/db.ts` resolves the database path from `process.env.DATABASE_PATH`, falling
back to `todo.db` in the project root. `vitest.config.ts` sets that variable to
`:memory:` through Vitest's `env` option, which applies before any module in the
test process loads.

`resolveDbPath()` additionally throws if `process.env.VITEST` is set and the path
is anything other than `:memory:`. This guard exists because an earlier version
of the suite silently ran against `todo.db` and deleted its contents; the failure
was silent because the path was resolved once at module load, so whether the
override applied depended on import order. `tests/isolation.test.ts` now asserts
both that the resolved path is `:memory:` and that SQLite reports no file backing
the connection.

The practical consequence is that `npm test` cannot affect a user's data, and the
tests depend on no pre-existing database contents — every test creates the rows
it needs after `beforeEach` clears both tables.
