import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export const LOGO_URL = "/assets/bitverse-logo.png";
export const DEV_PHOTO_URL = "/assets/adesh-yash.png";
