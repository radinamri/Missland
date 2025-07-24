"use client";

import { useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

// --- Reusable Components for the design ---

const SettingsCard = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={`bg-white rounded-2xl shadow-md p-2 md:p-4 ${className}`}>
    {children}
  </div>
);

const SettingsListItem = ({
  icon,
  title,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
  >
    <div className="w-8 h-8 flex items-center justify-center mr-4 text-gray-500">
      {icon}
    </div>
    <span className="flex-grow font-semibold text-gray-700">{title}</span>
    <svg
      className="w-5 h-5 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 5l7 7-7 7"
      ></path>
    </svg>
  </button>
);

const FormInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full px-4 py-2 bg-gray-100 border-transparent rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
  />
);

// --- Main Profile Page Component ---

export default function ProfilePage() {
  const {
    user,
    tokens,
    isLoading,
    updateUsername,
    changePassword,
    initiateEmailChange,
    logoutUser,
  } = useAuth();
  const router = useRouter();

  // State for the edit forms
  const [newUsername, setNewUsername] = useState(user?.username || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setNewUsername(user.username);
    }
  }, [user]);

  // Protect the route
  useEffect(() => {
    if (!isLoading && !tokens) {
      router.push("/login");
    }
  }, [tokens, isLoading, router]);

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername && newUsername !== user?.username) {
      updateUsername(newUsername).then(() => setIsEditing(false));
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    changePassword({
      old_password: oldPassword,
      new_password1: newPassword1,
      new_password2: newPassword2,
    });
    setOldPassword("");
    setNewPassword1("");
    setNewPassword2("");
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail) {
      initiateEmailChange(newEmail);
      setNewEmail("");
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-lg text-gray-500 animate-pulse">
          Loading Your Profile...
        </p>
      </div>
    );
  }

  // This is the shared JSX for the edit forms, used by both mobile and desktop views.
  const editForms = (
    <>
      <form onSubmit={handleUsernameSubmit}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username
        </label>
        <div className="flex items-center space-x-2 text-gray-500">
          <FormInput
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <button
            type="submit"
            className="bg-pink-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-pink-600 transition"
          >
            Save
          </button>
        </div>
      </form>
      <hr />
      <form onSubmit={handleEmailSubmit}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Change Email
        </label>
        <div className="flex items-center space-x-2 text-gray-500">
          <FormInput
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="New email"
          />
          <button
            type="submit"
            className="bg-pink-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-pink-600 transition"
          >
            Request
          </button>
        </div>
      </form>
      <hr />
      <form onSubmit={handlePasswordSubmit} className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Change Password
        </label>
        <div className="text-gray-500 space-y-2">
          <FormInput
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Current Password"
          />
          <FormInput
            type="password"
            value={newPassword1}
            onChange={(e) => setNewPassword1(e.target.value)}
            placeholder="New Password"
          />
          <FormInput
            type="password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            placeholder="Confirm New Password"
          />
        </div>

        <button
          type="submit"
          className="bg-pink-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-pink-600 transition"
        >
          Update
        </button>
      </form>
    </>
  );

  return (
    <>
      <div className="bg-white md:bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* User Info Section */}
          <div className="flex flex-col items-center pt-8 pb-10">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full flex items-center justify-center text-purple-600 font-bold text-4xl mb-4">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user.username}
            </h1>
            <p className="text-gray-600 mb-4">{user.email}</p>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-gray-800 text-white font-semibold py-2 px-6 rounded-xl hover:bg-gray-900 transition"
            >
              {isEditing ? "Close Edit" : "Edit Profile"}
            </button>
          </div>

          {/* Edit Profile Forms (Inline for Mobile) */}
          {isEditing && (
            <div className="md:hidden bg-white rounded-2xl shadow-lg p-6 mb-6 space-y-6 animate-fade-in-down">
              {editForms}
            </div>
          )}

          {/* Main Settings Grid for Desktop, Stacked for Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                  My Collection
                </h3>
                <SettingsCard>
                  <SettingsListItem
                    title="My Saved Posts"
                    icon={
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        ></path>
                      </svg>
                    }
                  />
                  <SettingsListItem
                    title="My Try-Ons"
                    icon={
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        ></path>
                      </svg>
                    }
                  />
                </SettingsCard>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                  Preferences
                </h3>
                <SettingsCard>
                  <SettingsListItem
                    title="Notifications"
                    icon={
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        ></path>
                      </svg>
                    }
                  />
                  <SettingsListItem
                    title="Technical Support"
                    icon={
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                        ></path>
                      </svg>
                    }
                  />
                  <button
                    onClick={logoutUser}
                    className="w-full flex items-center text-left p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <div className="w-8 h-8 flex items-center justify-center mr-4">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        ></path>
                      </svg>
                    </div>
                    <span className="flex-grow font-semibold">Logout</span>
                  </button>
                </SettingsCard>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal (Desktop Only) */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 hidden md:flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6 w-full max-w-md animate-fade-in-down">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Edit Profile</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
            <div className="space-y-6">{editForms}</div>
          </div>
        </div>
      )}
    </>
  );
}
