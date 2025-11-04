import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Text Wingman - AI-Powered Reply Generator",
  description: "Get perfect text message replies instantly with AI. Choose from Shorter, Spicier, or Softer responses.",
  keywords: "text message, AI reply, dating, messaging, wingman",
  authors: [{ name: "Text Wingman" }],
  openGraph: {
    title: "Text Wingman - AI-Powered Reply Generator",
    description: "Get perfect text message replies instantly with AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
