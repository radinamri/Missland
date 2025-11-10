import Image from "next/image";
import { useRouter } from "next/navigation";
import { NailAnnotation } from "@/types/index";

interface AnnotationCardProps {
  annotation: NailAnnotation;
  onEdit: () => void;
}

const AnnotationCard: React.FC<AnnotationCardProps> = ({
  annotation,
  onEdit,
}) => {
  const router = useRouter();
  const imageUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/images/${annotation.image_name}`;

  // Check if both shape and pattern are human-labeled
  const isHumanLabeled =
    annotation.shape_source === "ground_truth" &&
    annotation.pattern_source === "ground_truth";

  const handleImageClick = () => {
    router.push(`/image/${annotation.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl border-2 border-gray-200">
      {/* Human-labeled indicator badge */}
      {isHumanLabeled && (
        <div className="absolute top-2 right-2 z-10 bg-green-500 text-white rounded-full p-2 shadow-lg">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      <div
        className="relative h-56 w-full cursor-pointer hover:opacity-90 transition-opacity"
        onClick={handleImageClick}
      >
        <Image
          src={imageUrl}
          alt={annotation.image_name}
          layout="fill"
          objectFit="cover"
          onError={(e) => {
            e.currentTarget.src =
              "https://placehold.co/400x400/EEE/31343C?text=No+Image";
          }}
        />
      </div>
      <div className="p-4">
        <h3
          className="text-md font-bold text-gray-800 truncate cursor-pointer hover:text-blue-600"
          title={annotation.image_name}
          onClick={handleImageClick}
        >
          {annotation.image_name}
        </h3>
        <div className="mt-3 text-xs text-gray-600 space-y-1.5">
          <p>
            <strong>Shape:</strong> {annotation.shape}
            {annotation.shape_source === "ground_truth" ? (
              <span className="ml-1 text-green-600 font-semibold">✓</span>
            ) : (
              <span className="ml-1 text-orange-500 text-[10px]">(AI)</span>
            )}
          </p>
          <p>
            <strong>Pattern:</strong> {annotation.pattern}
            {annotation.pattern_source === "ground_truth" ? (
              <span className="ml-1 text-green-600 font-semibold">✓</span>
            ) : (
              <span className="ml-1 text-orange-500 text-[10px]">(AI)</span>
            )}
          </p>
          <p>
            <strong>Size:</strong> {annotation.size}
          </p>
          <p>
            <strong>Colors:</strong>{" "}
            <span className="font-semibold text-gray-900">
              {annotation.colors.join(", ")}
            </span>
          </p>
        </div>
        <div className="mt-5 flex justify-end items-center">
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase rounded-md hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnotationCard;
