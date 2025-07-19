import axios from "axios";
import { AuthTokens } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// This is an interceptor. It runs before every request.
api.interceptors.request.use(
  (config) => {
    // Get the tokens from local storage
    const storedTokens = localStorage.getItem("authTokens");
    if (storedTokens) {
      const tokens: AuthTokens = JSON.parse(storedTokens);
      // Add the Authorization header to the request
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
