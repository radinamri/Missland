"use client";

import { useAuth } from "@/context/AuthContext";
import Toast from "@/components/Toast";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toastMessage, showToast } = useAuth();

  return (
    <>
      <div className="flex flex-col min-h-screen">{children}</div>
      <Toast message={toastMessage} show={showToast} />
    </>
  );
}
