import pool from '../db/db.js';

export const createRedemptionTables = async () => {
  const itemsQuery = `
    CREATE TABLE IF NOT EXISTS redemption_items (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      cost INTEGER NOT NULL,
      inventory INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const txQuery = `
    CREATE TABLE IF NOT EXISTS redemptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      item_id INTEGER NOT NULL REFERENCES redemption_items(id),
      cost INTEGER NOT NULL,
      status VARCHAR(50) DEFAULT 'completed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(itemsQuery);
    await pool.query(txQuery);
    // Seed a few items if none exist
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM redemption_items');
    if (rows && rows[0] && parseInt(rows[0].count, 10) === 0) {
      await pool.query(`INSERT INTO redemption_items (title, description, cost, inventory) VALUES
        ('Coffee Card', 'Redeem for a free coffee', 500, 100),
        ('Movie Tickets', 'Two movie passes', 2000, 50),
        ('Amazon Gift Card', 'Gift card for shopping', 5000, 20),
        ('Extra Day Off', 'Redeem for a paid extra day off', 10000, 5)
      `);
    }
    console.log('✅ Redemption tables created/updated successfully');
  } catch (err) {
    console.error('❌ Error creating redemption tables', err);
  }
};

export const getItems = async () => {
  const { rows } = await pool.query('SELECT * FROM redemption_items ORDER BY cost ASC');
  return rows;
};

export const getItemById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM redemption_items WHERE id = $1', [id]);
  return rows[0];
};

export const reduceInventory = async (itemId, qty = 1) => {
  const { rows } = await pool.query('UPDATE redemption_items SET inventory = inventory - $1 WHERE id = $2 AND inventory >= $1 RETURNING *', [qty, itemId]);
  return rows[0];
};

export const createRedemptionRecord = async (userId, itemId, cost, status = 'completed') => {
  const { rows } = await pool.query('INSERT INTO redemptions (user_id, item_id, cost, status) VALUES ($1,$2,$3,$4) RETURNING *', [userId, itemId, cost, status]);
  return rows[0];
};

export const getUserRedemptions = async (userId) => {
  const { rows } = await pool.query(`SELECT r.*, ri.title as item_title, ri.description as item_description FROM redemptions r JOIN redemption_items ri ON r.item_id = ri.id WHERE r.user_id = $1 ORDER BY r.created_at DESC`, [userId]);
  return rows;
};

export const createItem = async (title, description, cost, inventory = 0) => {
  const { rows } = await pool.query('INSERT INTO redemption_items (title, description, cost, inventory) VALUES ($1,$2,$3,$4) RETURNING *', [title, description, cost, inventory]);
  return rows[0];
};
