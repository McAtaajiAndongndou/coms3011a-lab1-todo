import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTask, listTopics } from '@/lib/tasks';
import EditTaskForm from '@/app/components/EditTaskForm';

export const dynamic = 'force-dynamic';

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = getTask(Number(id));
  if (!task) notFound();

  const topics = listTopics().map((t) => t.name);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/" className="text-sm text-muted underline underline-offset-2">
        Back to tasks
      </Link>

      <h1 className="mt-4 mb-6 text-2xl font-semibold">Edit task</h1>

      <EditTaskForm task={task} topics={topics} />
    </main>
  );
}
