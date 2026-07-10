import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import MobileViewportSync from "@/components/MobileViewportSync";
import { Suspense } from "react";
import PageViewTracker from "@/components/PageViewTracker";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // allow accessibility zoom
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
    { media: '(prefers-color-scheme: light)', color: '#0a0a0f' },
  ],
};

export const metadata: Metadata = {
  title: "Text Wingman — Get the Best Dating Text Reply",
  description: "Paste their message or upload a screenshot. Get short, confident dating-text replies plus why they work. Start free with no account or card.",
  keywords: ["AI text replies", "what to text back", "texting help", "AI wingman", "dating app reply", "how to reply to text", "vibe check", "tone translator", "text message assistant"],
  authors: [{ name: "Gula Labs" }],
  creator: "Gula Labs",
  publisher: "Gula Labs",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  applicationName: 'Text Wingman',
  appleWebApp: {
    capable: true,
    title: 'Text Wingman',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  openGraph: {
    title: "Stop Overthinking Your Next Text | Text Wingman",
    description: "Paste their message or upload a screenshot. Get the best dating-text reply plus why it works. Free to try.",
    type: "website",
    locale: "en_US",
    siteName: "Text Wingman",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stop Overthinking Your Next Text | Text Wingman",
    description: "Paste their message or upload a screenshot. Get the best dating-text reply plus why it works.",
    creator: "@gulalabs",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={inter.className}>
        <MobileViewportSync />
        <Suspense fallback={null}><PageViewTracker /></Suspense>
        {children}
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
