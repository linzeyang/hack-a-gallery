import Link from "next/link";

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900"
      aria-label="Hero section"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-8">
            <span className="mr-2">🚀</span>
            Powered by AI
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            Where{" "}
            <span className="text-blue-600 dark:text-blue-400 underline decoration-blue-600 decoration-4">
              every
            </span>{" "}
            hackathon project{" "}
            <span className="bg-linear-to-r from-yellow-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent animate-pulse">
              shines
            </span>
            <span className="inline-block ml-1 text-yellow-400 animate-pulse">
              ✨
            </span>
          </h1>

          {/* Subheading */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-10">
            Showcase your innovation, preserve your legacy, and connect with the
            hackathon community. AI-powered insights help your projects get the
            recognition they deserve.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/events"
              className="w-full sm:w-auto px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-150 ease-in-out shadow-lg hover:shadow-xl"
            >
              Explore Events
            </Link>
            <Link
              href="/projects"
              className="w-full sm:w-auto px-8 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors duration-150 ease-in-out shadow-lg hover:shadow-xl"
            >
              Browse Projects
            </Link>
          </div>

          {/* Stats or Social Proof (Optional) */}
          <div
            className="mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto"
            role="region"
            aria-label="Platform statistics"
          >
            <div>
              <div
                className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white"
                aria-label="Over 100 projects"
              >
                100+
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Projects
              </div>
            </div>
            <div>
              <div
                className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white"
                aria-label="Over 20 hackathons"
              >
                20+
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Hackathons
              </div>
            </div>
            <div>
              <div
                className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white"
                aria-label="Over 200 hackers"
              >
                200+
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Hackers
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative gradient blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
    </section>
  );
}
