import axios from 'axios';

// 1. Dynamically manage the API production link or switch to local server
const API_BASE_URL = 
  process.env.REACT_APP_API_URL || 
  process.env.NEXT_PUBLIC_API_URL || 
  'https://bitverse-backend.onrender.com';

// 2. Export the static local path for your logo
export const LOGO_URL = '/assets/bitverse-logo.png';

// 3. Export the profile image path to resolve the compilation failure
export const DEV_PHOTO_URL = '/assets/adesh-yash.png';

// 4. Configure the Axios connection instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default api;
