import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/appreciations`; 

// Get auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Create axios instance with auth header
const createAuthConfig = () => {
    const token = getAuthToken();
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

// Create new appreciation
export const createAppreciation = async (data) => {
    try {
        const response = await axios.post(API_URL, data, createAuthConfig());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get all appreciations
export const getAllAppreciations = async (source) => {
    try {
        const url = source ? `${API_URL}?source=${source}` : API_URL;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get single appreciation by ID
export const getAppreciationById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Delete appreciation
export const deleteAppreciation = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`, createAuthConfig());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Toggle like on appreciation
export const toggleLike = async (id) => {
    try {
        const response = await axios.post(`${API_URL}/${id}/like`, {}, createAuthConfig());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Add comment to appreciation
export const addComment = async (id, comment) => {
    try {
        const response = await axios.post(
            `${API_URL}/${id}/comments`,
            { comment },
            createAuthConfig()
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get comments for appreciation
export const getComments = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}/comments`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Delete comment
export const deleteComment = async (appreciationId, commentId) => {
    try {
        const response = await axios.delete(
            `${API_URL}/${appreciationId}/comments/${commentId}`,
            createAuthConfig()
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get all users (helper for UI)
export const getAllUsers = async () => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users`, createAuthConfig());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
