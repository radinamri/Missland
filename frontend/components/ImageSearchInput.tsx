"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Upload, X, Loader2 } from "lucide-react";

interface ImageSearchInputProps {
  onImageSelected: (file: File) => void;
  onClear: () => void;
  isLoading?: boolean;
  previewUrl?: string | null;
  className?: string;
}

export default function ImageSearchInput({
  onImageSelected,
  onClear,
  isLoading = false,
  previewUrl = null,
  className = "",
}: ImageSearchInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onImageSelected(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onImageSelected(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
      />

      {/* Drop zone or preview */}
      {previewUrl ? (
        // Image preview with clear button
        <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
          <Image
            src={previewUrl}
            alt="Search preview"
            fill
            className="object-cover"
          />
          
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          
          {/* Clear button */}
          {!isLoading && (
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
              aria-label="Clear image"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        // Upload drop zone
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            w-full h-48 rounded-lg border-2 border-dashed
            flex flex-col items-center justify-center gap-3
            cursor-pointer transition-colors
            ${isDragging 
              ? "border-pink-500 bg-pink-50" 
              : "border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
            }
            ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
              <p className="text-sm text-gray-600">Analyzing image...</p>
            </>
          ) : (
            <>
              <div className="flex gap-3">
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <Upload className="w-6 h-6 text-gray-600" />
                </div>
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <Camera className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  {isDragging ? "Drop image here" : "Search by image"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Click to upload or drag and drop
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Helper text */}
      {!previewUrl && !isLoading && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Upload a nail design to find similar styles
        </p>
      )}
    </div>
  );
}
