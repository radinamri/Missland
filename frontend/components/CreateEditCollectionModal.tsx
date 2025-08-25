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
    if (isOpen && isEditing) {
      setName(collectionToEdit.name);
    } else {
      setName("");
    }
  }, [isOpen, collectionToEdit, isEditing]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), collectionToEdit?.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-fade-in-down">
        <div className="p-6 border-b text-center">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? "Edit Collection" : "Create New Collection"}
          </h2>
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
            className="w-full px-4 py-2 bg-gray-100 border-transparent rounded-md focus:ring-2 focus:ring-pink-500 text-gray-500"
            autoFocus
            required
          />
          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="font-semibold text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="font-semibold text-white bg-gray-800 px-4 py-2 rounded-md hover:bg-gray-900"
            >
              {isEditing ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
