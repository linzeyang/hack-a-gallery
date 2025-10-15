import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
      <body className="antialiased flex flex-col min-h-screen">
        {/* Skip to main content link for keyboard navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="flex-grow" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
