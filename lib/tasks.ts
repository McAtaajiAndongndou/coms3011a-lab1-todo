import { getDb } from './db';

export type Status = 'todo' | 'in_progress' | 'complete';
export type SortKey = 'due_date' | 'status' | 'topic';

export type Task = {
  id: number;
  title: string;
  description: string;
  due_date: string;
  topic_id: number;
  topic_name: string;
  status: Status;
  archived_at: string | null;
  is_overdue: number;
};

const ORDER_BY: Record<SortKey, string> = {
  due_date: 't.due_date ASC',
  status: "CASE t.status WHEN 'todo' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, t.due_date ASC",
  topic: 'tp.name COLLATE NOCASE ASC, t.due_date ASC',
};

const SELECT = `
  SELECT t.*, tp.name AS topic_name,
    CASE WHEN t.status != 'complete' AND t.due_date < date('now')
         THEN 1 ELSE 0 END AS is_overdue
  FROM tasks t
  JOIN topics tp ON tp.id = t.topic_id
`;

export function listTasks(sort: SortKey = 'due_date', archived = false): Task[] {
  const where = archived ? 't.archived_at IS NOT NULL' : 't.archived_at IS NULL';
  return getDb()
    .prepare(`${SELECT} WHERE ${where} ORDER BY ${ORDER_BY[sort]}`)
    .all() as Task[];
}

export function getTask(id: number): Task | undefined {
  return getDb().prepare(`${SELECT} WHERE t.id = ?`).get(id) as Task | undefined;
}

export function findOrCreateTopic(name: string): number {
  const db = getDb();
  const trimmed = name.trim();
  const existing = db.prepare('SELECT id FROM topics WHERE name = ?').get(trimmed) as
    | { id: number }
    | undefined;
  if (existing) return existing.id;
  return Number(db.prepare('INSERT INTO topics (name) VALUES (?)').run(trimmed).lastInsertRowid);
}

export function createTask(input: {
  title: string;
  description: string;
  due_date: string;
  topic: string;
  status?: Status;
}): number {
  const topicId = findOrCreateTopic(input.topic);
  const result = getDb()
    .prepare(
      `INSERT INTO tasks (title, description, due_date, topic_id, status)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(input.title.trim(), input.description.trim(), input.due_date, topicId, input.status ?? 'todo');
  return Number(result.lastInsertRowid);
}

export function updateTask(
  id: number,
  input: { title: string; description: string; due_date: string; topic: string; status: Status }
): void {
  const topicId = findOrCreateTopic(input.topic);
  getDb()
    .prepare(
      `UPDATE tasks
       SET title = ?, description = ?, due_date = ?, topic_id = ?, status = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(input.title.trim(), input.description.trim(), input.due_date, topicId, input.status, id);
}

export function archiveTask(id: number): void {
  getDb()
    .prepare("UPDATE tasks SET archived_at = datetime('now'), updated_at = datetime('now') WHERE id = ?")
    .run(id);
}

export function listTopics(): { id: number; name: string }[] {
  return getDb().prepare('SELECT id, name FROM topics ORDER BY name COLLATE NOCASE').all() as {
    id: number;
    name: string;
  }[];
}

export function restoreTask(id: number): void {
  getDb()
    .prepare("UPDATE tasks SET archived_at = NULL, updated_at = datetime('now') WHERE id = ?")
    .run(id);
}