'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createTask,
  updateTask,
  archiveTask,
  restoreTask,
  setTaskStatus,
  type Status,
} from '@/lib/tasks';

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
  if (!input.title) return 'Enter a title.';
  if (!input.topic) return 'Enter a topic.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.due_date)) return 'Choose a due date.';
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
    return { error: 'That task could not be saved.' };
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
    return { error: 'That change could not be saved.' };
  }

  revalidatePath('/');
  redirect('/');
}

export async function setStatusAction(formData: FormData): Promise<void> {
  const id = readId(formData);
  const status = String(formData.get('status') ?? '');
  if (id === null || !STATUSES.includes(status as Status)) return;
  setTaskStatus(id, status as Status);
  revalidatePath('/');
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