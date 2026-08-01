import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { closeDb, getDb } from '../lib/db';
import {
  archiveTask,
  createTask,
  findOrCreateTopic,
  getTask,
  listTasks,
  listTopics,
  restoreTask,
  updateTask,
} from '../lib/tasks';

/**
 * Dates are computed as offsets from today in UTC, matching SQLite's
 * date('now'). Offsets are deliberately large so the result cannot change
 * depending on what time of day the suite runs.
 */
function daysFromToday(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

beforeEach(() => {
  // Tasks first: topics are protected by ON DELETE RESTRICT.
  getDb().exec('DELETE FROM tasks; DELETE FROM topics;');
});

afterAll(() => {
  closeDb();
});

describe('creating a task', () => {
  it('stores all four fields and reads them back', () => {
    const id = createTask({
      title: 'Submit Lab 1',
      description: 'Push final repo and documentation',
      due_date: '2026-08-04',
      topic: 'COMS3011A',
    });

    const task = getTask(id);

    expect(task).toBeDefined();
    expect(task!.title).toBe('Submit Lab 1');
    expect(task!.description).toBe('Push final repo and documentation');
    expect(task!.due_date).toBe('2026-08-04');
    expect(task!.topic_name).toBe('COMS3011A');
    expect(task!.status).toBe('todo');
    expect(task!.archived_at).toBeNull();
  });

  it('refuses a status outside the three fixed values', () => {
    const topicId = findOrCreateTopic('COMS3011A');

    expect(() =>
      getDb()
        .prepare(
          'INSERT INTO tasks (title, description, due_date, topic_id, status) VALUES (?, ?, ?, ?, ?)'
        )
        .run('Rejected', '', '2026-08-04', topicId, 'overdue')
    ).toThrow();
  });
});

describe('the overdue rule', () => {
  it('flags a past-due task that is not complete', () => {
    const id = createTask({
      title: 'Read chapter 4',
      description: '',
      due_date: daysFromToday(-10),
      topic: 'COMS3011A',
    });

    expect(getTask(id)!.is_overdue).toBe(1);
  });

  it('does not flag a past-due task that is complete', () => {
    const id = createTask({
      title: 'Gym session',
      description: '',
      due_date: daysFromToday(-10),
      topic: 'Health',
      status: 'complete',
    });

    expect(getTask(id)!.is_overdue).toBe(0);
  });

  it('does not flag a task due in the future', () => {
    const id = createTask({
      title: 'Prep presentation',
      description: '',
      due_date: daysFromToday(10),
      topic: 'COMS3011A',
    });

    expect(getTask(id)!.is_overdue).toBe(0);
  });

  it('is derived, not stored as a column', () => {
    const columns = (getDb().prepare('PRAGMA table_info(tasks)').all() as { name: string }[]).map(
      (column) => column.name
    );

    expect(columns).not.toContain('overdue');
    expect(columns).not.toContain('is_overdue');
  });
});

describe('archiving', () => {
  it('removes a task from the active list but keeps it viewable', () => {
    const id = createTask({
      title: 'Gym session',
      description: 'Leg day',
      due_date: daysFromToday(-10),
      topic: 'Health',
    });

    expect(listTasks('due_date').map((task) => task.id)).toContain(id);

    archiveTask(id);

    expect(listTasks('due_date').map((task) => task.id)).not.toContain(id);
    expect(listTasks('due_date', true).map((task) => task.id)).toContain(id);

    const archived = getTask(id);
    expect(archived).toBeDefined();
    expect(archived!.title).toBe('Gym session');
    expect(archived!.archived_at).not.toBeNull();
  });

  it('does not delete the row', () => {
    const id = createTask({
      title: 'Buy groceries',
      description: '',
      due_date: daysFromToday(5),
      topic: 'Personal',
    });

    const before = getDb().prepare('SELECT COUNT(*) AS total FROM tasks').get() as {
      total: number;
    };

    archiveTask(id);

    const after = getDb().prepare('SELECT COUNT(*) AS total FROM tasks').get() as {
      total: number;
    };

    expect(after.total).toBe(before.total);
  });

  it('returns a restored task to the active list', () => {
    const id = createTask({
      title: 'Call home',
      description: '',
      due_date: daysFromToday(5),
      topic: 'Personal',
    });

    archiveTask(id);
    restoreTask(id);

    expect(listTasks('due_date').map((task) => task.id)).toContain(id);
    expect(getTask(id)!.archived_at).toBeNull();
  });
});

describe('sorting', () => {
  it('orders by status as todo, then in progress, then complete', () => {
    const due = daysFromToday(5);
    createTask({ title: 'Third', description: '', due_date: due, topic: 'Admin', status: 'complete' });
    createTask({ title: 'First', description: '', due_date: due, topic: 'Admin', status: 'todo' });
    createTask({
      title: 'Second',
      description: '',
      due_date: due,
      topic: 'Admin',
      status: 'in_progress',
    });

    expect(listTasks('status').map((task) => task.status)).toEqual([
      'todo',
      'in_progress',
      'complete',
    ]);
  });

  it('orders by due date, earliest first', () => {
    createTask({ title: 'Later', description: '', due_date: daysFromToday(20), topic: 'Admin' });
    createTask({ title: 'Sooner', description: '', due_date: daysFromToday(5), topic: 'Admin' });

    expect(listTasks('due_date').map((task) => task.title)).toEqual(['Sooner', 'Later']);
  });

  it('orders by topic name', () => {
    const due = daysFromToday(5);
    createTask({ title: 'Task Z', description: '', due_date: due, topic: 'Zoology' });
    createTask({ title: 'Task A', description: '', due_date: due, topic: 'Admin' });

    expect(listTasks('topic').map((task) => task.topic_name)).toEqual(['Admin', 'Zoology']);
  });
});

describe('topics', () => {
  it('reuses an existing topic regardless of case', () => {
    const first = findOrCreateTopic('COMS3011A');
    const second = findOrCreateTopic('coms3011a');

    expect(second).toBe(first);
    expect(listTopics()).toHaveLength(1);
  });
});

describe('editing a task', () => {
  it('persists changes and re-derives overdue from the new due date', () => {
    const id = createTask({
      title: 'Call Home',
      description: '',
      due_date: daysFromToday(-10),
      topic: 'Personal',
    });

    expect(getTask(id)!.is_overdue).toBe(1);

    updateTask(id, {
      title: 'Call home',
      description: 'Sunday evening',
      due_date: daysFromToday(10),
      topic: 'Family',
      status: 'in_progress',
    });

    const updated = getTask(id)!;

    expect(updated.title).toBe('Call home');
    expect(updated.description).toBe('Sunday evening');
    expect(updated.due_date).toBe(daysFromToday(10));
    expect(updated.topic_name).toBe('Family');
    expect(updated.status).toBe('in_progress');
    expect(updated.is_overdue).toBe(0);
  });
});
