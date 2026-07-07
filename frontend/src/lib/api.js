import axios from 'axios';

// Dynamically use the production Render URL or fallback to localhost during local testing
const API_BASE_URL = 
  process.env.REACT_APP_API_URL || 
  process.env.NEXT_PUBLIC_API_URL || 
  'https://bitverse-backend.onrender.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default api;
