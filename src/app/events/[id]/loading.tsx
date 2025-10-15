export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Back Button Skeleton */}
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />

        {/* Header Skeleton */}
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-4">
                <div className="h-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-4">
                <div className="h-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Projects Section */}
        <div>
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
              >
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-20 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
