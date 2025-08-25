"use client";

import { Collection } from "@/types";

interface DeleteCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  collectionToDelete: Collection | null;
}

export default function DeleteCollectionModal({
  isOpen,
  onClose,
  onConfirm,
  collectionToDelete,
}: DeleteCollectionModalProps) {
  if (!isOpen || !collectionToDelete) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm text-center p-8 animate-fade-in-down">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Delete Collection
        </h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete the collection{" "}
          <span className="font-bold text-gray-800">
            {collectionToDelete.name}
          </span>
          ? This action cannot be undone.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="font-semibold text-gray-700 bg-gray-100 px-6 py-2 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="font-semibold text-white bg-red-600 px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
