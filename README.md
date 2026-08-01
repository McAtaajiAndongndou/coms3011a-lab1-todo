# Tasks — a local-first todo application

A single-user todo application built with Next.js and SQLite. It runs entirely on
your own machine: there is no server to deploy, no account to create, and no data
leaves the computer it runs on. All tasks are stored in a SQLite file in the
project directory.

Built for COMS3011A Lab 1.

## Features

- Create tasks with a title, description, due date and topic.
- Edit any task; changes are written to the database immediately.
- Archive tasks instead of deleting them. Archived tasks remain viewable under
  the Archived tab and can be restored.
- Sort the list by due date, by topic, or by status.
- Tasks have one of three fixed statuses: Todo, In-Progress, Complete.
- Tasks past their due date are flagged **Overdue**. Overdue is not a status —
  it is derived from the due date and the current status each time the list is
  read, so it is never stale.
- All data persists across restarts.

## Running it

### Requirements

- **Node.js v22.20.0** (any 22.x release should work; v22.20.0 is the version
  this project was developed and verified against).
- **npm**, which ships with Node.
- No database server is required. SQLite is embedded, and the database file is
  created automatically on first run.

Check your Node version:

```bash
node -v
```

### From a clean clone

```bash
git clone https://github.com/McAtaajiAndongndou/coms3011a-lab1-todo.git
cd coms3011a-lab1-todo
npm install
npm run build
npm start
```

Then open **http://localhost:3000**.

`npm install` may print warnings about peer dependencies and audit advisories.
These come from optional platform-specific packages in the build tooling and do
not affect the application. Do not run `npm audit fix --force`: it is permitted
to install breaking major versions and will downgrade Next.js.

The first run creates `todo.db` in the project root and applies the schema from
`db/schema.sql` automatically. There is no migration step to run.

### Development mode

```bash
npm run dev
```

This enables hot reloading, but compiles each route the first time it is
requested, so the first visit to a page takes a few seconds. `npm run build`
followed by `npm start` is faster to navigate and is what the commands above
recommend.

### Running the tests

```bash
npm test
```

This runs the full suite once and exits. The tests use an in-memory SQLite
database and never read or write `todo.db`. See
[docs/database-design.md](docs/database-design.md) for how that isolation works.

### Stopping the application

Press `Ctrl+C` in the terminal running the server. Data is already on disk;
nothing is lost.

## Documentation

- [Third-party code](docs/third-party-code.md) — every dependency and why it is
  there.
- [Database design](docs/database-design.md) — tables, relationships, and the
  reasoning behind the schema.
- [AI usage](docs/ai-usage.md) — how AI assistance was used, constrained and
  corrected.

## Project layout

```
app/                        Next.js App Router pages and components
  actions.ts                Server actions: create, update, archive, restore
  page.tsx                  Task list, sorting, active/archived tabs
  components/               TaskForm and EditTaskForm
  tasks/[id]/edit/page.tsx  Edit route
db/schema.sql               The schema, applied on every connection
lib/db.ts                   Connection handling and database path resolution
lib/tasks.ts                All task and topic queries
tests/                      Vitest suite
```
