import axios from "axios";
import { AuthTokens } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Request Interceptor: Adds the access token and session ID to every outgoing request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const storedTokens = localStorage.getItem("authTokens");
      const sessionId = localStorage.getItem("sessionId");
      
      if (storedTokens) {
        const tokens: AuthTokens = JSON.parse(storedTokens);
        if (tokens.access) {
          config.headers.Authorization = `Bearer ${tokens.access}`;
        }
      }
      
      // Add session ID header for multi-device tracking
      if (sessionId) {
        config.headers["X-Session-ID"] = sessionId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handles expired access tokens by refreshing them
api.interceptors.response.use(
  // If the response is successful, just return it
  (response) => response,
  // If the response is an error, handle it
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is a 401 and it's not a retry request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark it as a retry to prevent infinite loops

      if (typeof window !== "undefined") {
        const storedTokens = localStorage.getItem("authTokens");
        const sessionId = localStorage.getItem("sessionId");
        
        if (storedTokens) {
          const tokens: AuthTokens = JSON.parse(storedTokens);

          try {
            // Attempt to get a new access token using the refresh token
            const refreshConfig = {
              headers: {} as any,
            };
            
            // Include session ID in refresh request
            if (sessionId) {
              refreshConfig.headers["X-Session-ID"] = sessionId;
            }
            
            const response = await axios.post<AuthTokens & { session_id?: string }>(
              `${process.env.NEXT_PUBLIC_API_URL}/api/token/refresh/`,
              {
                refresh: tokens.refresh,
              },
              refreshConfig
            );

            // If successful, update the tokens in localStorage
            const newTokens = response.data;
            localStorage.setItem("authTokens", JSON.stringify(newTokens));
            
            // Update session ID if provided
            if (newTokens.session_id) {
              localStorage.setItem("sessionId", newTokens.session_id);
            }

            // Update the authorization header for the original request and retry it
            originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
            
            // Include session ID in retry
            if (sessionId) {
              originalRequest.headers["X-Session-ID"] = sessionId;
            }
            
            return api(originalRequest);
          } catch (refreshError) {
            // If the refresh token is also invalid, log the user out
            console.error(
              "Refresh token is invalid or session has been revoked, logging out.",
              refreshError
            );
            localStorage.removeItem("authTokens");
            localStorage.removeItem("sessionId");
            // Redirect to login page
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }
      }
    }

    // For any other errors, just reject the promise
    return Promise.reject(error);
  }
);

export default api;
