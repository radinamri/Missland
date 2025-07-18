"use client";

import { useState, useContext } from "react";
import AuthContext from "@/context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  const { registerUser, googleLogin } = auth;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerUser({ email, password, password2 });
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      googleLogin(tokenResponse.access_token);
    },
    onError: () => {
      console.log("Login Failed");
    },
  });

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <input
          type="password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          placeholder="Confirm Password"
          required
        />
        <button type="submit">Register with Email</button>
      </form>
      <hr />
      <button onClick={() => handleGoogleLogin()}>Continue with Google</button>
    </div>
  );
}
