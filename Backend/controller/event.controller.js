import {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    registerAttendee,
    getEventAttendees,
    removeAttendee,
    getUserEvents,
} from "../models/event.model.js";

// Create a new event
export const createEventController = async (req, res) => {
    try {
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
        } = req.body;

        if (!title || !event_date || !start_time || !end_time) {
            return res.status(400).json({
                message: "Title, event date, start time, and end time are required",
            });
        }

        const event = await createEvent({
            title,
            description,
            event_date,
            start_time,
            end_time,
            location,
            event_type,
            status,
            max_attendees,
            created_by: req.userId,
        });

        res.status(201).json({
            message: "Event created successfully",
            event,
        });
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ message: "Failed to create event" });
    }
};

// Get all events
export const getAllEventsController = async (req, res) => {
    try {
        const events = await getAllEvents();
        res.json(events);
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ message: "Failed to fetch events" });
    }
};

// Get event by ID
export const getEventByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await getEventById(id);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.json(event);
    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ message: "Failed to fetch event" });
    }
};

// Update an event
export const updateEventController = async (req, res) => {
    try {
        const { id } = req.params;
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
        } = req.body;

        const updated = await updateEvent(id, {
            title,
            description,
            event_date,
            start_time,
            end_time,
            location,
            event_type,
            status,
            max_attendees,
        });

        if (!updated) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.json({
            success: true,
            message: "Event updated successfully",
            event: updated,
        });
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ message: "Failed to update event" });
    }
};

// Delete an event
export const deleteEventController = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Fetch event to check creator
        const event = await getEventById(id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // RBAC Check: Only Admin or Creator can delete
        if (userRole !== 'Admin' && event.created_by !== userId) {
            return res.status(403).json({ message: "You are not authorized to delete this event" });
        }

        const deleted = await deleteEvent(id);

        res.json({
            success: true,
            message: "Event deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: "Failed to delete event" });
    }
};

// Register user for an event
import { sendMail } from "../utils/email.js";
import { findUserById } from "../models/user.model.js";

export const registerAttendeeController = async (req, res) => {
    try {
        const { id } = req.params; // event_id
        const { rsvp_status } = req.body;
        const user_id = req.userId;

        const attendee = await registerAttendee(id, user_id, rsvp_status || "Confirmed");

        // Fetch event and user details for email
        const event = await getEventById(id);
        const user = await findUserById(user_id);

        // Send confirmation email (best-effort)
        if (user && user.email) {
            try {
                const subject = `Registration confirmed: ${event.title}`;
                const eventDate = event?.event_date ? new Date(event.event_date).toLocaleDateString() : '';
                const start = event?.start_time || '';
                const end = event?.end_time || '';
                const html = `<p>Hi ${user.fullname || ''},</p>
                    <p>You've successfully registered for <strong>${event.title}</strong>.</p>
                    <p><strong>Date:</strong> ${eventDate}</p>
                    <p><strong>Time:</strong> ${start} ${end ? ` - ${end}` : ''}</p>
                    <p><strong>Location:</strong> ${event.location || 'TBD'}</p>
                    <p>RSVP status: ${rsvp_status || 'Confirmed'}</p>
                    <p>Thank you,<br/>RedNote PayRoll System Team</p>`;

                await sendMail({ to: user.email, subject, html });
                console.log(`Event registration email sent to ${user.email}`);
            } catch (err) {
                console.error('Failed to send registration email:', err);
            }
        }

        res.status(201).json({
            message: "Successfully registered for event",
            attendee,
        });
    } catch (error) {
        console.error("Error registering attendee:", error);
        if (error.code === "23503") {
            return res.status(404).json({ message: "Event not found" });
        }
        res.status(500).json({ message: "Failed to register for event" });
    }
};

// Get attendees for an event
export const getEventAttendeesController = async (req, res) => {
    try {
        const { id } = req.params;
        const attendees = await getEventAttendees(id);

        res.json(attendees);
    } catch (error) {
        console.error("Error fetching attendees:", error);
        res.status(500).json({ message: "Failed to fetch attendees" });
    }
};

// Remove attendee from event
export const removeAttendeeController = async (req, res) => {
    try {
        const { id, userId } = req.params; // event_id and user_id
        const removed = await removeAttendee(id, userId);

        if (!removed) {
            return res.status(404).json({ message: "Attendee registration not found" });
        }

        res.json({
            success: true,
            message: "Attendee removed successfully",
        });
    } catch (error) {
        console.error("Error removing attendee:", error);
        res.status(500).json({ message: "Failed to remove attendee" });
    }
};

// Get events for current user
export const getUserEventsController = async (req, res) => {
    try {
        const user_id = req.userId;
        const events = await getUserEvents(user_id);

        res.json(events);
    } catch (error) {
        console.error("Error fetching user events:", error);
        res.status(500).json({ message: "Failed to fetch user events" });
    }
};
