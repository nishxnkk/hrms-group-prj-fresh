const API_URL = `${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/events`; 

// Get auth token from localStorage
const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

// Get all events
export const getAllEvents = async () => {
    try {
        const response = await fetch(API_URL, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch events");
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching events:", error);
        throw error;
    }
};

// Get event by ID
export const getEventById = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch event");
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching event:", error);
        throw error;
    }
};

// Create new event
export const createEvent = async (eventData) => {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(eventData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to create event");
        }

        return data;
    } catch (error) {
        console.error("Error creating event:", error);
        throw error;
    }
};

// Update event
export const updateEvent = async (id, eventData) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(eventData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to update event");
        }

        return data;
    } catch (error) {
        console.error("Error updating event:", error);
        throw error;
    }
};

// Delete event
export const deleteEvent = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to delete event");
        }

        return data;
    } catch (error) {
        console.error("Error deleting event:", error);
        throw error;
    }
};

// Register for event
export const registerForEvent = async (eventId, rsvpStatus = "Confirmed") => {
    try {
        const response = await fetch(`${API_URL}/${eventId}/register`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ rsvp_status: rsvpStatus }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to register for event");
        }

        return data;
    } catch (error) {
        console.error("Error registering for event:", error);
        throw error;
    }
};

// Get event attendees
export const getEventAttendees = async (eventId) => {
    try {
        const response = await fetch(`${API_URL}/${eventId}/attendees`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch attendees");
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching attendees:", error);
        throw error;
    }
};

// Remove attendee from event
export const removeAttendee = async (eventId, userId) => {
    try {
        const response = await fetch(`${API_URL}/${eventId}/attendees/${userId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to remove attendee");
        }

        return data;
    } catch (error) {
        console.error("Error removing attendee:", error);
        throw error;
    }
};

// Get user's events (created or attending)
export const getUserEvents = async () => {
    try {
        const response = await fetch(`${API_URL}/my-events`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch user events");
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching user events:", error);
        throw error;
    }
};
