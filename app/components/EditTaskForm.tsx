'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { updateTaskAction, type FormState } from '@/app/actions';
import type { Task } from '@/lib/tasks';

const initial: FormState = { error: '' };

export default function EditTaskForm({ task, topics }: { task: Task; topics: string[] }) {
  const [state, formAction, pending] = useActionState(updateTaskAction, initial);

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border border-border p-4">
      <input type="hidden" name="id" value={task.id} />

      <label className="grid gap-1 text-sm">
        <span className="text-muted">Title</span>
        <input
          name="title"
          required
          defaultValue={task.title}
          className="rounded border border-border px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-muted">Description</span>
        <textarea
          name="description"
          rows={2}
          defaultValue={task.description}
          className="rounded border border-border px-3 py-2"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm">
          <span className="text-muted">Due date</span>
          <input
            name="due_date"
            type="date"
            required
            defaultValue={task.due_date}
            className="rounded border border-border px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-muted">Topic</span>
          <input
            name="topic"
            list="topic-options"
            required
            defaultValue={task.topic_name}
            className="rounded border border-border px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-muted">Status</span>
          <select
            name="status"
            defaultValue={task.status}
            className="rounded border border-border px-3 py-2"
          >
            <option value="todo">Todo</option>
            <option value="in_progress">In-Progress</option>
            <option value="complete">Complete</option>
          </select>
        </label>
      </div>

      <datalist id="topic-options">
        {topics.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      {state.error && <p className="text-sm text-red-500">{state.error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
        <Link href="/" className="text-sm text-muted underline underline-offset-2">
          Cancel
        </Link>
      </div>
    </form>
  );
}
