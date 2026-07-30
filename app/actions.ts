'use server';

import { revalidatePath } from 'next/cache';
import { createTask } from '@/lib/tasks';

export type FormState = { error: string };

export async function createTaskAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const due_date = String(formData.get('due_date') ?? '');
  const topic = String(formData.get('topic') ?? '').trim();

  if (!title) return { error: 'Title is required.' };
  if (!topic) return { error: 'Topic is required.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due_date)) return { error: 'A valid due date is required.' };

  try {
    createTask({ title, description, due_date, topic });
  } catch {
    return { error: 'Could not save the task.' };
  }

  revalidatePath('/');
  return { error: '' };
}