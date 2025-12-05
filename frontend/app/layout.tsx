import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ClientLayout from "@/components/layout/ClientLayout";
import AppInitializer from "@/components/app-features/AppInitializer";
import PWARegister from "@/components/app-features/PWARegister";
import InstallPrompt from "@/components/app-features/InstallPrompt";
import OfflineIndicator from "@/components/common/OfflineIndicator";
import LandingRedirect from "@/components/app-features/LandingRedirect";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Missland - Nail Art Inspiration",
  description: "Discover, save, and try on beautiful nail art designs. Get personalized recommendations for your perfect manicure.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Missland",
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: "#ec4899",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: [
      { url: "/icon192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Missland" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Missland" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ec4899" />
        <link rel="apple-touch-icon" href="/icon192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleOAuthProvider
          clientId={
            "665407123210-20j9tne8tqgfi5t7dn6jr6taj51o0elk.apps.googleusercontent.com"
          }
        >
          <AuthProvider>
            <PWARegister />
            <InstallPrompt />
            <OfflineIndicator />
            <LandingRedirect />
            <AppInitializer>
              <div className="fixed top-0 left-0 w-full h-screen bg-gradient-to-r from-pink-50 to-blue-50 -z-10" />
              <div className="relative min-h-screen">
                <div className="flex flex-col bg-transparent">
                  <Header />
                  <main className="flex-1">
                    <ClientLayout>{children}</ClientLayout>
                  </main>
                  <BottomNav />
                </div>
              </div>
            </AppInitializer>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
