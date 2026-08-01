# AI usage

This project was built with AI assistance (Claude). Full session transcripts are
submitted separately. This document states how that assistance was constrained
and records the point at which its output was wrong and had to be corrected.

## Constraints set before any code was written

The following were fixed at the start of the first session, before any code
existed, and held for the rest of the project:

- **Stack was decided against the brief, not suggested freely.** Next.js and
  SQLite were mandatory. Everything else had to justify its presence.
- **No ORM.** The schema had to be readable SQL in a file, not generated from a
  model definition, so that the shipped database structure and the documented one
  are the same artefact.
- **No whole-project generation.** Work was split across six sessions, one
  feature area per session, with a commit at the end of each.
- **Every file typed in and run before moving on.** Nothing was accepted on the
  basis that it looked correct.
- **Explanations required, not just code.** Each new file was explained line by
  line before being used, which is how the errors below were noticed at all.

## Decisions made by the author

| Decision | Options presented | Chosen | Reason |
| --- | --- | --- | --- |
| Topic modelling | `topic TEXT` column vs. separate `topics` table | Separate table | The documentation must describe relationships; a single table has none to describe. Also makes duplicate topics structurally impossible. |
| Language | TypeScript vs. JavaScript | TypeScript | Type errors surface while editing rather than during the marker's walkthrough. |
| Transcript storage | Committed to the public repo vs. kept local | Kept local, gitignored | The repository is public. Publishing the full working process invites copying. The brief lists transcripts as a separate submission item, so they are not required in the repository. |
| `npm audit fix --force` | Run it vs. document the warnings | Document | The flag installs breaking major versions and would downgrade Next.js. The advisories are in build tooling for an application that is never deployed. |

## Output that was incorrect and had to be corrected

### The test suite was destroying real data

**What was claimed.** When the Vitest suite was written, the assistant stated
that it was *"structurally incapable"* of touching the developer's database,
because `tests/setup.ts` set `DATABASE_PATH` to `:memory:` before the test files
loaded.

**What actually happened.** The suite was run and all fourteen tests passed. On
opening the application afterwards, the task list did not contain the six seeded
tasks. It contained a single task — `Call home`, topic `Family`, status
`In-Progress`, due `2026-08-11` — which is exactly the end state of the last test
in the file, `editing a task > persists changes and re-derives overdue from the
new due date`, with a due date of `daysFromToday(10)`.

The suite had been running against `todo.db`. `beforeEach` executes
`DELETE FROM tasks; DELETE FROM topics;`, so it had cleared the real database
fourteen times and left the last test's fixture behind.

**Why it happened.** Two causes.

1. `vitest.config.ts` had been placed in `tests/` rather than the project root.
   Vitest looks for its configuration at the root, found none, and ran on
   defaults — so the `env` block setting `DATABASE_PATH` was never read.
2. More seriously, `lib/db.ts` resolved `DATABASE_PATH` **once, at module load**,
   into a top-level constant. That made correctness depend on whether Vitest's
   setup file happened to run before the module was first imported. It failed
   silently: no error, no warning, just the wrong database.

**How it was found.** By checking rather than trusting the claim. The suite
passing tells you nothing about which database it passed against.

**What changed as a result.**

- `vitest.config.ts` moved to the project root.
- `DATABASE_PATH` is now set through Vitest's `env` configuration option, which
  applies to `process.env` before any module in the test process loads, rather
  than relying on `setupFiles` ordering. `tests/setup.ts` was kept as a second
  line of defence.
- `lib/db.ts` now resolves the path inside `resolveDbPath()` on every call rather
  than once at module load.
- `resolveDbPath()` throws if `process.env.VITEST` is set and the path is
  anything other than `:memory:`. The original failure was silent; this one
  cannot be.
- `tests/isolation.test.ts` was added, asserting both that the resolved path is
  `:memory:` and that `PRAGMA database_list` reports no file backing the
  connection.

**Verification.** A task named `Isolation check` was created in the application,
`npm test` was run, and the application reloaded. The task was still present.
Sixteen tests that clear both tables before every test had run without affecting
it.

This is recorded in commit `02b90ff`.

### A smaller correction: the wrong diagnosis

When the edit route returned a 404, the assistant's first explanation was that
PowerShell had mangled the `[id]` folder name by treating the square brackets as
wildcards. Listing the directory showed the folder was correct — the actual
problem was that the file was named `edit-page.tsx` rather than `page.tsx`, which
the assistant's own earlier instruction had specified. The exotic explanation was
offered before the obvious one had been ruled out.

## Where AI assistance ends and the code begins

Every file in this repository was placed, run and verified by the author. The
schema decisions, the topic modelling, the choice not to use an ORM and the
handling of the audit warnings are recorded above with their reasoning. The
sequence of commits reflects the order the work was actually done in, across six
sessions between 29 July and 3 August.
