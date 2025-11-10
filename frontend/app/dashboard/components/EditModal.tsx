import { useState } from "react";
import { NailAnnotation } from "@/types/index";

interface EditModalProps {
  annotation: NailAnnotation;
  onSave: (id: string, data: Partial<NailAnnotation>) => void;
  onClose: () => void;
}

const EditModal: React.FC<EditModalProps> = ({
  annotation,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    shape: annotation.shape,
    pattern: annotation.pattern,
    size: annotation.size,
    colors: annotation.colors.join(", "),
  });

  // Predefined options
  const SHAPE_OPTIONS = ["almond", "coffin", "square", "stiletto"];
  const PATTERN_OPTIONS = [
    "french_tips",
    "glossy",
    "gradient",
    "matte",
    "mixed",
  ];
  const SIZE_OPTIONS = ["small", "medium", "large"];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(annotation.id, {
      shape: formData.shape,
      pattern: formData.pattern,
      size: formData.size,
      colors: formData.colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      shape_source: "ground_truth",
      pattern_source: "ground_truth",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg transform transition-all max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Edit: {annotation.image_name}
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Shape */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shape
            </label>
            <select
              name="shape"
              value={formData.shape}
              onChange={handleChange}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
            >
              <option value="">Select shape...</option>
              {SHAPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Pattern */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pattern
            </label>
            <select
              name="pattern"
              value={formData.pattern}
              onChange={handleChange}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
            >
              <option value="">Select pattern...</option>
              {PATTERN_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() +
                    option.slice(1).replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Size */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size
            </label>
            <select
              name="size"
              value={formData.size}
              onChange={handleChange}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
            >
              <option value="">Select size...</option>
              {SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Colors */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colors (comma-separated)
            </label>
            <input
              type="text"
              name="colors"
              value={formData.colors}
              onChange={handleChange}
              placeholder="e.g., red, blue, white"
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
            />
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
