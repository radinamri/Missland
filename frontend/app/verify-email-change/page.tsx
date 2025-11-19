"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const uid = searchParams.get("uid");
    const token = searchParams.get("token");

    if (uid && token) {
      const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });
      api
        .post("/api/auth/email/change/confirm/", { uid, token })
        .then(() => {
          setMessage(
            "Your email has been successfully changed! You will be logged out for security. Please log in again with your new email address."
          );
          // Optionally, clear local storage and redirect after a delay
          setTimeout(() => {
            localStorage.removeItem("authTokens");
            router.push("/login");
          }, 5000);
        })
        .catch((error) => {
          setMessage(
            "Verification failed. The link may be invalid or expired."
          );
          console.error("Email verification failed:", error);
        });
    } else {
      setMessage("Invalid verification link. Please try again.");
    }
  }, [searchParams, router]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Email Verification</h1>
      <p>{message}</p>
      <Link href="/login">Go to Login</Link>
    </div>
  );
}

// Wrap the component in Suspense because useSearchParams requires it.
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
