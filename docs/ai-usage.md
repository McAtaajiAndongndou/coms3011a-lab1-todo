# AI usage

This project was built with AI assistance (Claude). Full session transcripts are
in [`ai/`](../ai/). This document states how that assistance was constrained and
records the two points at which its output was wrong and had to be corrected.

## Constraints set before any code was written

The following were fixed in the first session, before any code existed, and held
for the rest of the project:

- **Stack was decided against the brief, not suggested freely.** Next.js and
  SQLite were mandatory. Everything else had to justify its presence.
- **No ORM.** The schema had to be readable SQL in a file, not generated from a
  model definition, so that the shipped database structure and the documented one
  are the same artefact.
- **No whole-project generation.** Work was split across daily sessions, one
  feature area per session, with a commit at the end of each.
- **Every file typed in and run before moving on.** Nothing was accepted on the
  basis that it looked correct.
- **Explanations required, not just code.** Each new file was explained before
  being used, which is how the errors below were noticed at all.

## Decisions made by the author

| Decision | Options presented | Chosen | Reason |
| --- | --- | --- | --- |
| Topic modelling | `topic TEXT` column vs. separate `topics` table | Separate table | The documentation must describe relationships; a single table has none to describe. Also makes duplicate topics structurally impossible. |
| Language | TypeScript vs. JavaScript | TypeScript | Type errors surface while editing rather than during the marker's walkthrough. |
| `npm audit fix --force` | Run it vs. document the warnings | Document | The flag installs breaking major versions and would downgrade Next.js. The advisories are in build tooling for an application that is never deployed. |
| Vitest config warning | Rename config to `.mts` to silence it vs. document it | Document | The warning concerns a future major version of Vite. Renaming a config file immediately before submission risked breaking a verified working state for a cosmetic gain. |

## First incorrect output: the test suite was destroying real data

**What was claimed.** When the Vitest suite was written, the assistant stated
that it was *"structurally incapable"* of touching the developer's database,
because `tests/setup.ts` set `DATABASE_PATH` to `:memory:` before the test files
loaded.

**What actually happened.** All fourteen tests passed. On opening the
application afterwards, the six seeded tasks were gone. In their place was a
single task — `Call home`, topic `Family`, status `In-Progress`, due
`2026-08-11` — which is exactly the end state of the last test in the file,
`editing a task > persists changes and re-derives overdue from the new due
date`, whose due date is `daysFromToday(10)`.

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

**How it was found.** By checking rather than trusting the claim. A passing test
suite tells you nothing about which database it passed against.

**What changed as a result.**

- `vitest.config.ts` moved to the project root.
- `DATABASE_PATH` is now set through Vitest's `env` configuration option, which
  applies to `process.env` before any module in the test process loads, rather
  than relying on `setupFiles` ordering. `tests/setup.ts` was kept as a second
  line of defence.
- `lib/db.ts` now resolves the path inside `resolveDbPath()` on every call.
- `resolveDbPath()` throws if `process.env.VITEST` is set and the path is
  anything other than `:memory:`. The original failure was silent; this one
  cannot be.
- `tests/isolation.test.ts` was added, asserting both that the resolved path is
  `:memory:` and that `PRAGMA database_list` reports no file backing the
  connection.

**Verification.** A task named `Isolation check` was created in the application,
`npm test` was run, and the application reloaded. The task was still present.

Recorded in commit `02b90ff`.

## Second incorrect output: six wrong diagnoses of a clean-clone failure

**The failure.** Cloning the repository into a clean directory and running
`npm install` — exactly what a marker does — failed. `better-sqlite3` attempted
a source build via `node-gyp` and died looking for Visual Studio. Because the
first step of the walkthrough is that the application installs and starts by
following the README alone, this would have cost the entire walkthrough, not
just that step. It had never surfaced during development because an existing
`node_modules` already contained a working binary.

**The wrong diagnoses.** In order, the assistant proposed that the cause was:

1. OneDrive or Windows Defender locking files, because the test folder was on the
   Desktop. Disproved by cloning to `C:\devtest` and getting the same failure.
2. A transient network failure on the prebuild download. Disproved by the failure
   being exactly reproducible.
3. A stale `package-lock.json` missing the platform prebuild entries. Plausible —
   deleting the lockfile did make the install succeed — so the lockfile was
   regenerated and committed. The next clean clone failed identically.
4. A corrupt npm cache. Disproved by `npm cache clean --force`.
5. A version mismatch between the working install and the lockfile. Disproved
   directly: both were `13.0.2`, and the working install contained all eight
   prebuilt binaries.
6. Windows Defender again, this time tested with a folder exclusion. Same
   failure.

Each of these cost an install cycle of up to twenty minutes.

**The actual cause,** found by downloading the published `better-sqlite3@13.0.2`
tarball and inspecting it rather than reasoning about it. Two facts settled it:
the tarball contains `prebuilds/win32-x64.node`, and the package declares no
`install` or `postinstall` script — but it does contain a `binding.gyp` at its
root. npm's default behaviour for a package with a `binding.gyp` and no install
script of its own is to run `node-gyp rebuild` automatically. npm was discarding
a working binary it had just downloaded in order to compile one it could not
build.

**The fix.** A committed `.npmrc` containing `ignore-scripts=true`. Install time
fell from roughly nineteen minutes to two, `prebuilds/win32-x64.node` is present
after install, and the full walkthrough was then completed from a clean clone.

Recorded in commits `2b42281` and `3c68069`.

**What this one illustrates.** Six plausible-sounding explanations were offered
before anyone looked at the artefact itself. Each was internally consistent and
each was wrong. What resolved it was not better reasoning about the symptom but
retrieving the actual package and listing its contents. The lesson is the same as
the first incident: a confident explanation and a verified one are different
things, and only the second is worth acting on.

## Where AI assistance ends and the code begins

Every file in this repository was placed, run and verified by the author. The
schema decisions, the topic modelling, the choice not to use an ORM and the
handling of the audit warnings are recorded above with their reasoning. The
sequence of commits reflects the order the work was actually done in, across six
sessions between 29 July and 2 August.