"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Post } from "@/types";
import api from "@/utils/api";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";

export default function TryOnPage() {
  const params = useParams();
  const postId = params.postId as string;
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeValue, setQrCodeValue] = useState("");

  useEffect(() => {
    if (postId) {
      // Fetch the specific post details
      api
        .get<Post>(`/api/auth/posts/${postId}/`)
        .then((response) => {
          setPost(response.data);
          // The QR code will now link to this very page.
          setQrCodeValue(window.location.href);
        })
        .catch((error) => console.error("Failed to fetch post", error))
        .finally(() => setIsLoading(false));
    }
  }, [postId]);

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-gray-500 animate-pulse">
          Loading Try-On Session...
        </p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-red-500">
          Could not find the selected style.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white md:shadow-lg p-4 md:p-8 min-h-screen">
      {/* --- Desktop View: QR Code --- */}
      <div className="hidden md:flex flex-col items-center text-center max-w-lg mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
          Scan to Try On
        </h1>
        <p className="text-gray-600 mt-4 mb-8">
          To see a live preview of this style, open your phone&apos;s camera and
          scan the QR code below. This will open the experience on your mobile
          device.
        </p>
        <div className="bg-white p-4 rounded-lg shadow-inner inline-block">
          {qrCodeValue && (
            <QRCodeSVG
              value={qrCodeValue}
              size={256}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"L"}
              includeMargin={true}
            />
          )}
        </div>
      </div>

      {/* --- Mobile View: Post Image & Live Camera Placeholder --- */}
      <div className="block md:hidden">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Live Try-On</h1>
          <p className="text-gray-600 mb-6">
            Your camera should activate below to show a live preview.
          </p>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-lg max-w-md mx-auto">
          <Image
            src={post.image_url}
            alt={post.title}
            width={post.width}
            height={post.height}
            className="w-full h-auto"
            priority
          />
        </div>
        {/* This is where your live camera component would go in the future */}
      </div>
    </div>
  );
}
