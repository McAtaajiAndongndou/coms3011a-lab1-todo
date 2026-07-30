'use client';

import { useActionState } from 'react';
import { createTaskAction, type FormState } from '@/app/actions';

const initial: FormState = { error: '' };

export default function TaskForm({ topics }: { topics: string[] }) {
  const [state, formAction, pending] = useActionState(createTaskAction, initial);

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border border-border p-4">
      <input
        name="title"
        required
        placeholder="Title"
        className="rounded border border-border px-3 py-2"
      />
      <textarea
        name="description"
        rows={2}
        placeholder="Description"
        className="rounded border border-border px-3 py-2"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="due_date"
          type="date"
          required
          className="rounded border border-border px-3 py-2"
        />
        <input
          name="topic"
          list="topic-options"
          required
          placeholder="Topic"
          className="rounded border border-border px-3 py-2"
        />
        <datalist id="topic-options">
          {topics.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="justify-self-start rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add task'}
      </button>
    </form>
  );
}