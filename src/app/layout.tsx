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
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
