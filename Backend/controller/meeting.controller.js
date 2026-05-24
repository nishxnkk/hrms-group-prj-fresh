
import { 
  createMeeting, 
  getMeetings, 
  updateMeeting, 
  deleteMeeting 
} from "../models/meeting.model.js";

export const createMeetingController = async (req, res) => {
  try {
    const { title, meeting_date, start_time, end_time } = req.body;

    if (!title || !meeting_date || !start_time || !end_time) {
      return res.status(400).json({ message: "All fields required" });
    }

    const meeting = await createMeeting({
      title,
      meeting_date,
      start_time,
      end_time,
      created_by: req.userId
    });

    res.status(201).json({
      message: "Meeting created successfully",
      meeting
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create meeting" });
  }
};

export const getMeetingsController = async (req, res) => {
  try {
    const meetings = await getMeetings();
    res.json(meetings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch meetings" });
  }
};

// ✅ NEW: Update Meeting Controller
export const updateMeetingController = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, meeting_date, start_time, end_time } = req.body;

    // Call the DB function to update
    const updated = await updateMeeting(id, {
      title,
      meeting_date,
      start_time,
      end_time
    });

    // If no row was returned, the ID didn't exist
    if (!updated) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json({ 
      success: true, 
      message: "Meeting updated successfully", 
      meeting: updated 
    });
  } catch (error) {
    console.error("Error updating meeting:", error);
    res.status(500).json({ message: "Failed to update meeting" });
  }
};
export const deleteMeetingController = async (req, res) => {
  try {
    const { id } = req.params;

    // Call the DB function to delete
    const deleted = await deleteMeeting(id);

    if (!deleted) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json({ 
      success: true, 
      message: "Meeting deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    res.status(500).json({ message: "Failed to delete meeting" });
  }
};