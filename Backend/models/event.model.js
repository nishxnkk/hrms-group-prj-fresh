import pool from "../db/db.js";

// Create events table
export const createEventTable = async () => {
    try {
        // Check for corrupted table state ( leftover from previous versions )
        const checkTable = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'events' AND column_name = 'start_date'
        `);

        if (checkTable.rows.length > 0) {
            console.log("⚠️ Corrupted events table detected (start_date column found). Recreating for clean state...");
            await pool.query(`DROP TABLE IF EXISTS event_attendees CASCADE`);
            await pool.query(`DROP TABLE IF EXISTS events CASCADE`);
        }

        await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        location VARCHAR(255),
        event_type VARCHAR(100) DEFAULT 'General',
        status VARCHAR(50) DEFAULT 'Upcoming',
        max_attendees INTEGER,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Migration: Add columns that might be missing from older versions
        await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS event_date DATE`);
        await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TIME`);
        await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time TIME`);
        await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type VARCHAR(100) DEFAULT 'General'`);
        await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Upcoming'`);
        await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS max_attendees INTEGER`);
        await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id)`);

        // Create event_attendees junction table for many-to-many relationship
        await pool.query(`
      CREATE TABLE IF NOT EXISTS event_attendees (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rsvp_status VARCHAR(50) DEFAULT 'Pending',
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, user_id)
      )
    `);

        console.log("✅ Events tables and migrations handled successfully");
    } catch (error) {
        console.error("❌ Error creating events tables:", error);
    }
};

// Create a new event
export const createEvent = async (event) => {
    const {
        title,
        description,
        event_date,
        start_time,
        end_time,
        location,
        event_type,
        status,
        max_attendees,
        created_by,
    } = event;

    const result = await pool.query(
        `INSERT INTO events (title, description, event_date, start_time, end_time, location, event_type, status, max_attendees, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
            title,
            description,
            event_date,
            start_time,
            end_time,
            location,
            event_type || "General",
            status || "Upcoming",
            max_attendees,
            created_by,
        ]
    );

    return result.rows[0];
};

// Get all events
export const getAllEvents = async () => {
    const result = await pool.query(`
    SELECT 
      e.*,
      u.fullname as creator_name,
      COUNT(DISTINCT ea.id) as attendee_count
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    LEFT JOIN event_attendees ea ON e.id = ea.event_id
    GROUP BY e.id, u.fullname
    ORDER BY e.event_date DESC, e.start_time DESC
  `);
    return result.rows;
};

// Get event by ID with full details
export const getEventById = async (id) => {
    const result = await pool.query(
        `SELECT 
      e.*,
      u.fullname as creator_name,
      u.email as creator_email,
      COUNT(DISTINCT ea.id) as attendee_count
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    LEFT JOIN event_attendees ea ON e.id = ea.event_id
    WHERE e.id = $1
    GROUP BY e.id, u.fullname, u.email`,
        [id]
    );
    return result.rows[0];
};

// Update an event
export const updateEvent = async (id, event) => {
    const {
        title,
        description,
        event_date,
        start_time,
        end_time,
        location,
        event_type,
        status,
        max_attendees,
    } = event;

    const result = await pool.query(
        `UPDATE events 
     SET title = $1, description = $2, event_date = $3, start_time = $4, 
         end_time = $5, location = $6, event_type = $7, status = $8, 
         max_attendees = $9, updated_at = CURRENT_TIMESTAMP
     WHERE id = $10
     RETURNING *`,
        [
            title,
            description,
            event_date,
            start_time,
            end_time,
            location,
            event_type,
            status,
            max_attendees,
            id,
        ]
    );

    return result.rows[0];
};

// Delete an event
export const deleteEvent = async (id) => {
    const result = await pool.query(
        `DELETE FROM events WHERE id = $1 RETURNING id`,
        [id]
    );
    return result.rows[0];
};

// Register user for an event
export const registerAttendee = async (event_id, user_id, rsvp_status = "Confirmed") => {
    try {
        const result = await pool.query(
            `INSERT INTO event_attendees (event_id, user_id, rsvp_status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) 
       DO UPDATE SET rsvp_status = $3, registered_at = CURRENT_TIMESTAMP
       RETURNING *`,
            [event_id, user_id, rsvp_status]
        );
        return result.rows[0];
    } catch (error) {
        throw error;
    }
};

// Get attendees for an event
export const getEventAttendees = async (event_id) => {
    const result = await pool.query(
        `SELECT 
      ea.*,
      u.fullname,
      u.email,
      u.designation,
      u.profile_picture
    FROM event_attendees ea
    JOIN users u ON ea.user_id = u.id
    WHERE ea.event_id = $1
    ORDER BY ea.registered_at DESC`,
        [event_id]
    );
    return result.rows;
};

// Remove attendee from event
export const removeAttendee = async (event_id, user_id) => {
    const result = await pool.query(
        `DELETE FROM event_attendees 
     WHERE event_id = $1 AND user_id = $2 
     RETURNING *`,
        [event_id, user_id]
    );
    return result.rows[0];
};

// Get events by user (events they created or attending)
export const getUserEvents = async (user_id) => {
    const result = await pool.query(
        `SELECT DISTINCT
      e.*,
      u.fullname as creator_name,
      COUNT(DISTINCT ea.id) as attendee_count,
      CASE 
        WHEN e.created_by = $1 THEN 'creator'
        WHEN ea2.user_id = $1 THEN 'attendee'
        ELSE 'none'
      END as user_role
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    LEFT JOIN event_attendees ea ON e.id = ea.event_id
    LEFT JOIN event_attendees ea2 ON e.id = ea2.event_id AND ea2.user_id = $1
    WHERE e.created_by = $1 OR ea2.user_id = $1
    GROUP BY e.id, u.fullname, ea2.user_id
    ORDER BY e.event_date DESC, e.start_time DESC`,
        [user_id]
    );
    return result.rows;
};
