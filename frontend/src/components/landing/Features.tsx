'use client';

import { useTranslations } from 'next-intl';

export default function Features() {
  const t = useTranslations('features');
  
  const features = [
    {
      icon: '🤖',
      titleKey: 'aiAnalysis.title',
      descriptionKey: 'aiAnalysis.description',
    },
    {
      icon: '✨',
      titleKey: 'showcase.title',
      descriptionKey: 'showcase.description',
    },
    {
      icon: '🏆',
      titleKey: 'portfolio.title',
      descriptionKey: 'portfolio.description',
    },
    {
      icon: '🌐',
      titleKey: 'community.title',
      descriptionKey: 'community.description',
    },
    {
      icon: '📊',
      titleKey: 'analytics.title',
      descriptionKey: 'analytics.description',
    },
    {
      icon: '🚀',
      titleKey: 'discovery.title',
      descriptionKey: 'discovery.description',
    },
  ];

  return (
    <section className="py-20 sm:py-24 bg-white dark:bg-gray-900" aria-label="Platform features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('description')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <article
              key={index}
              className="p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors duration-150 ease-in-out hover:shadow-lg"
            >
              {/* Icon */}
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4" aria-hidden="true">{feature.icon}</div>
              
              {/* Title */}
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t(feature.titleKey)}
              </h3>
              
              {/* Description */}
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {t(feature.descriptionKey)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
