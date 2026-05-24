import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/tasks`; 
const getAuthToken = () => localStorage.getItem('token');
const createAuthConfig = () => {
  const token = getAuthToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

export const createTask = async (payload) => {
  try {
    const response = await axios.post(API_URL, payload, createAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getTasks = async (assignedTo) => {
  try {
    const url = assignedTo ? `${API_URL}?assignedTo=${assignedTo}` : API_URL;
    const response = await axios.get(url, createAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateTask = async (id, updates) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, updates, createAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteTask = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, createAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
