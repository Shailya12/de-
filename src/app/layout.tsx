import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Vigil — Smart Visitor Management",
  description: "Real-time visitor registration, timestamped photos, and instant admin oversight. Built for modern security teams.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vigil",
  },
  openGraph: {
    title: "Vigil — Smart Visitor Management",
    description: "Know who's in your building, always.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased" style={{ background: 'var(--bg)' }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
