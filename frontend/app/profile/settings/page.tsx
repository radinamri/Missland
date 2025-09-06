"use client";

import { useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import LoadingSpinner from "@/components/LoadingSpinner";

// 1. --- Reusable Input Component for consistent styling ---
const FormInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full px-4 py-2 bg-gray-100 border-transparent rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
  />
);

// 2. --- Reusable Settings Row Component for clean layout ---
const SettingsRow = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 border-b last:border-b-0">
    {children}
  </div>
);

export default function AccountSettingsPage() {
  const {
    user,
    tokens,
    isLoading,
    updateUsername,
    changePassword,
    initiateEmailChange,
  } = useAuth();
  const router = useRouter();

  // 3. --- This state is now initialized safely to prevent server/client mismatch ---
  const [newUsername, setNewUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // This useEffect now safely updates the state after the component has mounted
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
    return <LoadingSpinner />;
  }

  return (
    <>
      <div className="bg-gray-50 md:rounded-2xl md:shadow-lg p-4 md:p-8">
        <header className="mb-8">
          <div className="flex justify-start mb-4">
            <Link
              href="/profile"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
              Back to Profile
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Account Settings
          </h1>
        </header>

        <div className="space-y-8">
          {/* Edit Profile Section */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Edit Profile
            </h3>
            <div className="space-y-4">
              <SettingsRow>
                <div className="mb-2 md:mb-0">
                  <h4 className="font-semibold text-gray-700">Username</h4>
                  <p className="text-sm text-gray-500">
                    This is your public display name.
                  </p>
                </div>
                <form
                  onSubmit={handleUsernameSubmit}
                  className="flex items-center space-x-2 w-full md:w-auto"
                >
                  <FormInput
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-gray-800 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-900 transition"
                  >
                    Save
                  </button>
                </form>
              </SettingsRow>
            </div>
          </div>

          {/* Security Section */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Security</h3>
            <div className="space-y-4">
              <SettingsRow>
                <div className="mb-2 md:mb-0">
                  <h4 className="font-semibold text-gray-700">Email Address</h4>
                  <p className="text-sm text-gray-500">Current: {user.email}</p>
                </div>
                <form
                  onSubmit={handleEmailSubmit}
                  className="flex items-center space-x-2 w-full md:w-auto"
                >
                  <FormInput
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="New email"
                  />
                  <button
                    type="submit"
                    className="bg-gray-800 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-900 transition whitespace-nowrap"
                  >
                    Request
                  </button>
                </form>
              </SettingsRow>
              <SettingsRow>
                <div className="mb-4 md:mb-0 w-full">
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Change Password
                  </h4>
                  <form onSubmit={handlePasswordSubmit} className="space-y-3">
                    <FormInput
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Current Password"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      className="bg-gray-800 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-900 transition"
                    >
                      Update Password
                    </button>
                  </form>
                </div>
              </SettingsRow>
              {/* 4. --- Delete Account button is now here --- */}
              <SettingsRow>
                <div className="mb-2 md:mb-0">
                  <h4 className="font-semibold text-red-600">Delete Account</h4>
                  <p className="text-sm text-gray-500">
                    Permanently remove your account and all data.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-50 text-red-600 font-semibold py-2 px-4 rounded-md hover:bg-red-100 transition whitespace-nowrap"
                >
                  Delete
                </button>
              </SettingsRow>
            </div>
          </div>
        </div>
      </div>
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </>
  );
}
