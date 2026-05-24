import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/tasks`; 

const getAuth = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return { headers };
};

export const createTask = async (task) => {
  try {
    const res = await axios.post(API_URL, task, getAuth());
    return res.data;
  } catch (err) {
    // rethrow with helpful message
    throw err.response?.data || err.message || err;
  }
};

export const getTasks = async (assignedTo) => {
  try {
    const params = {};
    if (assignedTo) params.assignedTo = assignedTo;
    const res = await axios.get(API_URL, { params, ...getAuth() });
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message || err;
  }
};

export const updateTask = async (id, updates) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, updates, getAuth());
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message || err;
  }
};

export const deleteTask = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`, getAuth());
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message || err;
  }
};