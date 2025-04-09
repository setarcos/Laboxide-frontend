import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Important for sending/receiving cookies
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
})

// Optional: Add request interceptors (e.g., for adding auth tokens if not using cookies)

// Response interceptor for basic error logging
api.interceptors.response.use(
  (response) => response, // Simply return successful responses
  (error) => {
    console.error('API Error:', error.response || error.message || error)

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);

      // Specific handling for 401 Unauthorized (optional, Pinia store handles /greet)
      // if (error.response.status === 401) {
      //    // Maybe trigger logout action from auth store
      // }

    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }

    // Return a rejected promise to propagate the error
    return Promise.reject(error);
  }
);

export default api
