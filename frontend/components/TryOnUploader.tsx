"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { compressToWebP } from "@/utils/imageProcessing";
import { useAuth } from "@/context/AuthContext";

interface TryOnUploaderProps {
  onComplete: (nailReferenceUrl: string, sourceUrl?: string) => void;
  onBack: () => void;
}

export default function TryOnUploader({
  onComplete,
  onBack,
}: TryOnUploaderProps) {
  const { showToastWithMessage } = useAuth();
  const [nailReference, setNailReference] = useState<{
    file: File;
    preview: string;
  } | null>(null);
  const [sourceImage, setSourceImage] = useState<{
    file: File;
    preview: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<"camera" | "upload">("camera");

  const nailInputRef = useRef<HTMLInputElement>(null);
  const sourceInputRef = useRef<HTMLInputElement>(null);

  const handleNailReferenceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressToWebP(file, 0.85, 1024, 1024);
      const preview = URL.createObjectURL(compressed);
      setNailReference({
        file: new File([compressed], "nail_reference.webp", { type: "image/webp" }),
        preview,
      });
    } catch (error) {
      console.error("Failed to process image:", error);
      showToastWithMessage("Failed to process image. Please try again.");
    }
  };

  const handleSourceImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressToWebP(file, 0.85, 1280, 1280);
      const preview = URL.createObjectURL(compressed);
      setSourceImage({
        file: new File([compressed], "source_image.webp", { type: "image/webp" }),
        preview,
      });
    } catch (error) {
      console.error("Failed to process image:", error);
      showToastWithMessage("Failed to process image. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!nailReference) {
      showToastWithMessage("Please upload a nail reference image");
      return;
    }

    if (mode === "upload" && !sourceImage) {
      showToastWithMessage("Please upload a source image");
      return;
    }

    setIsUploading(true);

    try {
      // Upload nail reference
      const nailFormData = new FormData();
      nailFormData.append("file", nailReference.file);
      nailFormData.append("type", "nail_reference");

      const nailResponse = await fetch("/api/try-on/upload/", {
        method: "POST",
        body: nailFormData,
      });

      const nailData = await nailResponse.json();

      if (mode === "upload" && sourceImage) {
        // Upload source image
        const sourceFormData = new FormData();
        sourceFormData.append("file", sourceImage.file);
        sourceFormData.append("type", "source_image");

        const sourceResponse = await fetch("/api/try-on/upload/", {
          method: "POST",
          body: sourceFormData,
        });

        const sourceData = await sourceResponse.json();
        onComplete(nailData.url, sourceData.url);
      } else {
        // Camera mode - only nail reference needed
        onComplete(nailData.url);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      showToastWithMessage("Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#D98B99] font-semibold hover:opacity-80 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Upload Try-On Images</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>

        {/* Mode Selection */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Try-On Mode</p>
          <div className="flex gap-2">
            <button
              onClick={() => setMode("camera")}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition ${
                mode === "camera"
                  ? "bg-[#D98B99] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Live Camera
            </button>
            <button
              onClick={() => setMode("upload")}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition ${
                mode === "upload"
                  ? "bg-[#D98B99] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Upload Photo
            </button>
          </div>
        </div>

        {/* Nail Reference Upload */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">1. Nail Reference Image</h3>
          <input
            ref={nailInputRef}
            type="file"
            accept="image/*"
            onChange={handleNailReferenceChange}
            className="hidden"
          />
          {nailReference ? (
            <div className="relative aspect-square rounded-xl overflow-hidden">
              <Image
                src={nailReference.preview}
                alt="Nail reference"
                fill
                style={{ objectFit: "cover" }}
              />
              <button
                onClick={() => {
                  URL.revokeObjectURL(nailReference.preview);
                  setNailReference(null);
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => nailInputRef.current?.click()}
              className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-[#D98B99] hover:bg-pink-50 transition"
            >
              <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <p className="text-gray-600 font-medium">Upload Nail Design</p>
              <p className="text-sm text-gray-400 mt-1">Tap to select</p>
            </button>
          )}
        </div>

        {/* Source Image Upload (only in upload mode) */}
        {mode === "upload" && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">2. Your Hand Photo</h3>
            <input
              ref={sourceInputRef}
              type="file"
              accept="image/*"
              onChange={handleSourceImageChange}
              className="hidden"
            />
            {sourceImage ? (
              <div className="relative aspect-square rounded-xl overflow-hidden">
                <Image
                  src={sourceImage.preview}
                  alt="Source image"
                  fill
                  style={{ objectFit: "cover" }}
                />
                <button
                  onClick={() => {
                    URL.revokeObjectURL(sourceImage.preview);
                    setSourceImage(null);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => sourceInputRef.current?.click()}
                className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-[#D98B99] hover:bg-pink-50 transition"
              >
                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-gray-600 font-medium">Upload Hand Photo</p>
                <p className="text-sm text-gray-400 mt-1">Tap to select</p>
              </button>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isUploading || !nailReference || (mode === "upload" && !sourceImage)}
          className="w-full py-4 bg-[#D98B99] text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "Uploading..." : mode === "camera" ? "Start Try-On" : "Process Try-On"}
        </button>
      </div>
    </div>
  );
}
