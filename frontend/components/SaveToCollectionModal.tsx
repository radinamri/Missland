"use client";

import { useState, useEffect } from "react";
import { Post } from "@/types";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

export default function SaveToCollectionModal({
  isOpen,
  onClose,
  postToSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  postToSave: Post | null;
}) {
  const {
    user,
    collections,
    fetchCollections,
    createCollection,
    managePostInCollection,
    showToastWithMessage,
  } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      fetchCollections();
    }
    // Reset create form when modal is closed
    if (!isOpen) {
      setIsCreating(false);
      setNewCollectionName("");
    }
  }, [isOpen, user, fetchCollections]);

  if (!isOpen || !postToSave) return null;

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCollectionName.trim()) {
      const newCollection = await createCollection(newCollectionName.trim());
      if (newCollection) {
        await handleSave(newCollection.id);
      }
      setNewCollectionName("");
      setIsCreating(false);
    }
  };

  const handleSave = async (collectionId: number) => {
    const message = await managePostInCollection(collectionId, postToSave.id);
    if (message) {
      showToastWithMessage(message);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-fade-in-down flex flex-col">
        <div className="p-6 border-b text-center">
          <h2 className="text-xl font-bold text-gray-800">Save to...</h2>
        </div>

        <div className="p-2 max-h-64 overflow-y-auto">
          {collections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => handleSave(collection.id)}
              className="w-full flex items-center p-3 text-left rounded-lg hover:bg-gray-100"
            >
              <div className="w-12 h-12 bg-gray-200 rounded-md mr-4 overflow-hidden relative">
                {collection.thumbnail_url && (
                  <Image
                    src={collection.thumbnail_url}
                    alt={collection.name}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="48px"
                  />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{collection.name}</p>
                <p className="text-sm text-gray-500">
                  {collection.post_count} posts
                </p>
              </div>
            </button>
          ))}
        </div>

        {isCreating ? (
          <form onSubmit={handleCreateCollection} className="p-4 border-t">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name"
              className="w-full px-4 py-2 bg-gray-100 border-transparent rounded-md focus:ring-2 focus:ring-pink-500 text-gray-500"
              autoFocus
            />
            <div className="flex items-center justify-end space-x-2 mt-3">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-sm font-semibold text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-sm font-semibold text-white bg-gray-800 px-4 py-2 rounded-md hover:bg-gray-900"
              >
                Create
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 border-t">
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center p-3 text-left rounded-lg hover:bg-gray-100 font-semibold text-pink-500"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-md mr-4 flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                </svg>
              </div>
              Create new collection
            </button>
          </div>
        )}

        {/* --- ADDED THIS SECTION --- */}
        {!isCreating && (
          <div className="p-4 border-t text-center bg-gray-50 rounded-b-2xl">
            <button
              onClick={onClose}
              className="text-sm font-semibold text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
        {/* --- END ADDED SECTION --- */}
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
