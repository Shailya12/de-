import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

// The entire app requires authentication and Firebase — skip static prerendering
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Gate Check-in",
  description: "Building visitor check-in and registration system",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gate Check-in",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-950">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
