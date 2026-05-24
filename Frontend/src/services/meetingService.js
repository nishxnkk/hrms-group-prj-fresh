import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/meetings`; 

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export const getUpcomingMeetings = async () => {
  try {
    const res = await axios.get(API_URL, authHeader());

    return {
      success: true,
      data: res.data,
    };

  } catch (error) {
    console.error("Error fetching meetings:", error);
    return {
      success: false,
      data: [],
    };
  }
};
