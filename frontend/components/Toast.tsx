"use client";

interface ToastProps {
  message: string;
  show: boolean;
}

export default function Toast({ message, show }: ToastProps) {
  if (!show) return null;

  return (
    <div className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg animate-fade-in-up z-50">
      <p>{message}</p>
    </div>
  );
}
