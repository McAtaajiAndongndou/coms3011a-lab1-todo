import { listTasks, listTopics } from '@/lib/tasks';
import TaskForm from './components/TaskForm';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  todo: 'Todo',
  in_progress: 'In-Progress',
  complete: 'Complete',
};

export default function Home() {
  const tasks = listTasks('due_date');
  const topics = listTopics().map((t) => t.name);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Tasks</h1>

      <TaskForm topics={topics} />

      <ul className="mt-8 grid gap-3">
        {tasks.length === 0 && <p className="text-muted">No tasks yet.</p>}
        {tasks.map((task) => (
          <li key={task.id} className="rounded-lg border border-border p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-medium">{task.title}</h2>
              {task.is_overdue === 1 && (
                <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                  Overdue
                </span>
              )}
            </div>
            {task.description && (
              <p className="mt-1 text-sm text-muted">{task.description}</p>
            )}
            <div className="mt-2 flex gap-3 text-xs text-muted">
              <span>{task.topic_name}</span>
              <span>{STATUS_LABEL[task.status]}</span>
              <span>Due {task.due_date}</span>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}