import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTask, listTopics } from '@/lib/tasks';
import { relativeDue } from '@/lib/relative-time';
import EditTaskForm from '@/app/components/EditTaskForm';

export const dynamic = 'force-dynamic';

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = getTask(Number(id));
  if (!task) notFound();

  const topics = listTopics().map((t) => t.name);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-widest text-muted underline underline-offset-4 transition-colors hover:text-foreground"
      >
        ← Tasks
      </Link>

      <header className="mt-6 mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-border pb-4">
        <h1 className="font-display text-3xl font-medium tracking-tight">Edit task</h1>
        <p
          className={`font-mono text-xs tabular-nums ${
            task.is_overdue === 1 ? 'text-overdue' : 'text-muted'
          }`}
        >
          Due {relativeDue(task.days_until, task.is_overdue === 1)}
        </p>
      </header>

      <EditTaskForm task={task} topics={topics} />
    </main>
  );
}