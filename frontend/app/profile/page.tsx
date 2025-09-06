"use client";

import { useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import LoadingSpinner from "@/components/LoadingSpinner";

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

// Updated SettingsListItem to accept an 'href' prop to act as a Link
const SettingsListItem = ({
  icon,
  title,
  href,
}: {
  icon: ReactNode;
  title: string;
  href: string;
}) => (
  <Link
    href={href}
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
  </Link>
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

  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    return <LoadingSpinner />;
  }

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
        <div className="space-y-3 text-gray-500">
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
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center pt-8 pb-10">
          <div className="w-24 h-24 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full flex items-center justify-center text-purple-600 font-bold text-4xl mb-4">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{user.username}</h1>
          <p className="text-gray-600 mb-4">{user.email}</p>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-gray-800 text-white font-semibold py-2 px-6 rounded-xl hover:bg-gray-900 transition"
          >
            {isEditing ? "Close Edit" : "Edit Profile"}
          </button>
        </div>

        {isEditing && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 space-y-6 animate-fade-in-down">
            {editForms}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                My Collection
              </h3>
              <SettingsCard>
                <SettingsListItem
                  href="/profile/saved"
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
                  href="/profile/my-try-ons" // Example link
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
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                Preferences
              </h3>
              <SettingsCard>
                <SettingsListItem
                  href="/profile/notifications"
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
                  href="/support"
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
                  onClick={() => setShowDeleteModal(true)}
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  </div>
                  <span className="flex-grow font-semibold">
                    Delete Account
                  </span>
                </button>
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
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
