import pool from "../db/db.js"; // db

export const createUserTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      employee_id VARCHAR(50) DEFAULT '',
      fullname VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      designation VARCHAR(100) DEFAULT '',
      job_title VARCHAR(100) DEFAULT '',
      department VARCHAR(100) DEFAULT '',
      phone VARCHAR(50) DEFAULT '',
      date_of_joining DATE,
      status VARCHAR(20) DEFAULT 'ACTIVE',
      role VARCHAR(20) DEFAULT 'Employee',
      profile_picture TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    // Ensure columns exist for older databases
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50) DEFAULT ''`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(100) DEFAULT ''`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(100) DEFAULT ''`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT ''`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT ''`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_joining DATE`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE'`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'Employee'`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS location_city VARCHAR(255) DEFAULT ''`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS location_country VARCHAR(255) DEFAULT ''`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT ''`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'Not Specified'`);
    // Add resigned_at timestamp to track monthly attrition
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS resigned_at TIMESTAMP`);

    // Create archived_users table to store deleted/resigned user snapshots
    await pool.query(`
      CREATE TABLE IF NOT EXISTS archived_users (
        id SERIAL PRIMARY KEY,
        original_id INTEGER,
        data JSONB,
        resignation_reason TEXT,
        resigned_at TIMESTAMP,
        archived_by INTEGER,
        archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Users table created/updated successfully");
  } catch (error) {
    console.error("❌ Error creating users table:", error);
  }
};

export const createUser = async (
  fullname,
  email,
  password,
  designation = '',
  job_title = '',
  department = '',
  phone = '',
  date_of_joining = null,
  employee_id = '',
  profile_picture = '',
  status = 'ACTIVE',
  role = 'Employee',
  gender = 'Not Specified'
) => {
  const query = `
    INSERT INTO users (employee_id, fullname, email, password, designation, job_title, department, phone, date_of_joining, status, profile_picture, role, gender)
    VALUES ($1,$2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *;
  `;
  const values = [employee_id, fullname, email, password, designation, job_title, department, phone, date_of_joining, status, profile_picture, role, gender];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const updateUserProfile = async (id, fullname, email, designation, profile_picture, gender) => {
  // Properly order SQL parameters. When profile_picture is not provided, gender should be $4 and id $5.
  let query = `
        UPDATE users 
        SET fullname = $1, email = $2, designation = $3, gender = $4
        WHERE id = $5
        RETURNING *;
    `;
  let values = [fullname, email, designation, gender, id];

  if (profile_picture) {
    // When profile_picture is provided, profile_picture is $4, gender $5 and id $6
    query = `
            UPDATE users 
            SET fullname = $1, email = $2, designation = $3, profile_picture = $4, gender = $5
            WHERE id = $6
            RETURNING *;
        `;
    values = [fullname, email, designation, profile_picture, gender, id];
  }

  const { rows } = await pool.query(query, values);
  return rows[0];
}

export const findUserByEmail = async (email) => {
  const query = "SELECT * FROM users WHERE email = $1";
  const { rows } = await pool.query(query, [email]);
  return rows[0];
};

export const findUserById = async (id) => {
  const query = "SELECT * FROM users WHERE id = $1";
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

export const updateUser = async (id, updates) => {
  // Only allow these fields to be updated
  const allowed = [
    "employee_id",
    "fullname",
    "email",
    "password",
    "designation",
    "job_title",
    "department",
    "phone",
    "date_of_joining",
    "status",
    "profile_picture",
    "location_city",
    "location_city",
    "location_country",
    "gender",
  ];

  // Fetch existing user state so we can update resigned_at when status changes
  const existing = await findUserById(id);

  const setClauses = [];
  const values = [];
  let idx = 1;
  for (const key of Object.keys(updates)) {
    if (!allowed.includes(key)) continue;
    setClauses.push(`${key} = $${idx}`);
    values.push(updates[key]);
    idx++;
  }

  // Handle status -> resigned_at logic: if setting status to 'Resigned', stamp resigned_at; if removing resignation, clear it
  if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
    const s = updates.status ? updates.status.toString().trim().toUpperCase() : '';
    if (s === 'RESIGNED') {
      // use SQL NOW() so timezone is DB consistent
      setClauses.push(`resigned_at = NOW()`);
    } else if (existing && existing.resigned_at) {
      // status changed away from resigned, clear resigned_at
      setClauses.push(`resigned_at = NULL`);
    }
  }

  if (setClauses.length === 0) {
    const user = await findUserById(id);
    return user;
  }

  const query = `UPDATE users SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING id, employee_id, fullname, email, designation, job_title, department, phone, date_of_joining, status, profile_picture, gender, role, created_at, resigned_at, last_activity`;
  values.push(id);
  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const getAllUsers = async () => {
  const query = `SELECT id, employee_id, fullname, email, designation, job_title, department, phone, date_of_joining, status, profile_picture, gender, points, role, created_at, last_activity FROM users ORDER BY points DESC, fullname`;
  const { rows } = await pool.query(query);
  return rows;
};

export const archiveUserById = async (id, reason = null, archivedBy = null) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [id]);
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      throw new Error('User not found');
    }
    const user = rows[0];
    const resignedAt = user.resigned_at || new Date();

    // Discover foreign key dependencies referencing users(id)
    const fkQuery = `
      SELECT
        tc.table_name,
        kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'users' AND ccu.column_name = 'id';
    `;
    const { rows: fkRows } = await client.query(fkQuery);

    const dependents = {};

    // Helper: get primary key column for a table (fallback to 'id')
    const getPrimaryKeyColumn = async (tbl) => {
      const { rows: pkRows } = await client.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = $1
      `, [tbl]);
      return (pkRows && pkRows[0] && pkRows[0].column_name) ? pkRows[0].column_name : 'id';
    };

    // Recursive cleanup: for given table and primary key values, find child tables that reference it and null/delete rows as needed
    const recursiveCleanup = async (tbl, pkVals, visited = new Set()) => {
      if (!pkVals || pkVals.length === 0) return;
      const key = `${tbl}:${pkVals.join(',')}`;
      if (visited.has(key)) return;
      visited.add(key);

      // Find all FKs that reference this table
      const childFkQ = `
        SELECT tc.table_name, kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = $1
      `;
      const { rows: childFks } = await client.query(childFkQ, [tbl]);

      for (const cf of childFks) {
        const childTable = cf.table_name;
        const childColumn = cf.column_name;
        const childPk = await getPrimaryKeyColumn(childTable);

        // Find child rows referencing any of our PK values
        const placeholders = pkVals.map((_, i) => `$${i + 1}`).join(',');
        const selectChildQ = `SELECT ${childPk} FROM ${childTable} WHERE ${childColumn} IN (${placeholders})`;
        const { rows: childRows } = await client.query(selectChildQ, pkVals);
        if (!childRows || childRows.length === 0) continue;

        const childIds = childRows.map(r => r[childPk]).filter(Boolean);
        if (childIds.length === 0) continue;

        // Recurse to clean grandchildren first
        await recursiveCleanup(childTable, childIds, visited);

        // Check if child FK column is nullable
        const { rows: childColInfo } = await client.query(`SELECT is_nullable FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`, [childTable, childColumn]);
        const childIsNullable = childColInfo && childColInfo[0] && childColInfo[0].is_nullable === 'YES';

        if (childIsNullable) {
          const updPlaceholders = pkVals.map((_, i) => `$${i + 1}`).join(',');
          const updQ = `UPDATE ${childTable} SET ${childColumn} = NULL WHERE ${childColumn} IN (${updPlaceholders})`;
          await client.query(updQ, pkVals);
        } else {
          // Delete rows by primary key
          const delPlaceholders = childIds.map((_, i) => `$${i + 1}`).join(',');
          const delQ = `DELETE FROM ${childTable} WHERE ${childPk} IN (${delPlaceholders})`;
          await client.query(delQ, childIds);
        }
      }
    };

    for (const fr of fkRows) {
      const table = fr.table_name;
      const column = fr.column_name;

      // Fetch dependent rows for snapshot
      const { rows: depRows } = await client.query(`SELECT * FROM ${table} WHERE ${column} = $1`, [id]);
      if (depRows.length > 0) {
        dependents[table] = depRows;

        // Check if column is nullable; if so, set to NULL, otherwise delete rows (after cleaning their dependents)
        const { rows: colInfo } = await client.query(`SELECT is_nullable FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`, [table, column]);
        const isNullable = colInfo && colInfo[0] && colInfo[0].is_nullable === 'YES';

        if (isNullable) {
          await client.query(`UPDATE ${table} SET ${column} = NULL WHERE ${column} = $1`, [id]);
        } else {
          // Determine primary key of this table
          const pk = await getPrimaryKeyColumn(table);
          const idsToDelete = depRows.map(r => r[pk]).filter(Boolean);
          if (idsToDelete.length > 0) {
            // Clean any child tables that reference this table before deleting
            await recursiveCleanup(table, idsToDelete);
            const delPlaceholders = idsToDelete.map((_, i) => `$${i + 1}`).join(',');
            await client.query(`DELETE FROM ${table} WHERE ${pk} IN (${delPlaceholders})`, idsToDelete);
          }
        }
      }
    }

    // Attach dependents to archived snapshot
    const dataSnapshot = { user, dependents };

    const insertQ = `INSERT INTO archived_users (original_id, data, resignation_reason, resigned_at, archived_by) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const insertVals = [id, dataSnapshot, reason, resignedAt, archivedBy];
    const inserted = await client.query(insertQ, insertVals);

    // Now safe to delete user
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    await client.query('COMMIT');
    return inserted.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const getArchivedUsers = async () => {
  const q = `SELECT id, original_id, data, resignation_reason, resigned_at, archived_by, archived_at FROM archived_users ORDER BY archived_at DESC`;
  const { rows } = await pool.query(q);
  return rows;
};
