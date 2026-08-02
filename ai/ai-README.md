# AI session transcripts

[`session-transcript.md`](session-transcript.md) is the full verbatim record of
the AI-assisted development of this project, exported from Claude and reformatted
as markdown. 176 messages across five sessions, 29 July to 2 August 2026.

A written account of how the assistance was constrained, what the author decided,
and where the assistant's output was wrong is in
[`../docs/ai-usage.md`](../docs/ai-usage.md).

## Where to find each kind of use

The brief asks for transcripts covering planning, code generation and debugging.
All three are in the single transcript; the sessions below indicate where.

| Session | Date | Content |
| --- | --- | --- |
| 1 | 29 July | **Planning.** Reading the brief against the rubric, stack selection, the decision not to use an ORM, TypeScript over JavaScript, repository setup. |
| 2 | 30 July | **Planning and code generation.** Topic modelling decided by the author (separate table over a text column), schema written and verified, data layer. |
| 3 | 30 July | **Code generation.** Task creation form, list view, server actions, the overdue badge. First browser run. |
| 4 | 31 July | **Code generation and debugging.** Editing, archiving, sorting, the archived view. A 404 on the edit route diagnosed incorrectly by the assistant before the actual cause was found. |
| 5 | 1 August | **Debugging.** The test suite, and the discovery that it had been silently running against the real database and destroying its contents. |
| 6 | 2 August | **Debugging and documentation.** Documentation written; the clean-clone rehearsal exposed an install failure that would have cost the entire functional walkthrough. Six incorrect diagnoses preceded the actual cause. |

## The two corrections

Both are described in full in [`../docs/ai-usage.md`](../docs/ai-usage.md) and
appear verbatim in the transcript:

- **1 August** — the assistant asserted the test suite was "structurally
  incapable" of touching the developer's database. It was not; the suite had
  cleared the real database fourteen times. Found by checking the application
  rather than accepting the claim. Fixed in commit `02b90ff`.
- **2 August** — a clean clone could not install. Six explanations were offered
  and each was disproved by testing before the cause was found by inspecting the
  published npm package directly. Fixed in commits `2b42281` and `3c68069`.
