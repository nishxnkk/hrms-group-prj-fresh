import pool from "../db/db.js";

export const createPayrollTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS payroll_records (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pay_period DATE NOT NULL,
      basic_salary NUMERIC(12,2) DEFAULT 0,
      allowances NUMERIC(12,2) DEFAULT 0,
      bonus NUMERIC(12,2) DEFAULT 0,
      deductions NUMERIC(12,2) DEFAULT 0,
      tax NUMERIC(12,2) DEFAULT 0,
      net_pay NUMERIC(12,2) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'DRAFT',
      notes TEXT DEFAULT '',
      paid_at TIMESTAMP NULL,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, pay_period)
    );
  `;

  await pool.query(query);
  await pool.query("ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS bonus NUMERIC(12,2) DEFAULT 0");
  await pool.query("ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS tax NUMERIC(12,2) DEFAULT 0");
  await pool.query("ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT ''");
  await pool.query("ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP NULL");
  await pool.query("ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
  console.log("Payroll table created/updated successfully");
};

const payrollSelect = `
  SELECT
    p.*,
    u.fullname AS employee_name,
    u.email AS employee_email,
    u.employee_id,
    u.department,
    u.designation
  FROM payroll_records p
  JOIN users u ON u.id = p.user_id
`;

export const listPayrollRecords = async ({ userId, month, status } = {}) => {
  const filters = [];
  const values = [];

  if (userId) {
    values.push(userId);
    filters.push(`p.user_id = $${values.length}`);
  }

  if (month) {
    values.push(`${month}-01`);
    filters.push(`p.pay_period = $${values.length}`);
  }

  if (status) {
    values.push(status.toUpperCase());
    filters.push(`UPPER(p.status) = $${values.length}`);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `${payrollSelect} ${where} ORDER BY p.pay_period DESC, u.fullname ASC`,
    values
  );
  return rows;
};

export const getPayrollRecordById = async (id) => {
  const { rows } = await pool.query(`${payrollSelect} WHERE p.id = $1`, [id]);
  return rows[0];
};

export const upsertPayrollRecord = async (data) => {
  const {
    user_id,
    pay_period,
    basic_salary,
    allowances,
    bonus,
    deductions,
    tax,
    net_pay,
    status,
    notes,
    created_by,
  } = data;

  const { rows } = await pool.query(
    `
      INSERT INTO payroll_records
        (user_id, pay_period, basic_salary, allowances, bonus, deductions, tax, net_pay, status, notes, created_by, paid_at, updated_at)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, CASE WHEN $9 = 'PAID' THEN NOW() ELSE NULL END, NOW())
      ON CONFLICT (user_id, pay_period)
      DO UPDATE SET
        basic_salary = EXCLUDED.basic_salary,
        allowances = EXCLUDED.allowances,
        bonus = EXCLUDED.bonus,
        deductions = EXCLUDED.deductions,
        tax = EXCLUDED.tax,
        net_pay = EXCLUDED.net_pay,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        paid_at = CASE
          WHEN EXCLUDED.status = 'PAID' AND payroll_records.paid_at IS NULL THEN NOW()
          WHEN EXCLUDED.status <> 'PAID' THEN NULL
          ELSE payroll_records.paid_at
        END,
        updated_at = NOW()
      RETURNING *;
    `,
    [user_id, pay_period, basic_salary, allowances, bonus, deductions, tax, net_pay, status, notes, created_by]
  );

  return rows[0];
};

export const updatePayrollStatus = async (id, status) => {
  const { rows } = await pool.query(
    `
      UPDATE payroll_records
      SET status = $1,
          paid_at = CASE WHEN $1 = 'PAID' THEN COALESCE(paid_at, NOW()) ELSE NULL END,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `,
    [status, id]
  );
  return rows[0];
};

export const deletePayrollRecord = async (id) => {
  const { rowCount } = await pool.query("DELETE FROM payroll_records WHERE id = $1", [id]);
  return rowCount > 0;
};

export const getPayrollSummary = async ({ userId, month } = {}) => {
  const filters = [];
  const values = [];

  if (userId) {
    values.push(userId);
    filters.push(`user_id = $${values.length}`);
  }

  if (month) {
    values.push(`${month}-01`);
    filters.push(`pay_period = $${values.length}`);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `
      SELECT
        COUNT(*)::INTEGER AS records,
        COALESCE(SUM(net_pay), 0)::NUMERIC(12,2) AS total_net_pay,
        COALESCE(SUM(deductions + tax), 0)::NUMERIC(12,2) AS total_deductions,
        COUNT(*) FILTER (WHERE status = 'PAID')::INTEGER AS paid,
        COUNT(*) FILTER (WHERE status = 'PROCESSED')::INTEGER AS processed,
        COUNT(*) FILTER (WHERE status = 'DRAFT')::INTEGER AS draft
      FROM payroll_records
      ${where}
    `,
    values
  );

  return rows[0];
};
