export default function Features() {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Insights',
      description: 'Intelligent analysis and recommendations help your projects stand out and get discovered by the right audience.',
    },
    {
      icon: '✨',
      title: 'Showcase Excellence',
      description: 'Beautiful project galleries that highlight your innovation, technical skills, and creative problem-solving.',
    },
    {
      icon: '🏆',
      title: 'Preserve Your Legacy',
      description: 'Never lose track of your hackathon achievements. Build a permanent portfolio of your innovation journey.',
    },
    {
      icon: '🌐',
      title: 'Connect & Collaborate',
      description: 'Discover amazing projects, connect with talented hackers, and find inspiration for your next big idea.',
    },
    {
      icon: '📊',
      title: 'Track Your Impact',
      description: 'See how your projects perform across events and gain insights into what resonates with the community.',
    },
    {
      icon: '🚀',
      title: 'Easy Submission',
      description: 'Submit your projects in minutes with our streamlined interface. Focus on building, not paperwork.',
    },
  ];

  return (
    <section className="py-20 sm:py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything you need to shine
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            HackaGallery provides the tools and platform to showcase your hackathon projects 
            and connect with the innovation community.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors duration-150 ease-in-out hover:shadow-lg"
            >
              {/* Icon */}
              <div className="text-4xl mb-4">{feature.icon}</div>
              
              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              
              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
