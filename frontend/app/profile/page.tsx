"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, logoutUser, tokens } = useAuth();
  const router = useRouter();

  // This effect will run when the component mounts or when 'tokens' change.
  // It protects the route from unauthenticated users.
  useEffect(() => {
    if (!tokens) {
      router.push("/login");
    }
  }, [tokens, router]);

  // If the user data is not yet loaded, show a loading message
  if (!user) {
    return <p>Loading profile...</p>;
  }

  return (
    <div>
      <h1>Profile</h1>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Username:</strong> {user.username}
      </p>

      <hr />

      <button onClick={logoutUser}>Logout</button>
    </div>
  );
}
