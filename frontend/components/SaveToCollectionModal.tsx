"use client";

import { useState, useEffect, useRef } from "react";
import { Collection, Post } from "@/types";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

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

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  // State for the custom dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      setIsLoading(true);
      fetchCollections().then(() => setIsLoading(false));
    }
    if (!isOpen) {
      setIsCreating(false);
      setNewCollectionName("");
      setIsDropdownOpen(false);
    }
  }, [isOpen, user, fetchCollections]);

  // Set the default selected collection once collections are loaded
  useEffect(() => {
    if (collections.length > 0 && !selectedCollection) {
      setSelectedCollection(collections[0]);
    }
  }, [collections, selectedCollection]);

  // Close dropdown if user clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen || !postToSave) return null;

  const handleCreateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCollectionName.trim()) {
      const newCollection = await createCollection(newCollectionName.trim());
      if (newCollection) {
        await handleSave(newCollection.id);
      }
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
        <div className="p-6 border-b text-center relative">
          <h2 className="text-xl font-bold text-[#3D5A6C]">
            Save to Collection
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

        <div className="p-4 space-y-4">
          {isLoading ? (
            <LoadingSpinner />
          ) : isCreating ? (
            <form onSubmit={handleCreateAndSave}>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Collection name"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-[#D98B99] focus:border-[#D98B99] placeholder:text-gray-400 text-gray-500"
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
                  className="text-sm font-semibold text-white bg-[#3D5A6C] px-4 py-2 rounded-md hover:bg-[#314A5A]"
                >
                  Create & Save
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Custom Dropdown */}
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between text-left p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <span className="font-semibold text-[#3D5A6C]">
                    {selectedCollection?.name || "Select a Collection"}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border z-10 max-h-48 overflow-y-auto">
                    {collections.map((collection) => (
                      <div
                        key={collection.id}
                        onClick={() => {
                          setSelectedCollection(collection);
                          setIsDropdownOpen(false);
                        }}
                        className="p-3 hover:bg-gray-100 cursor-pointer font-medium text-gray-700"
                      >
                        {collection.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() =>
                  selectedCollection && handleSave(selectedCollection.id)
                }
                disabled={!selectedCollection}
                className="w-full bg-[#3D5A6C] text-white font-bold py-3 rounded-lg hover:bg-[#314A5A] transition disabled:opacity-50"
              >
                Save
              </button>

              <div className="text-center">
                <button
                  onClick={() => setIsCreating(true)}
                  className="font-semibold text-[#D98B99] hover:underline text-sm"
                >
                  Create New Collection
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
