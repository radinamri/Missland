import axios from "axios";
import { AuthTokens } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Request Interceptor: Adds the access token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const storedTokens = localStorage.getItem("authTokens");
    if (storedTokens) {
      const tokens: AuthTokens = JSON.parse(storedTokens);
      if (tokens.access) {
        config.headers.Authorization = `Bearer ${tokens.access}`;
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

      const storedTokens = localStorage.getItem("authTokens");
      if (storedTokens) {
        const tokens: AuthTokens = JSON.parse(storedTokens);

        try {
          // Attempt to get a new access token using the refresh token
          const response = await axios.post<AuthTokens>(
            `${process.env.NEXT_PUBLIC_API_URL}/api/token/refresh/`,
            {
              refresh: tokens.refresh,
            }
          );

          // If successful, update the tokens in localStorage
          const newTokens = response.data;
          localStorage.setItem("authTokens", JSON.stringify(newTokens));

          // Update the authorization header for the original request and retry it
          originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // If the refresh token is also invalid, log the user out
          console.error("Refresh token is invalid, logging out.", refreshError);
          localStorage.removeItem("authTokens");
          // Redirect to login page
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }
    }

    // For any other errors, just reject the promise
    return Promise.reject(error);
  }
);

export default api;
