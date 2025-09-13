"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Collection } from "@/types";
import CreateEditCollectionModal from "@/components/CreateEditCollectionModal";
import DeleteCollectionModal from "@/components/DeleteCollectionModal";
import LoadingSpinner from "@/components/LoadingSpinner";

// --- Collection Card Sub-component ---
function CollectionCard({
  collection,
  onEdit,
  onDelete,
}: {
  collection: Collection;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="group relative">
      <Link
        href={`/profile/saved/${collection.id}`}
        className="aspect-square block rounded-xl shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300 hover:scale-105 bg-gray-200"
      >
        <div className="relative w-full h-full">
          {/* --- NEW Collage Background --- */}
          {collection.posts_preview && collection.posts_preview.length > 0 ? (
            <div className="w-full h-full grid grid-cols-2 grid-rows-2">
              {collection.posts_preview.map((imageUrl, index) => (
                <div key={index} className="relative w-full h-full">
                  <Image
                    src={imageUrl}
                    alt={`${collection.name} preview ${index + 1}`}
                    fill
                    style={{ objectFit: "cover" }}
                    className="filter blur-sm scale-110" // Blur and scale up slightly
                  />
                </div>
              ))}
            </div>
          ) : (
            // Fallback for empty collections with a solid color
            <div className="w-full h-full bg-amber-100"></div>
          )}

          {/* Gradient overlay and text remain on top */}
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="absolute bottom-0 left-0 p-3 md:p-4 text-white">
            <h2 className="font-bold text-base md:text-lg truncate">
              {collection.name}
            </h2>
            <p className="text-xs md:text-sm">{collection.post_count} posts</p>
          </div>
        </div>
      </Link>

      {collection.name !== "All Posts" && (
        <div ref={menuRef} className="absolute top-2 right-2 z-10">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden w-8 h-8 flex items-center justify-center bg-white/80 rounded-full shadow"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          <div className="hidden md:flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="w-8 h-8 flex items-center justify-center bg-white/80 rounded-full shadow hover:bg-white"
            >
              <svg
                className="w-5 h-5 text-gray-700"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="self-end bg-white/80 text-red-600 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
            >
              <svg
                className="w-5 h-5"
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
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden absolute top-10 right-0 bg-white rounded-lg shadow-xl py-1 w-32">
              <button
                onClick={() => {
                  onEdit();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Main Page Component ---
export default function SavedPostsPage() {
  const {
    user,
    tokens,
    isLoading: isAuthLoading,
    collections,
    fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    showToastWithMessage,
  } = useAuth();
  const router = useRouter();

  const [isCreateEditModalOpen, setIsCreateEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [collectionToEdit, setCollectionToEdit] = useState<Collection | null>(
    null
  );
  const [collectionToDelete, setCollectionToDelete] =
    useState<Collection | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !tokens) {
      router.push("/login");
    }
  }, [tokens, isAuthLoading, router]);

  useEffect(() => {
    if (user) {
      fetchCollections();
    }
  }, [user, fetchCollections]);

  const handleOpenCreateModal = () => {
    setCollectionToEdit(null);
    setIsCreateEditModalOpen(true);
  };

  const handleOpenEditModal = (collection: Collection) => {
    setCollectionToEdit(collection);
    setIsCreateEditModalOpen(true);
  };

  const handleOpenDeleteModal = (collection: Collection) => {
    setCollectionToDelete(collection);
    setIsDeleteModalOpen(true);
  };

  const handleSaveCollection = async (name: string, collectionId?: number) => {
    if (collectionId) {
      await updateCollection(collectionId, name);
      showToastWithMessage("Collection updated!");
    } else {
      await createCollection(name);
      showToastWithMessage("Collection created!");
    }
    setIsCreateEditModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (collectionToDelete) {
      await deleteCollection(collectionToDelete.id);
      showToastWithMessage("Collection deleted.");
      setIsDeleteModalOpen(false);
    }
  };

  if (isAuthLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
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
            My Collections
          </h1>
          <button
            onClick={handleOpenCreateModal}
            className="bg-[#3D5A6C] text-white font-bold py-2 px-5 rounded-lg hover:bg-[#314A5A] transition text-sm sm:text-base self-start sm:self-auto"
          >
            Create Collection
          </button>
        </header>

        <CreateEditCollectionModal
          isOpen={isCreateEditModalOpen}
          onClose={() => setIsCreateEditModalOpen(false)}
          onSave={handleSaveCollection}
          collectionToEdit={collectionToEdit}
        />
        <DeleteCollectionModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          collectionToDelete={collectionToDelete}
        />
        {collections && collections.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onEdit={() => handleOpenEditModal(collection)}
                onDelete={() => handleOpenDeleteModal(collection)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-white rounded-2xl shadow-sm">
            <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#3D5A6C] mb-2">
              No Collections Yet
            </h2>
            <p className="text-gray-500 mb-6">
              Click the button below to create your first collection.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="bg-[#D98B99] text-white font-bold py-2 px-5 rounded-lg hover:bg-[#C47C8A] transition"
            >
              Create Collection
            </button>
          </div>
        )}
      </div>
    </>
  );
}
