import pool from "../db/db.js";

export const HR_MODULES = [
  "leave",
  "attendance",
  "performance",
  "documents",
  "announcements",
  "assets",
  "shifts",
  "expenses",
  "onboarding",
  "exit",
];

export const createHrModuleTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hr_records (
      id SERIAL PRIMARY KEY,
      module_key VARCHAR(40) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      status VARCHAR(40) DEFAULT 'PENDING',
      owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
      start_date DATE,
      end_date DATE,
      amount NUMERIC(12, 2),
      metadata JSONB DEFAULT '{}'::jsonb,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`ALTER TABLE hr_records ADD COLUMN IF NOT EXISTS module_key VARCHAR(40) NOT NULL DEFAULT 'leave'`);
  await pool.query(`ALTER TABLE hr_records ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT 'Untitled'`);
  await pool.query(`ALTER TABLE hr_records ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''`);
  await pool.query(`ALTER TABLE hr_records ADD COLUMN IF NOT EXISTS status VARCHAR(40) DEFAULT 'PENDING'`);
  await pool.query(`ALTER TABLE hr_records ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL`);
  await pool.query(`ALTER TABLE hr_records ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL`);
  await pool.query(`ALTER TABLE hr_records ADD COLUMN IF NOT EXISTS start_date DATE`);
  await pool.query(`ALTER TABLE hr_records ADD COLUMN IF NOT EXISTS end_date DATE`);
  await pool.query(`ALTER TABLE hr_records ADD COLUMN IF NOT EXISTS amount NUMERIC(12, 2)`);
  await pool.query(`ALTER TABLE hr_records ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb`);
  await pool.query(`ALTER TABLE hr_records ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL`);
  await pool.query(`ALTER TABLE hr_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await pool.query(`ALTER TABLE hr_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await pool.query(`CREATE INDEX IF NOT EXISTS hr_records_module_idx ON hr_records(module_key)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS hr_records_owner_idx ON hr_records(owner_id)`);
};

const normalizeModule = (moduleKey) => {
  const key = (moduleKey || "").toString().trim().toLowerCase();
  if (!HR_MODULES.includes(key)) {
    throw new Error("Invalid HR module");
  }
  return key;
};

const canSeeAll = (user) => user?.role === "Admin";

export const listHrRecords = async ({ moduleKey, user }) => {
  const key = normalizeModule(moduleKey);
  const params = [key];
  let where = "r.module_key = $1";

  if (!canSeeAll(user) && key !== "announcements") {
    params.push(user.id);
    where += ` AND (r.owner_id = $2 OR r.assigned_to = $2 OR r.created_by = $2)`;
  }

  const { rows } = await pool.query(
    `
      SELECT
        r.*,
        owner.fullname AS owner_name,
        assignee.fullname AS assignee_name,
        creator.fullname AS creator_name
      FROM hr_records r
      LEFT JOIN users owner ON owner.id = r.owner_id
      LEFT JOIN users assignee ON assignee.id = r.assigned_to
      LEFT JOIN users creator ON creator.id = r.created_by
      WHERE ${where}
      ORDER BY r.created_at DESC
    `,
    params
  );
  return rows;
};

export const createHrRecord = async (record) => {
  const moduleKey = normalizeModule(record.module_key);
  const metadata = record.metadata && typeof record.metadata === "object" ? record.metadata : {};
  const { rows } = await pool.query(
    `
      INSERT INTO hr_records
        (module_key, title, description, status, owner_id, assigned_to, start_date, end_date, amount, metadata, created_by)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)
      RETURNING *
    `,
    [
      moduleKey,
      record.title,
      record.description || "",
      record.status || "PENDING",
      record.owner_id || null,
      record.assigned_to || null,
      record.start_date || null,
      record.end_date || null,
      record.amount || null,
      JSON.stringify(metadata),
      record.created_by || null,
    ]
  );
  return rows[0];
};

export const updateHrRecord = async (id, updates) => {
  const allowed = ["title", "description", "status", "owner_id", "assigned_to", "start_date", "end_date", "amount", "metadata"];
  const set = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (!Object.prototype.hasOwnProperty.call(updates, key)) continue;
    if (key === "metadata") {
      set.push(`${key} = $${idx}::jsonb`);
      values.push(JSON.stringify(updates[key] && typeof updates[key] === "object" ? updates[key] : {}));
    } else {
      set.push(`${key} = $${idx}`);
      values.push(updates[key] === "" ? null : updates[key]);
    }
    idx += 1;
  }

  if (set.length === 0) return null;

  set.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE hr_records SET ${set.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] || null;
};

export const deleteHrRecord = async (id) => {
  const { rows } = await pool.query("DELETE FROM hr_records WHERE id = $1 RETURNING id", [id]);
  return rows[0] || null;
};

export const getHrSummary = async (user) => {
  const params = [];
  let where = "TRUE";

  if (!canSeeAll(user)) {
    params.push(user.id);
    where = "(owner_id = $1 OR assigned_to = $1 OR created_by = $1 OR module_key = 'announcements')";
  }

  const { rows } = await pool.query(
    `
      SELECT module_key, status, COUNT(*)::int AS count
      FROM hr_records
      WHERE ${where}
      GROUP BY module_key, status
      ORDER BY module_key, status
    `,
    params
  );
  return rows;
};
