import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/employee-of-month`; 

// Get auth token from localStorage
const getAuthToken = () => {
    const token = localStorage.getItem('token');
    return token;
};

// Get current employee of the month with team
export const getCurrentEmployeeOfMonth = async () => {
    try {
        const token = getAuthToken();
        const response = await axios.get(`${API_URL}/current`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            return { success: false, message: 'No employee of the month found' };
        }
        throw error;
    }
};

// Create new employee of the month with team members
export const createEmployeeOfMonth = async (userId, description, month, teamMembers) => {
    try {
        const token = getAuthToken();
        const response = await axios.post(
            API_URL,
            {
                userId,
                description,
                month,
                teamMembers, // Array of { userId, role }
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Add team member to existing employee of the month
export const addTeamMember = async (employeeOfMonthId, userId, role) => {
    try {
        const token = getAuthToken();
        const response = await axios.post(
            `${API_URL}/${employeeOfMonthId}/team`,
            {
                userId,
                role,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Delete team member
export const deleteTeamMember = async (teamMemberId) => {
    try {
        const token = getAuthToken();
        const response = await axios.delete(`${API_URL}/team/${teamMemberId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Get all users for dropdown selection
export const getAllUsers = async () => {
    try {
        const token = getAuthToken();
        const response = await axios.get(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Delete employee of the month
export const deleteEmployeeOfMonth = async (id) => {
    try {
        const token = getAuthToken();
        const response = await axios.delete(`${API_URL}/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

