"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import Toast from "@/components/Toast";

interface ProfilePictureModalProps {
  show: boolean;
  onClose: () => void;
  currentProfilePicture?: string;
}

export default function ProfilePictureModal({
  show,
  onClose,
  currentProfilePicture,
}: ProfilePictureModalProps) {
  const { updateProfilePicture } = useAuth();
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!show) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setError("Only PNG and JPG images are allowed");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("File size must be less than 2MB");
      return;
    }

    setError(null);
    setPictureFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!pictureFile) return;

    setIsLoading(true);
    try {
      await updateProfilePicture(pictureFile);
      setToastMessage("Profile picture updated successfully! ✓");
      setShowToast(true);
      setPictureFile(null);
      setPreviewUrl(null);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError("Failed to upload profile picture. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    setPictureFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
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

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#3D5A6C]">
            Update Profile Picture
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Choose a PNG or JPG image (max 2MB)
          </p>
        </div>

        {/* Image Preview Circle */}
        <div className="flex justify-center mb-6">
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-linear-to-br from-[#A4BBD0] to-[#8FA3B8] flex items-center justify-center">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                style={{ objectFit: "cover" }}
              />
            ) : currentProfilePicture ? (
              <Image
                src={currentProfilePicture}
                alt="Current"
                fill
                style={{ objectFit: "cover" }}
              />
            ) : (
              <svg
                className="w-16 h-16 text-white opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
            )}

            {/* Camera Icon Badge */}
            {previewUrl && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  ></path>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* File Upload Section */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleFileChange}
            id="profile-picture-input"
            className="hidden"
          />
          <label
            htmlFor="profile-picture-input"
            className="flex items-center justify-center w-full px-6 py-4 border-2 border-dashed border-[#3D5A6C] rounded-xl cursor-pointer hover:bg-blue-50 transition-colors group"
          >
            <div className="text-center">
              <svg
                className="w-8 h-8 mx-auto text-[#3D5A6C] group-hover:text-[#314A5A] transition-colors mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                ></path>
              </svg>
              <p className="text-sm font-semibold text-[#3D5A6C]">
                Click to upload
              </p>
              <p className="text-xs text-gray-500">or drag and drop</p>
            </div>
          </label>
        </div>

        {/* File Selected Info */}
        {pictureFile && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium">
              ✓ {pictureFile.name}
            </p>
            <p className="text-xs text-green-600">
              {(pictureFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {pictureFile ? (
            <>
              <button
                onClick={handleUpload}
                disabled={isLoading}
                className="w-full bg-linear-to-r from-[#3D5A6C] to-[#2E4A5A] text-white font-bold py-3 px-4 rounded-lg hover:from-[#314A5A] hover:to-[#263D4A] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      ></path>
                    </svg>
                    Upload Picture
                  </>
                )}
              </button>
              <button
                onClick={handleRemove}
                disabled={isLoading}
                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-[#3D5A6C] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#314A5A] transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <Toast
        message={toastMessage}
        show={showToast}
        type="success"
        duration={2000}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
