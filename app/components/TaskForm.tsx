'use client';

import { useActionState, useRef, useEffect } from 'react';
import { createTaskAction, type FormState } from '@/app/actions';

const initial: FormState = { error: '' };

const field =
  'w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted transition-colors hover:border-accent';

export default function TaskForm({ topics }: { topics: string[] }) {
  const [state, formAction, pending] = useActionState(createTaskAction, initial);
  const form = useRef<HTMLFormElement>(null);

  // Clear the form once a task saves, so the next entry starts empty.
  useEffect(() => {
    if (!pending && state.error === '') form.current?.reset();
  }, [state, pending]);

  return (
    <form
      ref={form}
      action={formAction}
      className="rounded-sm border border-border bg-surface p-5"
    >
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted">New task</p>

      <div className="grid gap-3">
        <input name="title" required placeholder="Title" className={`${field} font-display text-base`} />

        <textarea
          name="description"
          rows={2}
          placeholder="Description (optional)"
          className={`${field} resize-y`}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="due_date" className="mb-1 block font-mono text-xs text-muted">
              Due date
            </label>
            <input
              id="due_date"
              name="due_date"
              type="date"
              required
              className={`${field} font-mono`}
            />
          </div>

          <div>
            <label htmlFor="topic" className="mb-1 block font-mono text-xs text-muted">
              Topic
            </label>
            <input
              id="topic"
              name="topic"
              list="topic-options"
              required
              placeholder="e.g. COMS3011A"
              className={field}
            />
            <datalist id="topic-options">
              {topics.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="mt-3 font-mono text-xs text-overdue">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 cursor-pointer rounded-sm bg-accent px-4 py-2 font-mono text-xs uppercase tracking-widest text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add task'}
      </button>
    </form>
  );
}