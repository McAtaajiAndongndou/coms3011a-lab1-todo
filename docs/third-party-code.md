# Third-party code

Every package listed in `package.json`, and why it is there. The list is
deliberately short: each dependency is one more thing a reader has to trust and
one more thing that can break on a clean clone.

## Dependencies

| Package | Version | Why |
| --- | --- | --- |
| `next` | 16.2.12 | Required by the brief. The App Router lets a page read the database directly on the server and send finished HTML, so the application needs no separate API layer and no client-side data fetching. |
| `react` | 19.2.4 | The rendering library Next.js is built on. Installed as part of the Next.js scaffold rather than chosen separately. |
| `react-dom` | 19.2.4 | React's browser renderer. Paired with `react`; not a separate decision. |
| `better-sqlite3` | ^13.0.2 | Required by the brief (SQLite). Chosen over `node:sqlite` and `sqlite3` because its API is synchronous, which suits a local single-user application with no concurrency to manage, and because it ships prebuilt binaries for every supported platform. `node:sqlite` was rejected because on Node 22 it still requires the `--experimental-sqlite` flag. |

## Development dependencies

| Package | Version | Why |
| --- | --- | --- |
| `typescript` | ^5 | Type errors surface while editing rather than at runtime. In practice this caught mismatches between the shape returned by SQL queries and the shape the pages expected. |
| `vitest` | ^4.1.10 | Test runner. Chosen because it reads the project's existing TypeScript configuration without extra setup, and because its `env` configuration option sets environment variables before any module in the test process loads — which is what allows the suite to be pointed at a throwaway database. |
| `@types/better-sqlite3` | ^7.6.13 | Type definitions for `better-sqlite3`, which ships none of its own. Without this, every database call is untyped. |
| `@types/node` | ^20 | Type definitions for Node's built-in modules (`node:fs`, `node:path`), both used in `lib/db.ts`. Pinned at `^20` by the Next.js scaffold; the definitions used here are unchanged in `^22`. |
| `@types/react`, `@types/react-dom` | ^19 | Type definitions for React. |
| `tailwindcss` | ^4 | Styling. Utility classes are written in the markup, so there is no separate stylesheet to keep in sync with the components. The colour tokens in `app/globals.css` are the one exception, defined once so light and dark themes stay consistent. |
| `@tailwindcss/postcss` | ^4 | The PostCSS plugin Tailwind v4 requires to process styles during the build. |
| `eslint` | ^9 | Catches unused variables and common React mistakes before they reach a commit. |
| `eslint-config-next` | 16.2.12 | The Next.js ESLint ruleset, including rules specific to the App Router such as correct use of Server and Client Components. |

## `.npmrc` — why install scripts are disabled

The repository contains a `.npmrc` with `ignore-scripts=true`. This is required
for the project to install on a machine without a C++ toolchain.

`better-sqlite3@13.0.2` publishes prebuilt binaries for eight platforms inside
its npm package, including `win32-x64`. It does not declare an `install` or
`postinstall` script. However, it does contain a `binding.gyp` at its package
root, and npm's default behaviour for a package with a `binding.gyp` and no
install script of its own is to run `node-gyp rebuild` automatically. That
ignores the binary that was just downloaded and attempts to compile from source,
which fails without Visual Studio and the "Desktop development with C++"
workload.

This was found by cloning the repository into a clean directory and following
the README, which is the only way it surfaces: an existing `node_modules`
already contains a working binary and hides the problem entirely. Disabling
install scripts makes npm use the shipped prebuild. Install time dropped from
roughly nineteen minutes to two, and no dependency in this project requires an
install script.

## What was deliberately not installed

**No ORM (Prisma, Drizzle, TypeORM).** An ORM would generate the schema from a
model definition, which puts the real database structure one level away from
anything a reader can inspect. The schema here is 24 lines of SQL in
`db/schema.sql`, and the queries are visible in `lib/tasks.ts`. For a database
this small, hand-written SQL is both shorter and more legible than the
configuration an ORM would need.

**No component library (shadcn/ui, MUI, Chakra).** The interface is a form, a
list and a set of links. A component library would add a large dependency and a
build-time cost to render markup that is already straightforward.

**No date library (date-fns, dayjs, Luxon).** Dates are stored as ISO strings
(`YYYY-MM-DD`), which sort chronologically as plain text, and the only date
comparison in the application is done by SQLite itself via `date('now')`. There
is no formatting or timezone arithmetic to justify a library.

**No state management library.** Sort order and the active/archived view are held
in the URL as search parameters. This means the state survives a page reload and
the browser's back button works, without any client-side state at all.

## A note on install warnings

`npm install` reports three high-severity audit advisories. They are in build
tooling rather than in code that runs when the application is used; the
application is not deployed, serves no untrusted input, and is reachable only
from localhost.

`npm audit fix --force` was not run. That flag is permitted to install breaking
major versions and would downgrade Next.js itself.

An earlier `package-lock.json`, written incrementally across several separate
installs, produced twelve advisories and a set of peer-dependency warnings from
an optional WebAssembly resolver build. Regenerating the lockfile from scratch
removed both.