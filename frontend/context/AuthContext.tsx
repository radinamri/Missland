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
  Collection,
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
  // toggleSavePost: (postId: number) => Promise<string | null>;
  deleteAccount: (verification: {
    password?: string;
    access_token?: string;
  }) => Promise<boolean>;
  trackPostClick: (postId: number) => Promise<void>;
  trackSearchQuery: (query: string) => Promise<void>;
  trackTryOn: (postId: number) => Promise<void>;
  collections: Collection[];
  fetchCollections: () => Promise<void>;
  createCollection: (name: string) => Promise<Collection | null>;
  managePostInCollection: (
    collectionId: number,
    postId: number
  ) => Promise<string | null>;
  updateCollection: (
    collectionId: number,
    name: string
  ) => Promise<Collection | null>;
  deleteCollection: (collectionId: number) => Promise<boolean>;
  saveTryOn: (postId: number) => Promise<string | null>;
  deleteTryOn: (tryOnId: number) => Promise<string | null>;
  updateProfilePicture: (file: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [interactionCount, setInteractionCount] = useState(0);

  const incrementInteraction = () => setInteractionCount((prev) => prev + 1);

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const [collections, setCollections] = useState<Collection[]>([]);

  const saveTryOn = async (postId: number): Promise<string | null> => {
    if (!user) return null;
    try {
      const response = await api.post(`/api/auth/posts/${postId}/save-try-on/`);
      incrementInteraction();
      return response.data.detail;
    } catch (error) {
      console.error("Failed to save try-on:", error);
      return null;
    }
  };

  const deleteTryOn = async (tryOnId: number): Promise<string | null> => {
    if (!user) return null;
    try {
      await api.delete(`/api/auth/profile/my-try-ons/${tryOnId}/`);
      return "Removed from My Try-Ons.";
    } catch (error) {
      console.error("Failed to delete try-on:", error);
      return null;
    }
  };

  // Function to fetch user's collections
  const fetchCollections = useCallback(async () => {
    try {
      const response = await api.get<Collection[]>("/api/auth/collections/");
      setCollections(response.data);
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    }
  }, []);

  // Function to create a new collection
  const createCollection = async (name: string): Promise<Collection | null> => {
    if (!user) return null;
    try {
      const response = await api.post<Collection>("/api/auth/collections/", {
        name,
      });
      fetchCollections(); // Refresh the list after creating
      return response.data;
    } catch (error) {
      console.error("Failed to create collection:", error);
      return null;
    }
  };

  const updateCollection = async (
    collectionId: number,
    name: string
  ): Promise<Collection | null> => {
    try {
      const response = await api.patch<Collection>(
        `/api/auth/collections/${collectionId}/`,
        { name }
      );
      await fetchCollections(); // Refresh the list after updating
      return response.data;
    } catch (error) {
      console.error("Failed to update collection", error);
      // You can add more specific error handling here
      return null;
    }
  };

  const deleteCollection = async (collectionId: number): Promise<boolean> => {
    try {
      await api.delete(`/api/auth/collections/${collectionId}/`);
      await fetchCollections(); // Refresh the list after deleting
      return true;
    } catch (error) {
      console.error("Failed to delete collection", error);
      return false;
    }
  };

  // Function to add/remove a post from a collection
  const managePostInCollection = async (
    collectionId: number,
    postId: number
  ): Promise<string | null> => {
    if (!user) return null;
    try {
      const response = await api.post(
        `/api/auth/collections/${collectionId}/posts/${postId}/`
      );
      incrementInteraction(); // This is still a valuable signal
      return response.data.detail;
    } catch (error) {
      console.error("Failed to manage post in collection:", error);
      return null;
    }
  };

  const showToastWithMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const trackPostClick = async (postId: number) => {
    if (!user) return;
    try {
      await api.post("/api/auth/track/click/", { post_id: postId });
      incrementInteraction();
    } catch (error) {
      console.error("Failed to track post click:", error);
    }
  };

  const trackSearchQuery = async (query: string) => {
    if (!user || !query.trim()) return;
    try {
      await api.post("/api/auth/track/search/", { query });
      incrementInteraction();
    } catch (error) {
      console.error("Failed to track search query:", error);
    }
  };

  const trackTryOn = async (postId: number) => {
    if (!user) return;
    try {
      await api.post("/api/auth/track/try-on/", { post_id: postId });
      incrementInteraction();
    } catch (error) {
      console.error("Failed to track post try-on:", error);
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
    const initializeAuth = async () => {
      const storedTokens = localStorage.getItem("authTokens");
      if (storedTokens) {
        setTokens(JSON.parse(storedTokens));
        await fetchUserProfile();
      }
      setLoading(false);
    };
    initializeAuth();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (user) {
      fetchCollections();
    }
  }, [user, fetchCollections]);

  const updateUsername = async (newUsername: string) => {
    try {
      await api.patch("/api/auth/profile/", { username: newUsername });
      await fetchUserProfile();
      showToastWithMessage("Username updated successfully!");
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

  const updateProfilePicture = async (file: File) => {
    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      // Use PATCH to update, and set the correct Content-Type for files
      await api.patch("/api/auth/profile/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // Refresh the user profile to get the new image URL
      await fetchUserProfile();
      showToastWithMessage("Profile picture updated!");
    } catch (error) {
      console.error("Failed to update profile picture", error);
      showToastWithMessage("Failed to update picture.");
    }
  };

  const registerUser = async (credentials: RegisterCredentials) => {
    try {
      const response = await api.post("/api/auth/register/", credentials);
      if (response.status === 201) {
        await loginUser({
          email: credentials.email,
          password: credentials.password,
        });
      }
    } catch (error) {
      console.error("Registration failed", error);
      if (isAxiosError(error)) {
        alert("Registration failed: " + JSON.stringify(error.response?.data));
      }
    }
  };

  const loginUser = async (credentials: LoginCredentials) => {
    try {
      const response = await api.post<AuthTokens>("/api/token/", credentials);
      if (response.status === 200) {
        setTokens(response.data);
        localStorage.setItem("authTokens", JSON.stringify(response.data));
        await fetchUserProfile();
        router.push("/");
      }
    } catch (error) {
      console.error("Login failed", error);
      if (isAxiosError(error)) {
        alert("Login failed: " + JSON.stringify(error.response?.data));
      }
    }
  };

  const googleLogin = async (accessToken: string) => {
    try {
      const response = await api.post<AuthTokens>("/api/auth/google/", {
        access_token: accessToken,
      });
      if (response.status === 200) {
        setTokens(response.data);
        localStorage.setItem("authTokens", JSON.stringify(response.data));
        await fetchUserProfile();
        router.push("/");
      }
    } catch (error) {
      console.error("Google login failed", error);
      if (isAxiosError(error)) {
        alert("Google login failed: " + JSON.stringify(error.response?.data));
      }
    }
  };

  const initiateEmailChange = async (newEmail: string) => {
    try {
      await api.post("/api/auth/email/change/initiate/", {
        new_email: newEmail,
      });
      alert("Verification link sent! Please check your new email address.");
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

  // const toggleSavePost = async (postId: number): Promise<string | null> => {
  //   try {
  //     const response = await api.post(`/api/auth/posts/${postId}/toggle-save/`);
  //     incrementInteraction();
  //     return response.data.detail;
  //   } catch (error) {
  //     console.error("Failed to save post", error);
  //     if (isAxiosError(error)) {
  //       alert("Error saving post: " + JSON.stringify(error.response?.data));
  //     }
  //     return null;
  //   }
  // };

  const deleteAccount = async (verification: {
    password?: string;
    access_token?: string;
  }): Promise<boolean> => {
    try {
      await api.delete("/api/auth/profile/delete/", { data: verification });
      alert("Your account has been successfully deleted.");
      setTokens(null);
      setUser(null);
      localStorage.clear();
      router.push("/");
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
    // toggleSavePost,
    deleteAccount,
    trackPostClick,
    trackSearchQuery,
    trackTryOn,
    collections,
    fetchCollections,
    createCollection,
    managePostInCollection,
    updateCollection,
    deleteCollection,
    saveTryOn,
    deleteTryOn,
    updateProfilePicture,
  };

  return (
    <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
