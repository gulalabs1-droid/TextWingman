import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Text Wingman - AI-Powered Text Replies",
  description: "Never text alone again. Get 3 perfect AI-generated replies for any message instantly. Choose from Shorter, Spicier, or Softer tones.",
  keywords: ["AI text replies", "message generator", "text assistant", "AI wingman", "dating app helper"],
  authors: [{ name: "Gula Labs" }],
  creator: "Gula Labs",
  publisher: "Gula Labs",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Text Wingman - AI-Powered Text Replies",
    description: "Never text alone again. Get 3 perfect AI-generated replies for any message instantly.",
    type: "website",
    locale: "en_US",
    siteName: "Text Wingman",
  },
  twitter: {
    card: "summary_large_image",
    title: "Text Wingman - AI-Powered Text Replies",
    description: "Never text alone again. Get 3 perfect AI-generated replies instantly.",
    creator: "@gulalabs",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
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
