import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Topical Past Papers · Cambridge IGCSE Mathematics",
  description: "Practice Cambridge IGCSE Mathematics past paper questions filtered by topic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
