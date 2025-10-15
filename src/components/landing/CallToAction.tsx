import Link from 'next/link';

export default function CallToAction() {
  return (
    <section className="py-20 sm:py-24 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to showcase your innovation?
          </h2>
          
          {/* Subheading */}
          <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of hackers who are building their legacy on HackaGallery. 
            Start exploring events or submit your first project today.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/events"
              className="w-full sm:w-auto px-8 py-3 rounded-lg bg-white hover:bg-gray-100 text-blue-600 font-medium transition-colors duration-150 ease-in-out shadow-lg hover:shadow-xl"
            >
              Browse Events
            </Link>
            <Link
              href="/projects/submit"
              className="w-full sm:w-auto px-8 py-3 rounded-lg border-2 border-white hover:bg-white/10 text-white font-medium transition-colors duration-150 ease-in-out"
            >
              Submit Your Project
            </Link>
          </div>

          {/* Additional Info */}
          <p className="mt-8 text-sm text-blue-100">
            No credit card required • Free to use • Join the community
          </p>
        </div>
      </div>
    </section>
  );
}
