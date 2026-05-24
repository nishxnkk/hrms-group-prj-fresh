import pool from "../db/db.js";

// Get all courses
export const getCourses = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM courses ORDER BY created_at DESC");
        res.status(200).json({ success: true, courses: result.rows });
    } catch (error) {
        console.error("❌ Get Courses Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Add a new course
export const addCourse = async (req, res) => {
    try {
        const { title, description, type, content_url } = req.body;

        if (!title || !type || !content_url) {
            return res.status(400).json({ message: "Title, type, and content URL are required" });
        }

        const result = await pool.query(
            "INSERT INTO courses (title, description, type, content_url) VALUES ($1, $2, $3, $4) RETURNING *",
            [title, description, type, content_url]
        );

        res.status(201).json({ success: true, course: result.rows[0] });
    } catch (error) {
        console.error("❌ Add Course Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Assign a course to an employee
export const assignCourse = async (req, res) => {
    try {
        const { course_id, employee_id, due_date } = req.body;

        if (!course_id || !employee_id) {
            return res.status(400).json({ message: "Course ID and Employee ID are required" });
        }

        const result = await pool.query(
            "INSERT INTO course_assignments (course_id, employee_id, due_date) VALUES ($1, $2, $3) RETURNING *",
            [course_id, employee_id, due_date || null]
        );

        res.status(201).json({ success: true, assignment: result.rows[0] });
    } catch (error) {
        console.error("❌ Assign Course Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Mark course as completed
export const completeCourse = async (req, res) => {
    try {
        const { assignment_id } = req.params;

        const result = await pool.query(
            "UPDATE course_assignments SET completed = TRUE, completed_at = NOW() WHERE id = $1 RETURNING *",
            [assignment_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        res.status(200).json({ success: true, assignment: result.rows[0] });
    } catch (error) {
        console.error("❌ Complete Course Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Add a skill to an employee
export const addSkill = async (req, res) => {
    try {
        const { employee_id, skill_name, proficiency_level } = req.body;
        if (!employee_id || !skill_name) {
            return res.status(400).json({ message: "Employee ID and skill name are required" });
        }
        const result = await pool.query(
            `INSERT INTO skill_matrix (employee_id, skill_name, proficiency_level)
             VALUES ($1, $2, $3) RETURNING *`,
            [employee_id, skill_name, proficiency_level || null]
        );
        res.status(201).json({ success: true, skill: result.rows[0] });
    } catch (error) {
        console.error("❌ Add Skill Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Get skills of an employee
export const getSkills = async (req, res) => {
    try {
        const { employee_id } = req.params;
        const result = await pool.query(
            `SELECT * FROM skill_matrix WHERE employee_id = $1`,
            [employee_id]
        );
        res.status(200).json({ success: true, skills: result.rows });
    } catch (error) {
        console.error("❌ Get Skills Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Add certification for an employee
export const addCertification = async (req, res) => {
    try {
        const { employee_id, course_id, certificate_url, expiry_date } = req.body;
        if (!employee_id || !course_id || !certificate_url) {
            return res.status(400).json({ message: "Employee ID, course ID, and certificate URL are required" });
        }
        const result = await pool.query(
            `INSERT INTO certifications (employee_id, course_id, certificate_url, expiry_date)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [employee_id, course_id, certificate_url, expiry_date || null]
        );
        res.status(201).json({ success: true, certification: result.rows[0] });
    } catch (error) {
        console.error("❌ Add Certification Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Get certifications of an employee
export const getCertifications = async (req, res) => {
    try {
        const { employee_id } = req.params;
        const result = await pool.query(
            `SELECT * FROM certifications WHERE employee_id = $1`,
            [employee_id]
        );
        res.status(200).json({ success: true, certifications: result.rows });
    } catch (error) {
        console.error("❌ Get Certifications Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
