export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button Skeleton */}
        <div className="mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Project Header Skeleton */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="px-6 py-4">
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Links Skeleton */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Technologies Skeleton */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* Team Members Skeleton */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* Event Info Skeleton */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div className="h-16 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
