'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { updateTaskAction, type FormState } from '@/app/actions';
import type { Task } from '@/lib/tasks';

const initial: FormState = { error: '' };

const field =
  'w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted transition-colors hover:border-accent';
const label = 'mb-1 block font-mono text-xs uppercase tracking-wider text-muted';

export default function EditTaskForm({ task, topics }: { task: Task; topics: string[] }) {
  const [state, formAction, pending] = useActionState(updateTaskAction, initial);

  return (
    <form action={formAction} className="rounded-sm border border-border bg-surface p-6">
      <input type="hidden" name="id" value={task.id} />

      <div className="grid gap-5">
        <div>
          <label htmlFor="title" className={label}>
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={task.title}
            className={`${field} font-display text-lg`}
          />
        </div>

        <div>
          <label htmlFor="description" className={label}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={task.description}
            className={`${field} resize-y`}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="due_date" className={label}>
              Due date
            </label>
            <input
              id="due_date"
              name="due_date"
              type="date"
              required
              defaultValue={task.due_date}
              className={`${field} font-mono`}
            />
          </div>

          <div>
            <label htmlFor="topic" className={label}>
              Topic
            </label>
            <input
              id="topic"
              name="topic"
              list="topic-options"
              required
              defaultValue={task.topic_name}
              className={field}
            />
            <datalist id="topic-options">
              {topics.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="status" className={label}>
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={task.status}
              className={`${field} cursor-pointer`}
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In-Progress</option>
              <option value="complete">Complete</option>
            </select>
          </div>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="mt-4 font-mono text-xs text-overdue">
          {state.error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-5">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-sm bg-accent px-4 py-2 font-mono text-xs uppercase tracking-widest text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
        <Link
          href="/"
          className="font-mono text-xs text-muted underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}