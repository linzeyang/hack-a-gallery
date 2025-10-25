'use client';

import Link from "next/link";
import { useTranslations } from 'next-intl';

export default function CallToAction() {
  const t = useTranslations('cta');
  return (
    <section
      className="py-20 sm:py-24 bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700"
      aria-label="Call to action"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {t('title')}
          </h2>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            {t('description')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/events"
              className="w-full sm:w-auto px-8 py-3 rounded-lg bg-white hover:bg-gray-100 text-blue-600 font-medium transition-colors duration-150 ease-in-out shadow-lg hover:shadow-xl"
            >
              {t('browseEvents')}
            </Link>
            <Link
              href="/projects"
              className="w-full sm:w-auto px-8 py-3 rounded-lg bg-white/20 hover:bg-white/30 border-2 border-white text-white font-medium transition-colors duration-150 ease-in-out backdrop-blur-sm"
            >
              {t('browseProjects')}
            </Link>
          </div>

          {/* Additional Info */}
          <p className="mt-8 text-sm text-blue-100">
            {t('additionalInfo')}
          </p>
        </div>
      </div>
    </section>
  );
}
