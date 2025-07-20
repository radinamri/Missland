"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const {
    user,
    logoutUser,
    tokens,
    updateUsername,
    changePassword,
    initiateEmailChange,
  } = useAuth();
  const router = useRouter();

  // State for the edit forms
  const [newUsername, setNewUsername] = useState(user?.username || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // Update the newUsername state if the user object changes
  useEffect(() => {
    if (user) {
      setNewUsername(user.username);
    }
  }, [user]);

  // Protect the route
  useEffect(() => {
    if (!tokens) {
      router.push("/login");
    }
  }, [tokens, router]);

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername) {
      updateUsername(newUsername);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    changePassword({
      old_password: oldPassword,
      new_password1: newPassword1,
      new_password2: newPassword2,
    });
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail) {
      initiateEmailChange(newEmail);
    }
  };

  if (!user) {
    return <p>Loading profile...</p>;
  }

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "20px" }}>
      <h1>Profile</h1>
      <p>
        <strong>Email:</strong> {user.email}
      </p>

      <hr style={{ margin: "20px 0" }} />

      {/* Username Update Form */}
      <h2>Edit Username</h2>
      <form onSubmit={handleUsernameSubmit}>
        <label>
          Username:
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            style={{ marginLeft: "10px", padding: "5px" }}
          />
        </label>
        <button type="submit" style={{ marginLeft: "10px" }}>
          Save Username
        </button>
      </form>

      <hr style={{ margin: "20px 0" }} />

      {/* Password Change Form */}
      <h2>Change Password</h2>
      <form
        onSubmit={handlePasswordSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        <input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="Current Password"
          style={{ padding: "5px" }}
        />
        <input
          type="password"
          value={newPassword1}
          onChange={(e) => setNewPassword1(e.target.value)}
          placeholder="New Password"
          style={{ padding: "5px" }}
        />
        <input
          type="password"
          value={newPassword2}
          onChange={(e) => setNewPassword2(e.target.value)}
          placeholder="Confirm New Password"
          style={{ padding: "5px" }}
        />
        <button type="submit" style={{ padding: "10px" }}>
          Change Password
        </button>
      </form>

      <hr style={{ margin: "20px 0" }} />

      {/* Email Change Form */}
      <h2>Change Email Address</h2>
      <form onSubmit={handleEmailSubmit}>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="New Email Address"
          style={{ padding: "5px", width: "250px" }}
        />
        <button type="submit" style={{ marginLeft: "10px" }}>
          Request Email Change
        </button>
      </form>

      <hr style={{ margin: "20px 0" }} />

      <button
        onClick={logoutUser}
        style={{
          background: "red",
          color: "white",
          border: "none",
          padding: "10px",
        }}
      >
        Logout
      </button>
    </div>
  );
}
