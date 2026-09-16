import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // Important for sending/receiving cookies
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Response interceptor for basic error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response || error.message || error);

    // Return a rejected promise to propagate the error
    return Promise.reject(error);
  },
);

export default api;
