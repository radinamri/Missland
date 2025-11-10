import axios from "axios";
import { AuthTokens } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Request Interceptor: Adds the access token to every outgoing request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const storedTokens = localStorage.getItem("authTokens");
      if (storedTokens) {
        const tokens: AuthTokens = JSON.parse(storedTokens);
        if (tokens.access) {
          config.headers.Authorization = `Bearer ${tokens.access}`;
        }
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
            console.error(
              "Refresh token is invalid, logging out.",
              refreshError
            );
            localStorage.removeItem("authTokens");
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

// ==================== NAIL SEARCH MICROSERVICE API ====================

/**
 * Classification result from the nail search microservice
 */
export interface NailClassification {
  pattern: string;
  shape: string;
  size: string;
  colors: string[];
}

/**
 * Response from the classify endpoint
 */
export interface ClassifyResponse {
  success: boolean;
  classification: NailClassification;
  timestamp: string;
  error?: string;
}

/**
 * Similar nail result from the microservice
 */
export interface SimilarNail {
  id: string;
  imageUrl: string;
  classification: NailClassification;
  similarity: number;
  matchedFields: string[];
}

/**
 * Response from the similar search endpoint
 */
export interface SimilarSearchResponse {
  success: boolean;
  searchType: "image" | "id";
  inputAnalysis?: NailClassification;
  reference?: any;
  similarNails: SimilarNail[];
  total: number;
  error?: string;
}

/**
 * Classify a nail image to extract attributes
 */
export async function classifyNailImage(
  file: File
): Promise<ClassifyResponse> {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await api.post<ClassifyResponse>(
      "/api/auth/nails/classify/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Nail classification failed:", error);
    return {
      success: false,
      classification: {
        pattern: "",
        shape: "",
        size: "",
        colors: [],
      },
      timestamp: new Date().toISOString(),
      error: error.response?.data?.error || "Classification service unavailable",
    };
  }
}

/**
 * Find similar nails by image or nail ID
 */
export async function findSimilarNails(
  imageOrId: File | string,
  options?: {
    limit?: number;
    threshold?: number;
    matchFields?: number;
    excludeIds?: string[];
  }
): Promise<SimilarSearchResponse> {
  const { limit = 10, threshold = 0.7, matchFields = 2, excludeIds = [] } = options || {};

  try {
    if (typeof imageOrId === "string") {
      // Search by nail ID
      const response = await api.post<SimilarSearchResponse>(
        "/api/auth/nails/search/similar/",
        {
          id: imageOrId,
          limit,
          threshold,
          matchFields,
          excludeIds,
        }
      );
      return response.data;
    } else {
      // Search by image
      const formData = new FormData();
      formData.append("image", imageOrId);
      formData.append("limit", limit.toString());
      formData.append("threshold", threshold.toString());
      formData.append("matchFields", matchFields.toString());
      if (excludeIds.length > 0) {
        formData.append("excludeIds", excludeIds.join(","));
      }

      const response = await api.post<SimilarSearchResponse>(
        "/api/auth/nails/search/similar/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    }
  } catch (error: any) {
    console.error("Similar search failed:", error);
    return {
      success: false,
      searchType: typeof imageOrId === "string" ? "id" : "image",
      similarNails: [],
      total: 0,
      error: error.response?.data?.error || "Search service unavailable",
    };
  }
}

/**
 * Classify a new image and search for similar results
 * (Combined endpoint for new images not in database)
 */
export async function classifyAndSearchImage(
  imageUrl: string,
  page: number = 1,
  pageSize: number = 48
): Promise<any> {
  try {
    const response = await api.post("/api/auth/nails/classify-and-search/", {
      imageUrl,
      page,
      page_size: pageSize,
    });
    return response.data;
  } catch (error: any) {
    console.error("Classify and search failed:", error);
    return {
      success: false,
      results: [],
      count: 0,
      error: error.response?.data?.error || "Service unavailable",
    };
  }
}
