export default function ProjectSubmitLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12" role="status" aria-label="加载中...">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-1/2 bg-gray-200 rounded" />
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
