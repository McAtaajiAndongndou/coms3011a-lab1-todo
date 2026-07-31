'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createTask, updateTask, archiveTask, restoreTask, type Status } from '@/lib/tasks';

export type FormState = { error: string };

const STATUSES: Status[] = ['todo', 'in_progress', 'complete'];

function readForm(formData: FormData) {
  return {
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    due_date: String(formData.get('due_date') ?? ''),
    topic: String(formData.get('topic') ?? '').trim(),
    status: String(formData.get('status') ?? 'todo'),
  };
}

function validate(input: ReturnType<typeof readForm>): string {
  if (!input.title) return 'Title is required.';
  if (!input.topic) return 'Topic is required.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.due_date)) return 'A valid due date is required.';
  if (!STATUSES.includes(input.status as Status)) return 'Unknown status.';
  return '';
}

function readId(formData: FormData): number | null {
  const id = Number(formData.get('id'));
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function createTaskAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const input = readForm(formData);
  const error = validate(input);
  if (error) return { error };

  try {
    createTask({ ...input, status: input.status as Status });
  } catch {
    return { error: 'Could not save the task.' };
  }

  revalidatePath('/');
  return { error: '' };
}

export async function updateTaskAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const id = readId(formData);
  if (id === null) return { error: 'Unknown task.' };

  const input = readForm(formData);
  const error = validate(input);
  if (error) return { error };

  try {
    updateTask(id, { ...input, status: input.status as Status });
  } catch {
    return { error: 'Could not update the task.' };
  }

  revalidatePath('/');
  redirect('/');
}

export async function archiveTaskAction(formData: FormData): Promise<void> {
  const id = readId(formData);
  if (id === null) return;
  archiveTask(id);
  revalidatePath('/');
}

export async function restoreTaskAction(formData: FormData): Promise<void> {
  const id = readId(formData);
  if (id === null) return;
  restoreTask(id);
  revalidatePath('/');
}