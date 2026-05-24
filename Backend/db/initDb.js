import pool from "../db/db.js";

// Initialize the database by creating necessary tables for the ATS system
export const initDb = async () => {
  try {
    // Create Jobs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100),
        location VARCHAR(100),
        experience VARCHAR(50),
        salary VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
     // Create Applications table 
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        job_id INT REFERENCES jobs(id) ON DELETE CASCADE,
        name VARCHAR(100),
        email VARCHAR(100),
        resume TEXT,
        status VARCHAR(20) DEFAULT 'APPLIED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
     // Create Interviews table 
    await pool.query(`
      CREATE TABLE IF NOT EXISTS interviews (
        id SERIAL PRIMARY KEY,
        application_id INT REFERENCES applications(id),
        interview_date DATE,
        interview_time TIME,
        interviewer VARCHAR(100),
        mode VARCHAR(20)
      );
    `);
     // Create Offer Letters table 
    await pool.query(`
      CREATE TABLE IF NOT EXISTS offer_letters (
        id SERIAL PRIMARY KEY,
        application_id INT REFERENCES applications(id),
        position VARCHAR(100),
        ctc VARCHAR(50),
        joining_date DATE,
        status VARCHAR(20) DEFAULT 'PENDING'
      );
    `);
    // Courses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        content_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    // Course Assignments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_assignments (
        id SERIAL PRIMARY KEY,
        course_id INT REFERENCES users(id),
        employee_id INT REFERENCES users(id),
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP,
        due_date DATE
      );
    `);
    // Skill Matrix table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS skill_matrix (
        id SERIAL PRIMARY KEY,
        employee_id INT REFERENCES users(id),
        skill_name VARCHAR(100) NOT NULL,
        proficiency_level VARCHAR(50),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
     // Certification Management table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS certifications (
        id SERIAL PRIMARY KEY,
        employee_id INT REFERENCES users(id),
        course_id INT REFERENCES courses(id),
        certificate_url TEXT,
        issue_date DATE DEFAULT CURRENT_DATE,
        expiry_date DATE,
        renewal_reminder_sent BOOLEAN DEFAULT FALSE
      );
    `);

    console.log("✅ ATS tables created / already exist");
    // Create points transactions table for admin allocations
    try {
      const { rows } = await pool.query(`SELECT to_regclass('public.points_transactions') as exists`);
      // we'll create via model if needed
    } catch (e) {}

  } catch (error) {
    console.error("❌ DB Init Error:", error.message);
  }
};

