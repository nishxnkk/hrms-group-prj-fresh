import pool from "../db/db.js"; // database connection

// Create employee_of_month table
export const createEmployeeOfMonthTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS employee_of_month (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      month VARCHAR(50) NOT NULL,
      is_current BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log("✅ Employee of the month table created successfully");
  } catch (error) {
    console.error("❌ Error creating employee of the month table:", error);
  }
};

// Create employee_of_month_team table
export const createEmployeeOfMonthTeamTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS employee_of_month_team (
      id SERIAL PRIMARY KEY,
      employee_of_month_id INTEGER NOT NULL REFERENCES employee_of_month(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log("✅ Employee of the month team table created successfully");
  } catch (error) {
    console.error("❌ Error creating employee of the month team table:", error);
  }
};

// Create new employee of the month (sets all others to is_current = false)
export const createEmployeeOfMonth = async (userId, description, month) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Set all existing entries to is_current = false
    await client.query("UPDATE employee_of_month SET is_current = false");

    // Insert new employee of the month
    const query = `
      INSERT INTO employee_of_month (user_id, description, month, is_current)
      VALUES ($1, $2, $3, true)
      RETURNING *;
    `;
    const values = [userId, description, month];
    const { rows } = await client.query(query, values);

    await client.query("COMMIT");
    return rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Get current employee of the month with user details
export const getCurrentEmployeeOfMonth = async () => {
  const query = `
    SELECT 
      eom.*,
      u.id as user_id,
      u.fullname as user_name,
      u.email as user_email
    FROM employee_of_month eom
    JOIN users u ON eom.user_id = u.id
    WHERE eom.is_current = true
    LIMIT 1;
  `;
  const { rows } = await pool.query(query);
  return rows[0];
};

// Add team member to employee of the month
export const addTeamMember = async (employeeOfMonthId, userId, role) => {
  const query = `
    INSERT INTO employee_of_month_team (employee_of_month_id, user_id, role)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [employeeOfMonthId, userId, role];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// Get all team members for an employee of the month with user details
export const getTeamMembers = async (employeeOfMonthId) => {
  const query = `
    SELECT 
      eomt.*,
      u.id as user_id,
      u.fullname as user_name,
      u.email as user_email
    FROM employee_of_month_team eomt
    JOIN users u ON eomt.user_id = u.id
    WHERE eomt.employee_of_month_id = $1
    ORDER BY eomt.created_at ASC;
  `;
  const { rows } = await pool.query(query, [employeeOfMonthId]);
  return rows;
};

// Delete team member
export const deleteTeamMember = async (teamMemberId) => {
  const query = "DELETE FROM employee_of_month_team WHERE id = $1 RETURNING *;";
  const { rows } = await pool.query(query, [teamMemberId]);
  return rows[0];
};

// Delete employee of the month
export const deleteEmployeeOfMonth = async (id) => {
  const query = "DELETE FROM employee_of_month WHERE id = $1 RETURNING *;";
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};
