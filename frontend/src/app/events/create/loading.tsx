export default function EventCreateLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" role="status" aria-label="加载中...">
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-64 bg-gray-200 rounded" />
        <div className="h-6 w-96 bg-gray-200 rounded" />
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
