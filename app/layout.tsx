import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Text Wingman — Your Sharp Friend for Every Conversation",
  description: "AI reads your conversation, coaches the move, writes the reply, and checks your vibe before you send. Free — Vibe Check, Tone Translator, Screenshot AI, Strategy Coach.",
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
    title: "Text Wingman — Your Sharp Friend for Every Conversation",
    description: "AI reads your conversation, coaches the move, writes the reply, and checks your vibe before you send. Free.",
    type: "website",
    locale: "en_US",
    siteName: "Text Wingman",
  },
  twitter: {
    card: "summary_large_image",
    title: "Text Wingman — AI Texting Companion",
    description: "AI reads your conversation, coaches the move, writes the reply, and checks your vibe before you send.",
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
    viewportFit: 'cover',
  },
  themeColor: '#0a0a0f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <meta name="theme-color" content="#0a0a0f" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
