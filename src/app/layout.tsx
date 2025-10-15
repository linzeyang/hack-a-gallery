import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HackaGallery - Where Every Hackathon Project Shines",
  description: "Discover, showcase, and preserve innovative hackathon projects. AI-powered platform for hackers, organizers, and investors.",
  keywords: ["hackathon", "projects", "showcase", "AI", "innovation"],
  authors: [{ name: "HackaGallery Team" }],
  openGraph: {
    title: "HackaGallery - Where Every Hackathon Project Shines",
    description: "Discover, showcase, and preserve innovative hackathon projects.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
