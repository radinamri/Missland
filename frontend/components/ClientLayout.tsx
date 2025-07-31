"use client";

import { useAuth } from "@/context/AuthContext";
import Toast from "@/components/Toast";

// This component safely uses the useAuth hook because it's a Client Component.
export default function ClientLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const { toastMessage, showToast } = useAuth();

  return (
    <>
      <div className="flex flex-col min-h-screen">{children}</div>
      <Toast message={toastMessage} show={showToast} />
      {/* This is where the intercepted modal will be rendered */}
      {modal}
    </>
  );
}
