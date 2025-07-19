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
} from "@/types";
import api from "@/utils/api";

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  loginUser: (credentials: LoginCredentials) => Promise<void>;
  logoutUser: () => void;
  registerUser: (credentials: RegisterCredentials) => Promise<void>;
  googleLogin: (accessToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const contextData: AuthContextType = {
    user,
    tokens,
    loginUser,
    logoutUser,
    registerUser,
    googleLogin,
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
