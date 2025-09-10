"use client";

import { useAuth } from "@/context/AuthContext";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import { useState, ReactNode } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import Image from "next/image";

// --- Reusable Components for the page design ---
const SettingsCard = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="bg-white rounded-2xl shadow-sm">
    <div className="p-6 border-b border-gray-100">
      <h2 className="text-xl font-bold text-[#3D5A6C]">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);
const EyeSlashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243"
    />
  </svg>
);

export default function AccountSettingsPage() {
  const {
    user,
    updateUsername,
    initiateEmailChange,
    changePassword,
    isLoading,
    updateProfilePicture,
  } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // State for forms
  const [newUsername, setNewUsername] = useState(user?.username || "");
  const [newEmail, setNewEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  if (isLoading || !user) {
    return <LoadingSpinner />;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPictureFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFileName(file.name);
    }
  };

  const handlePictureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pictureFile) {
      await updateProfilePicture(pictureFile);
      setPreviewUrl(null); // Clear preview after upload
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername.trim() && newUsername !== user.username) {
      await updateUsername(newUsername.trim());
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail.trim()) {
      await initiateEmailChange(newEmail.trim());
      setNewEmail(""); // Clear input after submission
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword1 !== newPassword2) {
      alert("New passwords do not match.");
      return;
    }
    await changePassword({
      old_password: oldPassword,
      new_password1: newPassword1,
      new_password2: newPassword2,
    });
    // Clear fields after submission
    setOldPassword("");
    setNewPassword1("");
    setNewPassword2("");
  };

  return (
    <div className="space-y-8">
      {/* --- ADDED THIS HEADER SECTION --- */}
      <header className="space-y-4">
        <Link
          href="/profile"
          className="inline-flex items-center text-[#D98B99] hover:text-[#C47C8A] font-semibold transition-colors lg:hidden"
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
        <h1 className="text-3xl md:text-4xl font-bold text-[#3D5A6C]">
          Account Settings
        </h1>
      </header>

      <SettingsCard title="Profile Picture">
        <form
          onSubmit={handlePictureSubmit}
          className="flex flex-col sm:flex-row sm:items-center sm:space-x-4"
        >
          <div className="w-20 h-20 bg-gray-200 rounded-full relative overflow-hidden flex-shrink-0 mb-4 sm:mb-0">
            {(previewUrl || user.profile_picture) && (
              <Image
                src={previewUrl || user.profile_picture!}
                alt="Profile preview"
                fill
                style={{ objectFit: "cover" }}
              />
            )}
            {/* Fallback for when there is no image at all */}
            {!(previewUrl || user.profile_picture) && (
              <div className="w-full h-full bg-[#A4BBD0] flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {user.email.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-grow">
            {/* Custom Styled File Input */}
            <div className="flex items-center">
              <label
                htmlFor="profile-picture-upload"
                className="cursor-pointer bg-[#E7E7E7] text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-[#dcdcdc] transition"
              >
                Choose File
              </label>
              <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
                id="profile-picture-upload"
                className="hidden"
              />
              <span className="ml-4 text-sm text-gray-500">
                {pictureFile ? pictureFile.name : "No file selected."}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">PNG or JPG, up to 2MB.</p>
          </div>
          {previewUrl && (
            <button
              type="submit"
              className="mt-4 sm:mt-0 bg-[#3D5A6C] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#314A5A] transition"
            >
              Upload
            </button>
          )}
        </form>
      </SettingsCard>

      {/* --- Edit Username Card --- */}
      <SettingsCard title="Username">
        <form onSubmit={handleUsernameSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Your public display name
            </label>
            <input
              id="username"
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-[#D98B99] focus:border-[#D98B99] placeholder:text-gray-400 text-gray-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#3D5A6C] text-white font-bold py-2 px-5 rounded-lg hover:bg-[#314A5A] transition"
            >
              Save Username
            </button>
          </div>
        </form>
      </SettingsCard>

      {/* --- Edit Email Card --- */}
      <SettingsCard title="Email Address">
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Your current email is{" "}
              <span className="font-semibold">{user.email}</span>
            </label>
            <input
              id="email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email address"
              className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-[#D98B99] focus:border-[#D98B99] placeholder:text-gray-400 text-gray-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#3D5A6C] text-white font-bold py-2 px-5 rounded-lg hover:bg-[#314A5A] transition"
            >
              Change Email
            </button>
          </div>
        </form>
      </SettingsCard>

      {/* --- Change Password Card (Conditional) --- */}
      {user.has_password && (
        <SettingsCard title="Change Password">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="old_password"
                className="block text-sm font-medium text-gray-700"
              >
                Current Password
              </label>
              <div className="relative mt-1">
                <input
                  id="old_password"
                  type={showOldPass ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                >
                  {showOldPass ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="new_password1"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <div className="relative mt-1">
                <input
                  id="new_password1"
                  type={showNewPass ? "text" : "password"}
                  value={newPassword1}
                  onChange={(e) => setNewPassword1(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                >
                  {showOldPass ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="new_password2"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <input
                id="new_password2"
                type="password"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-[#3D5A6C] text-white font-bold py-2 px-5 rounded-lg hover:bg-[#314A5A] transition"
              >
                Update Password
              </button>
            </div>
          </form>
        </SettingsCard>
      )}

      {/* --- Delete Account Card --- */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-gray-600 mb-4">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="bg-red-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-red-700 transition-colors"
        >
          Delete My Account
        </button>
      </div>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
