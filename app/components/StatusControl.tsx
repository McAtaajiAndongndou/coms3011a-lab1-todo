'use client';

import { useRef } from 'react';
import { setStatusAction } from '@/app/actions';

/**
 * Changing status is the most frequent action in a task list, so it lives on
 * the row rather than behind the edit page. The three values are fixed and
 * match the CHECK constraint on the tasks table.
 */
export default function StatusControl({ id, status }: { id: number; status: string }) {
  const form = useRef<HTMLFormElement>(null);

  return (
    <form ref={form} action={setStatusAction}>
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`status-${id}`}>
        Status
      </label>
      <select
        id={`status-${id}`}
        name="status"
        defaultValue={status}
        onChange={() => form.current?.requestSubmit()}
        className="cursor-pointer rounded-sm border border-border bg-surface px-2 py-1 font-mono text-xs text-foreground transition-colors hover:border-accent"
      >
        <option value="todo">Todo</option>
        <option value="in_progress">In-Progress</option>
        <option value="complete">Complete</option>
      </select>
    </form>
  );
}
