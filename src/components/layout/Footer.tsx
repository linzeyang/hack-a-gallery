import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Brand */}
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              HackaGallery
            </span>
            <span className="text-gray-500 text-sm">
              Where every hackathon project shines
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6">
            <Link
              href="/events"
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
            >
              Events
            </Link>
            <Link
              href="/projects"
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
            >
              Projects
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
            >
              GitHub
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            © {currentYear} HackaGallery. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
