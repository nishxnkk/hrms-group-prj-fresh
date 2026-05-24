import pool from "../db/db.js";

export const createTasksTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      assigned_to INTEGER,
      created_by INTEGER,
      status VARCHAR(20) DEFAULT 'pending',
      percent_completed INTEGER DEFAULT 0,
      due_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
    // Ensure optional columns exist for older DBs
    await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS percent_completed INTEGER DEFAULT 0`);
    await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'`);
    await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE`);
    // Support certification by admin: certified_by (user id) and certified_at (timestamp)
    await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS certified_by INTEGER`);
    await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS certified_at TIMESTAMP`);
    console.log("✅ Tasks table created/updated successfully");
  } catch (error) {
    console.error("❌ Error creating tasks table:", error);
  }
};

export const createTask = async (title, description = '', assigned_to = null, created_by = null, due_date = null, percent_completed = 0, status = 'pending') => {
  const query = `
    INSERT INTO tasks (title, description, assigned_to, created_by, due_date, percent_completed, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const values = [title, description, assigned_to, created_by, due_date, percent_completed, status];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const getTasks = async (assignedTo = null) => {
  // Join to users to get basic creator/assignee names for UI convenience
  if (assignedTo) {
    const query = `SELECT t.*, a.fullname AS assigned_to_name, c.fullname AS created_by_name FROM tasks t LEFT JOIN users a ON t.assigned_to = a.id LEFT JOIN users c ON t.created_by = c.id WHERE t.assigned_to = $1 ORDER BY t.due_date NULLS LAST, t.created_at DESC`;
    const { rows } = await pool.query(query, [assignedTo]);
    return rows;
  }

  const query = `SELECT t.*, a.fullname AS assigned_to_name, c.fullname AS created_by_name, cb.fullname AS certified_by_name FROM tasks t LEFT JOIN users a ON t.assigned_to = a.id LEFT JOIN users c ON t.created_by = c.id LEFT JOIN users cb ON t.certified_by = cb.id ORDER BY t.due_date NULLS LAST, t.created_at DESC`;
  const { rows } = await pool.query(query);
  return rows;
};

export const getTaskById = async (id) => {
  const query = `SELECT t.*, a.fullname AS assigned_to_name, c.fullname AS created_by_name FROM tasks t LEFT JOIN users a ON t.assigned_to = a.id LEFT JOIN users c ON t.created_by = c.id WHERE t.id = $1`;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

export const updateTask = async (id, updates) => {
  const allowed = ['title', 'description', 'assigned_to', 'status', 'percent_completed', 'due_date', 'certified_by', 'certified_at'];
  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const key of Object.keys(updates)) {
    if (!allowed.includes(key)) continue;
    setClauses.push(`${key} = $${idx}`);
    values.push(updates[key]);
    idx++;
  }

  if (setClauses.length === 0) {
    return await getTaskById(id);
  }

  // update updated_at
  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
  values.push(id);
  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const deleteTask = async (id) => {
  const query = `DELETE FROM tasks WHERE id = $1`;
  await pool.query(query, [id]);
  return true;
};

export const getTasksSummary = async (assignedOnly = null) => {
  // Aggregate total/completed/overdue counts per assigned user
  if (assignedOnly) {
    const query = `
      SELECT t.assigned_to AS user_id,
             COUNT(*)::int AS total,
             SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END)::int AS completed,
             SUM(CASE WHEN t.due_date < CURRENT_DATE AND t.status <> 'completed' THEN 1 ELSE 0 END)::int AS overdue
      FROM tasks t
      WHERE t.assigned_to = $1
      GROUP BY t.assigned_to
    `;
    const { rows } = await pool.query(query, [assignedOnly]);
    return rows;
  }

  const query = `
    SELECT t.assigned_to AS user_id,
           COUNT(*)::int AS total,
           SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END)::int AS completed,
           SUM(CASE WHEN t.due_date < CURRENT_DATE AND t.status <> 'completed' THEN 1 ELSE 0 END)::int AS overdue
    FROM tasks t
    WHERE t.assigned_to IS NOT NULL
    GROUP BY t.assigned_to
  `;

  const { rows } = await pool.query(query);
  return rows;
};
