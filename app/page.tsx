import Link from 'next/link';
import { listTasks, listTopics, type SortKey } from '@/lib/tasks';
import TaskForm from './components/TaskForm';
import { archiveTaskAction, restoreTaskAction } from './actions';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  todo: 'Todo',
  in_progress: 'In-Progress',
  complete: 'Complete',
};

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'due_date', label: 'Due date' },
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

  function href(next: { sort?: SortKey; view?: 'active' | 'archived' }) {
    const query = new URLSearchParams();
    query.set('sort', next.sort ?? sort);
    const view = next.view ?? (archived ? 'archived' : 'active');
    if (view === 'archived') query.set('view', 'archived');
    return `/?${query.toString()}`;
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Tasks</h1>

      {!archived && <TaskForm topics={topics} />}

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border pb-3">
        <nav className="flex gap-4 text-sm">
          <Link
            href={href({ view: 'active' })}
            className={archived ? 'text-muted' : 'font-medium underline underline-offset-4'}
          >
            Active
          </Link>
          <Link
            href={href({ view: 'archived' })}
            className={archived ? 'font-medium underline underline-offset-4' : 'text-muted'}
          >
            Archived
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1 text-sm">
          <span className="mr-1 text-muted">Sort by</span>
          {SORTS.map((option) => (
            <Link
              key={option.key}
              href={href({ sort: option.key })}
              aria-current={option.key === sort ? 'true' : undefined}
              className={
                option.key === sort
                  ? 'rounded border border-border px-2 py-1 font-medium'
                  : 'rounded px-2 py-1 text-muted'
              }
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <ul className="mt-4 grid gap-3">
        {tasks.length === 0 && (
          <p className="text-muted">
            {archived ? 'Nothing archived.' : 'No tasks yet. Add one above.'}
          </p>
        )}

        {tasks.map((task) => (
          <li key={task.id} className="rounded-lg border border-border p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-medium">{task.title}</h2>
              {task.is_overdue === 1 && (
                <span className="shrink-0 rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                  Overdue
                </span>
              )}
            </div>

            {task.description && <p className="mt-1 text-sm text-muted">{task.description}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted">
              <span>{task.topic_name}</span>
              <span>{STATUS_LABEL[task.status]}</span>
              <span>Due {task.due_date}</span>
              {task.archived_at && <span>Archived {task.archived_at.slice(0, 10)}</span>}

              <span className="ml-auto flex items-center gap-3">
                <Link href={`/tasks/${task.id}/edit`} className="underline underline-offset-2">
                  Edit
                </Link>

                {archived ? (
                  <form action={restoreTaskAction}>
                    <input type="hidden" name="id" value={task.id} />
                    <button type="submit" className="underline underline-offset-2">
                      Restore
                    </button>
                  </form>
                ) : (
                  <form action={archiveTaskAction}>
                    <input type="hidden" name="id" value={task.id} />
                    <button type="submit" className="underline underline-offset-2">
                      Archive
                    </button>
                  </form>
                )}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}