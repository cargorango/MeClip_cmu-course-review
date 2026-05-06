export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
            <div className="w-36 h-5 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-20 h-7 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Hero skeleton */}
        <div className="text-center space-y-2">
          <div className="w-64 h-8 bg-gray-200 rounded animate-pulse mx-auto" />
          <div className="w-80 h-4 bg-gray-100 rounded animate-pulse mx-auto" />
        </div>

        {/* Search skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="w-full h-11 bg-gray-100 rounded-xl animate-pulse" />
        </div>

        {/* Top courses skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
          <div className="w-40 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
