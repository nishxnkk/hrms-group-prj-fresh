import pool from '../db/db.js';

export const createPromotionsTable = async () => {
  const qry = `
    CREATE TABLE IF NOT EXISTS promotions (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES users(id),
      created_by INTEGER NOT NULL REFERENCES users(id),
      new_role VARCHAR(255),
      new_salary VARCHAR(255),
      reason TEXT,
      status VARCHAR(50) DEFAULT 'published',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const appsQry = `
    CREATE TABLE IF NOT EXISTS promotion_applications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      promotion_id INTEGER NOT NULL REFERENCES promotions(id),
      cover_letter TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      decided_by INTEGER REFERENCES users(id),
      decided_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(qry);
    await pool.query(appsQry);
    // Ensure audit columns exist if table already existed
    await pool.query("ALTER TABLE promotion_applications ADD COLUMN IF NOT EXISTS decided_by INTEGER REFERENCES users(id);");
    await pool.query("ALTER TABLE promotion_applications ADD COLUMN IF NOT EXISTS decided_at TIMESTAMP NULL;");
    console.log('✅ Promotions tables created/updated successfully');
  } catch (err) {
    console.error('❌ Error creating promotions tables', err);
  }
};

export const createPromotion = async (employeeId, createdBy, newRole, newSalary, reason) => {
  const { rows } = await pool.query(
    'INSERT INTO promotions (employee_id, created_by, new_role, new_salary, reason) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [employeeId, createdBy, newRole, newSalary, reason]
  );
  return rows[0];
};

export const getPromotions = async (status) => {
  if (status) {
    const { rows } = await pool.query('SELECT p.*, u.fullname as employee_name, u.email as employee_email FROM promotions p JOIN users u ON p.employee_id = u.id WHERE p.status = $1 ORDER BY p.created_at DESC', [status]);
    return rows;
  }
  const { rows } = await pool.query('SELECT p.*, u.fullname as employee_name, u.email as employee_email FROM promotions p JOIN users u ON p.employee_id = u.id ORDER BY p.created_at DESC');
  return rows;
};

export const getPromotionById = async (id) => {
  const { rows } = await pool.query('SELECT p.*, u.fullname as employee_name, u.email as employee_email FROM promotions p JOIN users u ON p.employee_id = u.id WHERE p.id = $1', [id]);
  return rows[0];
};

export const createPromotionApplication = async (userId, promotionId, coverLetter) => {
  const { rows } = await pool.query('INSERT INTO promotion_applications (user_id, promotion_id, cover_letter) VALUES ($1,$2,$3) RETURNING *', [userId, promotionId, coverLetter]);
  return rows[0];
};

export const getApplicationsByPromotion = async (promotionId) => {
  const { rows } = await pool.query('SELECT a.*, u.fullname as applicant_name, u.email as applicant_email FROM promotion_applications a JOIN users u ON a.user_id = u.id WHERE a.promotion_id = $1 ORDER BY a.created_at DESC', [promotionId]);
  return rows;
};

export const getUserApplications = async (userId) => {
  const { rows } = await pool.query('SELECT a.*, p.new_role, p.new_salary, p.reason, p.employee_id FROM promotion_applications a JOIN promotions p ON a.promotion_id = p.id WHERE a.user_id = $1 ORDER BY a.created_at DESC', [userId]);
  return rows;
};

export const updatePromotionApplicationStatus = async (appId, status, decidedBy) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock application row
    const appRes = await client.query('SELECT * FROM promotion_applications WHERE id = $1 FOR UPDATE', [appId]);
    const app = appRes.rows[0];
    if (!app) throw new Error('Application not found');

    // Lock promotion row
    const promRes = await client.query('SELECT * FROM promotions WHERE id = $1 FOR UPDATE', [app.promotion_id]);
    const promotion = promRes.rows[0];
    if (!promotion) throw new Error('Promotion not found');

    // Update application status and decision metadata
    const now = new Date();
    const updAppRes = await client.query(
      'UPDATE promotion_applications SET status = $1, decided_by = $2, decided_at = $3 WHERE id = $4 RETURNING *',
      [status, decidedBy, now, appId]
    );
    const updatedApp = updAppRes.rows[0];

    // If accepted, update promotion status and employee designation
    if (status === 'accepted') {
      await client.query('UPDATE promotions SET status = $1 WHERE id = $2', ['accepted', promotion.id]);
      await client.query('UPDATE users SET designation = $1 WHERE id = $2', [promotion.new_role, promotion.employee_id]);
    } else if (status === 'cancelled') {
      await client.query('UPDATE promotions SET status = $1 WHERE id = $2', ['cancelled', promotion.id]);
    } else if (status === 'rejected') {
      // keep promotion published
      await client.query('UPDATE promotions SET status = $1 WHERE id = $2', ['published', promotion.id]);
    }

    await client.query('COMMIT');
    return updatedApp;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};