import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export const LOGO_URL =
  "https://customer-assets.emergentagent.com/job_29bc2eb5-a3bf-4ad7-9d39-ad0fc28875d0/artifacts/ugttqzrt_bitverse-logo.png";

export const DEV_PHOTO_URL =
  "https://customer-assets.emergentagent.com/job_first-year-vault/artifacts/xuzppj3h_image.png";
