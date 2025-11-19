import axios, { AxiosError } from "axios";
import { AuthTokens } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor
 * Adds authentication headers to every outgoing request:
 * - Authorization: Bearer {access_token}
 * - X-Session-ID: {sessionId} (for multi-device tracking)
 */
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      // Get tokens from localStorage
      const storedTokens = localStorage.getItem("authTokens");
      const sessionId = localStorage.getItem("sessionId");

      // Add Authorization header with access token
      if (storedTokens) {
        try {
          const tokens: AuthTokens = JSON.parse(storedTokens);
          if (tokens.access && typeof tokens.access === "string") {
            config.headers.Authorization = `Bearer ${tokens.access}`;
          }
        } catch (error) {
          console.error("Failed to parse stored tokens:", error);
          localStorage.removeItem("authTokens");
        }
      }

      // Add Session ID header for multi-device tracking
      if (sessionId && typeof sessionId === "string") {
        config.headers["X-Session-ID"] = sessionId;
      }
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles token refresh on 401 responses with automatic retry
 */
api.interceptors.response.use(
  // Success: Just return the response
  (response) => response,
  // Error: Handle 401 by attempting token refresh
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Only attempt refresh if it's a 401 and not already a retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (typeof window !== "undefined") {
        const storedTokens = localStorage.getItem("authTokens");
        const sessionId = localStorage.getItem("sessionId");

        // Try to refresh the access token
        if (storedTokens) {
          try {
            const tokens: AuthTokens = JSON.parse(storedTokens);

            // Prepare refresh request with proper headers
            const refreshConfig = {
              headers: {
                "Content-Type": "application/json",
              } as any,
            };

            // Include session ID in refresh request
            if (sessionId && typeof sessionId === "string") {
              refreshConfig.headers["X-Session-ID"] = sessionId;
            }

            // Request new access token
            const refreshResponse = await axios.post<
              AuthTokens & { session_id?: string }
            >(
              `${process.env.NEXT_PUBLIC_API_URL}/api/token/refresh/`,
              {
                refresh: tokens.refresh,
              },
              refreshConfig
            );

            // Token refresh successful
            if (refreshResponse.status === 200) {
              const newTokens = refreshResponse.data;
              localStorage.setItem("authTokens", JSON.stringify(newTokens));

              // Update session ID if provided
              if (newTokens.session_id) {
                localStorage.setItem("sessionId", newTokens.session_id);
              }

              // Update authorization header for retry
              if (newTokens.access && typeof newTokens.access === "string") {
                originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
              }

              // Retry the original request with new token
              return api(originalRequest);
            }
          } catch (refreshError) {
            // Token refresh failed - user session is invalid
            console.error(
              "Token refresh failed, logging out user:",
              refreshError
            );
            localStorage.removeItem("authTokens");
            localStorage.removeItem("sessionId");

            // Redirect to login
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            return Promise.reject(refreshError);
          }
        } else {
          // No tokens stored - redirect to login
          localStorage.removeItem("authTokens");
          localStorage.removeItem("sessionId");
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      }
    }

    // For all other errors, just reject
    return Promise.reject(error);
  }
);

export default api;
