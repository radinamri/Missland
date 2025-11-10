// app/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import AnnotationCard from "./components/AnnotationCard";
import EditModal from "./components/EditModal";
import { NailAnnotation } from "../../types";

export default function DashboardPage() {
  const [annotations, setAnnotations] = useState<NailAnnotation[]>([]);
  const [filteredAnnotations, setFilteredAnnotations] = useState<NailAnnotation[]>([]);
  const [editingAnnotation, setEditingAnnotation] =
    useState<NailAnnotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filterShape, setFilterShape] = useState<string>("");
  const [filterPattern, setFilterPattern] = useState<string>("");
  const [filterSize, setFilterSize] = useState<string>("");
  const [filterColor, setFilterColor] = useState<string>("");

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Predefined options
  const SHAPE_OPTIONS = ["almond", "coffin", "square", "stiletto", "oval", "round"];
  const PATTERN_OPTIONS = ["french_tips", "glossy", "gradient", "matte", "mixed", "solid"];
  const SIZE_OPTIONS = ["small", "medium", "large"];
  const COLOR_OPTIONS = [
    "red", "blue", "green", "yellow", "orange", "purple", "pink",
    "black", "white", "gray", "brown", "beige", "gold", "silver"
  ];

  // useCallback memoizes the function so it doesn't get recreated on every render.
  // This makes it safe to include in the useEffect dependency array.
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/annotations/?page_size=10000`);
      if (!response.ok) {
        throw new Error(
          `Network response was not ok (status: ${response.status})`
        );
      }
      const data = await response.json();
      // Handle paginated response from Django REST framework
      const annotations = data.results || data;
      setAnnotations(annotations);
      setFilteredAnnotations(annotations);
    } catch (err) {
      // Type-safe error handling for 'unknown' type
      if (err instanceof Error) {
        setError(
          `Failed to fetch data: ${err.message}. Make sure the backend server is running.`
        );
      } else {
        setError("An unknown error occurred while fetching data.");
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]); // Dependency on API_BASE_URL

  // 1. Fetch all annotations from the backend on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Correctly include the memoized function as a dependency

  // Apply filters whenever filter state or annotations change
  useEffect(() => {
    let filtered = [...annotations];

    if (filterShape) {
      filtered = filtered.filter((item) => item.shape === filterShape);
    }

    if (filterPattern) {
      filtered = filtered.filter((item) => item.pattern === filterPattern);
    }

    if (filterSize) {
      filtered = filtered.filter((item) => item.size === filterSize);
    }

    if (filterColor) {
      filtered = filtered.filter((item) =>
        item.colors.some((color) =>
          color.toLowerCase().includes(filterColor.toLowerCase())
        )
      );
    }

    setFilteredAnnotations(filtered);
  }, [annotations, filterShape, filterPattern, filterSize, filterColor]);

  // 2. Handler to update any annotation field (used for Save)
  const handleUpdate = async (id: string, data: Partial<NailAnnotation>) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/annotations/${id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update annotation.");
      }

      const updatedItem = await response.json();

      // Update state to reflect the change in the UI
      setAnnotations((prev) =>
        prev.map((item) => (item.id === id ? updatedItem : item))
      );

      // Close the modal if it was open for an edit
      if (editingAnnotation?.id === id) {
        setEditingAnnotation(null);
      }
    } catch (err) {
      // Type-safe error handling
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      alert(`Error updating annotation: ${errorMessage}`);
      console.error(err);
    }
  };

  const clearFilters = () => {
    setFilterShape("");
    setFilterPattern("");
    setFilterSize("");
    setFilterColor("");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen font-semibold">
        Loading Annotations...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-600 font-semibold p-4">
        {error}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
            Nail Annotation Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Verify and edit image metadata from the database.
          </p>
        </header>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Filters</h2>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 font-semibold"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Shape Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shape
              </label>
              <select
                value={filterShape}
                onChange={(e) => setFilterShape(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
              >
                <option value="">All Shapes</option>
                {SHAPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Pattern Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pattern
              </label>
              <select
                value={filterPattern}
                onChange={(e) => setFilterPattern(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
              >
                <option value="">All Patterns</option>
                {PATTERN_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1).replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Size Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <select
                value={filterSize}
                onChange={(e) => setFilterSize(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
              >
                <option value="">All Sizes</option>
                {SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Color Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <select
                value={filterColor}
                onChange={(e) => setFilterColor(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
              >
                <option value="">All Colors</option>
                {COLOR_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredAnnotations.length}</span> of{" "}
            <span className="font-semibold">{annotations.length}</span> images
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredAnnotations.map((item) => (
            <AnnotationCard
              key={item.id}
              annotation={item}
              onEdit={() => setEditingAnnotation(item)}
            />
          ))}
        </div>
      </div>

      {editingAnnotation && (
        <EditModal
          annotation={editingAnnotation}
          onClose={() => setEditingAnnotation(null)}
          onSave={handleUpdate}
        />
      )}
    </main>
  );
}
