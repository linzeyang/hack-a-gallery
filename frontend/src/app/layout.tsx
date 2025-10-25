import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export const metadata: Metadata = {
  title: "HackaGallery - Where Every Hackathon Project Shines",
  description: "展示您的创新，保存您的成果，与黑客松社区建立联系。AI 驱动的洞察帮助您的项目获得应有的认可。",
  keywords: ["hackathon", "projects", "showcase", "AI", "innovation"],
  authors: [{ name: "HackaGallery Team" }],
  openGraph: {
    title: "HackaGallery - Where Every Hackathon Project Shines",
    description: "展示您的创新，保存您的成果，与黑客松社区建立联系。",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();
  
  return (
    <html lang="zh-CN">
      <body className="antialiased flex flex-col min-h-screen">
        <NextIntlClientProvider messages={messages}>
          {/* Skip to main content link for keyboard navigation */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
          >
            Skip to main content
          </a>
          <Header />
          <main id="main-content" className="grow" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
