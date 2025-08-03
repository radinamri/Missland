"use client";

import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
  useCallback,
} from "react";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import {
  RegisterCredentials,
  LoginCredentials,
  AuthTokens,
  User,
  PasswordChangeCredentials,
} from "@/types";
import api from "@/utils/api";

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  interactionCount: number;
  toastMessage: string;
  showToast: boolean;
  showToastWithMessage: (message: string) => void;
  loginUser: (credentials: LoginCredentials) => Promise<void>;
  logoutUser: () => void;
  registerUser: (credentials: RegisterCredentials) => Promise<void>;
  googleLogin: (accessToken: string) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
  changePassword: (credentials: PasswordChangeCredentials) => Promise<void>;
  initiateEmailChange: (newEmail: string) => Promise<void>;
  toggleSavePost: (postId: number) => Promise<string | null>;
  deleteAccount: (verification: {
    password?: string;
    access_token?: string;
  }) => Promise<boolean>;
  trackPostClick: (postId: number) => void;
  trackSearchQuery: (query: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [interactionCount, setInteractionCount] = useState(0);

  const incrementInteraction = () => setInteractionCount((prev) => prev + 1);

  // State and function for global toast notifications
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const showToastWithMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const trackPostClick = async (postId: number) => {
    // This is a "fire and forget" request. We don't need to wait for a response.
    // It silently tells the backend that the user showed interest in a post.
    try {
      await api
        .post("/api/auth/track/click/", { post_id: postId })
        .then(() => incrementInteraction());
    } catch (error) {
      // We don't alert the user for tracking errors, just log them.
      console.error("Failed to track post click:", error);
    }
  };

  const trackSearchQuery = async (query: string) => {
    // Silently tells the backend what the user searched for.
    try {
      await api
        .post("/api/auth/track/search/", { query })
        .then(() => incrementInteraction());
    } catch (error) {
      console.error("Failed to track search query:", error);
    }
  };

  const logoutUser = useCallback(() => {
    setTokens(null);
    setUser(null);
    localStorage.removeItem("authTokens");
    router.push("/login");
  }, [router]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get<User>("/api/auth/profile/");
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
      logoutUser();
    }
  }, [logoutUser]);

  useEffect(() => {
    const storedTokens = localStorage.getItem("authTokens");
    if (storedTokens) {
      setTokens(JSON.parse(storedTokens));
      fetchUserProfile();
    }
    setLoading(false);
  }, [fetchUserProfile]);

  const updateUsername = async (newUsername: string) => {
    try {
      await api.patch("/api/auth/profile/", { username: newUsername });
      // After updating, refetch the user profile to get the latest data
      await fetchUserProfile();
      alert("Username updated successfully!");
    } catch (error) {
      console.error("Failed to update username", error);
      if (isAxiosError(error)) {
        alert(
          "Failed to update username: " + JSON.stringify(error.response?.data)
        );
      }
    }
  };

  const changePassword = async (credentials: PasswordChangeCredentials) => {
    try {
      await api.post("/api/auth/password/change/", credentials);
      alert("Password changed successfully! Please log in again.");
      // After a successful password change, log the user out for security
      logoutUser();
    } catch (error) {
      console.error("Failed to change password", error);
      if (isAxiosError(error)) {
        alert(
          "Failed to change password: " + JSON.stringify(error.response?.data)
        );
      }
    }
  };

  const registerUser = async ({
    email,
    password,
    password2,
  }: RegisterCredentials) => {
    try {
      const response = await api.post("/api/auth/register/", {
        email,
        password,
        password2,
      });
      if (response.status === 201) {
        await loginUser({ email, password });
      }
    } catch (error) {
      console.error("Registration failed", error);
      if (isAxiosError(error)) {
        alert("Registration failed: " + JSON.stringify(error.response?.data));
      } else {
        alert("An unexpected error occurred during registration.");
      }
    }
  };

  const loginUser = async ({ email, password }: LoginCredentials) => {
    try {
      const response = await api.post<AuthTokens>("/api/token/", {
        email,
        password,
      });
      if (response.status === 200) {
        const data = response.data;
        setTokens(data);
        localStorage.setItem("authTokens", JSON.stringify(data));
        await fetchUserProfile();
        router.push("/profile");
      }
    } catch (error) {
      console.error("Login failed", error);
      if (isAxiosError(error)) {
        alert("Login failed: " + JSON.stringify(error.response?.data));
      } else {
        alert("An unexpected error occurred during login.");
      }
    }
  };

  const googleLogin = async (accessToken: string) => {
    try {
      const response = await api.post<AuthTokens>("/api/auth/google/", {
        access_token: accessToken,
      });
      if (response.status === 200) {
        const data = response.data;
        setTokens(data);
        localStorage.setItem("authTokens", JSON.stringify(data));
        await fetchUserProfile();
        router.push("/profile");
      }
    } catch (error) {
      console.error("Google login failed", error);
      if (isAxiosError(error)) {
        alert("Google login failed: " + JSON.stringify(error.response?.data));
      } else {
        alert("An unexpected error occurred during Google login.");
      }
    }
  };

  const initiateEmailChange = async (newEmail: string) => {
    try {
      await api.post("/api/auth/email/change/initiate/", {
        new_email: newEmail,
      });
      alert(
        "Verification link sent! Please check your new email address to confirm the change."
      );
    } catch (error) {
      console.error("Failed to initiate email change", error);
      if (isAxiosError(error)) {
        alert(
          "Failed to initiate email change: " +
            JSON.stringify(error.response?.data)
        );
      }
    }
  };

  const toggleSavePost = async (postId: number): Promise<string | null> => {
    try {
      const response = await api.post(`/api/auth/posts/${postId}/toggle-save/`);
      incrementInteraction(); // Call this after the await is successful
      return response.data.detail;
    } catch (error) {
      console.error("Failed to save post", error);
      if (isAxiosError(error)) {
        alert("Error saving post: " + JSON.stringify(error.response?.data));
      }
      return null;
    }
  };

  const deleteAccount = async (verification: {
    password?: string;
    access_token?: string;
  }): Promise<boolean> => {
    try {
      await api.delete("/api/auth/profile/delete/", { data: verification });
      alert("Your account has been successfully deleted.");
      // Log the user out completely
      setTokens(null);
      setUser(null);
      localStorage.clear();
      router.push("/"); // Redirect to homepage
      return true;
    } catch (error) {
      console.error("Failed to delete account", error);
      if (isAxiosError(error)) {
        alert(
          "Failed to delete account: " + JSON.stringify(error.response?.data)
        );
      }
      return false;
    }
  };

  const contextData: AuthContextType = {
    user,
    tokens,
    isLoading: loading,
    interactionCount,
    toastMessage,
    showToast,
    showToastWithMessage,
    loginUser,
    logoutUser,
    registerUser,
    googleLogin,
    updateUsername,
    changePassword,
    initiateEmailChange,
    toggleSavePost,
    deleteAccount,
    trackPostClick,
    trackSearchQuery,
  };

  return (
    <AuthContext.Provider value={contextData}>
      {loading ? <p>Loading...</p> : children}
    </AuthContext.Provider>
  );
};

// Custom hook for easier context usage
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
