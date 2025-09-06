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

// A dedicated component for the collection card to keep the main page clean.
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

  // Close the menu if the user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="group relative">
      <Link
        href={`/profile/saved/${collection.id}`}
        className="aspect-square block bg-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden"
      >
        <div className="relative w-full h-full">
          {collection.thumbnail_url && (
            <Image
              src={collection.thumbnail_url}
              alt={collection.name}
              fill
              style={{ objectFit: "cover" }}
              className="transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-3 md:p-4 text-white">
            <h2 className="font-bold text-base md:text-lg">
              {collection.name}
            </h2>
            <p className="text-xs md:text-sm">{collection.post_count} posts</p>
          </div>
        </div>
      </Link>

      {/* --- Mobile & Desktop Actions --- */}
      {collection.name !== "All Posts" && (
        <div ref={menuRef} className="absolute top-2 right-2 z-10">
          {/* Mobile: Always-visible kebab menu */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden w-8 h-8 flex items-center justify-center bg-white/80 rounded-lg shadow"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {/* Desktop: Buttons appear on hover */}
          <div className="hidden md:flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="w-8 h-8 flex items-center justify-center bg-white/80 rounded-lg shadow hover:bg-white"
            >
              <svg
                className="w-4 h-4 text-gray-700"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path>
                <path
                  fillRule="evenodd"
                  d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="w-8 h-8 flex items-center justify-center bg-white/80 rounded-lg shadow hover:bg-white"
            >
              <svg
                className="w-4 h-4 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-10 right-0 bg-white rounded-lg shadow-xl py-1 w-32">
              <button
                onClick={onEdit}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={onDelete}
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
      <div className="bg-white md:shadow-lg p-4 md:p-8 min-h-screen">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
            My Collections
          </h1>
          <button
            onClick={handleOpenCreateModal}
            className="bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-900 transition text-sm sm:text-base"
          >
            Create Collection
          </button>
        </header>

        {collections.length > 0 ? (
          // Improved responsive grid
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
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No Collections Yet
            </h2>
            <p className="text-gray-500">
              Click Create Collection to get started.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
