import Link from 'next/link';
import { listTasks, listTopics, taskCounts, type SortKey } from '@/lib/tasks';
import { relativeDue } from '@/lib/relative-time';
import TaskForm from './components/TaskForm';
import StatusControl from './components/StatusControl';
import { archiveTaskAction, restoreTaskAction } from './actions';

export const dynamic = 'force-dynamic';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'due_date', label: 'Due' },
  { key: 'topic', label: 'Topic' },
  { key: 'status', label: 'Status' },
];

function parseSort(value: string | undefined): SortKey {
  return value === 'topic' || value === 'status' ? value : 'due_date';
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; view?: string }>;
}) {
  const params = await searchParams;
  const sort = parseSort(params.sort);
  const archived = params.view === 'archived';

  const tasks = listTasks(sort, archived);
  const topics = listTopics().map((t) => t.name);
  const counts = taskCounts();

  function href(next: { sort?: SortKey; view?: 'active' | 'archived' }) {
    const query = new URLSearchParams();
    query.set('sort', next.sort ?? sort);
    const view = next.view ?? (archived ? 'archived' : 'active');
    if (view === 'archived') query.set('view', 'archived');
    return `/?${query.toString()}`;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl font-medium tracking-tight">Tasks</h1>
        <p className="font-mono text-xs tabular-nums text-muted">
          {counts.open} open
          {counts.overdue > 0 && (
            <>
              {' · '}
              <span className="text-overdue">{counts.overdue} late</span>
            </>
          )}
          {counts.archived > 0 && ` · ${counts.archived} archived`}
        </p>
      </header>

      {!archived && (
        <div className="mt-8">
          <TaskForm topics={topics} />
        </div>
      )}

      <div className="mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border pb-3">
        <nav className="flex items-baseline gap-5 font-mono text-xs uppercase tracking-widest">
          <Link
            href={href({ view: 'active' })}
            className={
              archived
                ? 'text-muted transition-colors hover:text-foreground'
                : 'text-foreground underline decoration-accent decoration-2 underline-offset-[6px]'
            }
          >
            Active
          </Link>
          <Link
            href={href({ view: 'archived' })}
            className={
              archived
                ? 'text-foreground underline decoration-accent decoration-2 underline-offset-[6px]'
                : 'text-muted transition-colors hover:text-foreground'
            }
          >
            Archive
          </Link>
        </nav>

        <div className="flex items-baseline gap-3 font-mono text-xs">
          <span className="uppercase tracking-widest text-muted">Sort</span>
          {SORTS.map((option) => (
            <Link
              key={option.key}
              href={href({ sort: option.key })}
              aria-current={option.key === sort ? 'true' : undefined}
              className={
                option.key === sort
                  ? 'text-foreground underline decoration-accent decoration-2 underline-offset-[6px]'
                  : 'text-muted transition-colors hover:text-foreground'
              }
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="mt-10 max-w-sm font-display text-lg leading-relaxed text-muted">
          {archived
            ? 'Nothing archived yet. Archiving moves a task out of the way and keeps it readable — nothing is ever deleted.'
            : 'No tasks yet. Add the first one above.'}
        </p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li
              key={task.id}
              className="grid grid-cols-1 gap-x-6 border-b border-rule py-6 sm:grid-cols-[7rem_1fr]"
            >
              {/* Time gutter: the derived answer to "when", not the stored date. */}
              <div className="sm:pt-1 sm:text-right">
                <div
                  className={`font-mono text-sm tabular-nums ${
                    task.is_overdue === 1 ? 'font-medium text-overdue' : 'text-foreground'
                  }`}
                >
                  {relativeDue(task.days_until, task.is_overdue === 1)}
                </div>
                <div className="font-mono text-[0.6875rem] tabular-nums text-muted">
                  {task.due_date}
                </div>
              </div>

              <div className="mt-2 sm:mt-0">
                <h2 className="font-display text-xl leading-snug">{task.title}</h2>

                {task.description && (
                  <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
                    {task.description}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-accent">
                    {task.topic_name}
                  </span>

                  {archived ? (
                    <span className="font-mono text-xs text-muted">
                      Archived {task.archived_at?.slice(0, 10)}
                    </span>
                  ) : (
                    <StatusControl id={task.id} status={task.status} />
                  )}

                  <span className="ml-auto flex items-center gap-4 font-mono text-xs">
                    <Link
                      href={`/tasks/${task.id}/edit`}
                      className="text-muted underline underline-offset-4 transition-colors hover:text-foreground"
                    >
                      Edit
                    </Link>

                    <form action={archived ? restoreTaskAction : archiveTaskAction}>
                      <input type="hidden" name="id" value={task.id} />
                      <button
                        type="submit"
                        className="cursor-pointer text-muted underline underline-offset-4 transition-colors hover:text-foreground"
                      >
                        {archived ? 'Restore' : 'Archive'}
                      </button>
                    </form>
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}