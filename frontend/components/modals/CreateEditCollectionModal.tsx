"use client";

import { useState, useEffect } from "react";
import { Collection } from "@/types";

interface CreateEditCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, collectionId?: number) => Promise<void>;
  collectionToEdit?: Collection | null;
}

export default function CreateEditCollectionModal({
  isOpen,
  onClose,
  onSave,
  collectionToEdit,
}: CreateEditCollectionModalProps) {
  const [name, setName] = useState("");
  const isEditing = !!collectionToEdit;

  useEffect(() => {
    if (isOpen) {
      setName(collectionToEdit ? collectionToEdit.name : "");
    }
  }, [isOpen, collectionToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), collectionToEdit?.id).then(() => {
        onClose(); // Close modal on success
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-fade-in-down">
        <div className="p-6 border-b text-center relative">
          <h2 className="text-xl font-bold text-[#3D5A6C]">
            {isEditing ? "Edit Collection" : "Create New Collection"}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
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
        <form onSubmit={handleSubmit} className="p-6">
          <label
            htmlFor="collectionName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Name
          </label>
          <input
            id="collectionName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-[#D98B99] focus:border-[#D98B99] placeholder:text-gray-400 text-gray-500 transition"
            autoFocus
            required
          />
          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#E7E7E7] text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-[#dcdcdc] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#3D5A6C] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#314A5A] transition"
            >
              {isEditing ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
