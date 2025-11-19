// lib/services/api.ts
import axios from "axios";
import { useAuthStore } from "@/lib/store";

// This file creates a configured Axios instance for making HTTP requests
// It automatically handles authentication and error handling globally

// Create axios instance with base configuration
// This sets up default settings for all API calls made through this instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api", // Base URL for all API endpoints
  timeout: 10000, // Request timeout after 10 seconds
});

// Request interceptor to add auth token
// This runs before every API request to modify the request config
api.interceptors.request.use(
  (config) => {
    // Get the current authentication token from the store
    const token = useAuthStore.getState().token;
    if (token) {
      // Add Bearer token to Authorization header for authenticated requests
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add admin ID for tracking and audit purposes
    // This helps the backend know which admin is making the request
    const admin = useAuthStore.getState().admin;
    if (admin?.id) {
      config.headers["X-Admin-ID"] = admin.id;
    }

    // Update activity timestamp on each API call
    // This helps track user activity for session management
    useAuthStore.getState().updateActivity();

    return config; // Return the modified request configuration
  },
  (error) => {
    // Handle request configuration errors
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
// This runs after every API response to handle errors globally
api.interceptors.response.use(
  (response) => response, // Simply return successful responses
  (error) => {
    // Check if the error is due to unauthorized access (401 status)
    if (error.response?.status === 401) {
      // Token expired or invalid - clear authentication state
      useAuthStore.getState().clearAuth();
      
      // Only redirect if we're in the browser (not during SSR)
      if (typeof window !== 'undefined') {
        // Redirect to signin page with session expired parameter
        window.location.href = "/signin?session_expired=true";
      }
    }
    // Reject the error so it can be handled by the calling code
    return Promise.reject(error);
  }
);

// Export the configured axios instance
// This should be used instead of plain axios for all API calls in the app
export default api;