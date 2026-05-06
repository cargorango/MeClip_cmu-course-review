import { ArrowLeft } from 'lucide-react'

export default function CourseLoading() {
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

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Back button */}
        <div className="inline-flex items-center gap-1.5 text-sm text-gray-400 bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>กลับ</span>
        </div>

        {/* Course info skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl animate-pulse shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-3/4 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="w-1/2 h-4 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <div className="w-20 h-6 bg-gray-100 rounded-full animate-pulse" />
            <div className="w-28 h-6 bg-gray-100 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Rating skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-3 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-3 bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-1 h-10 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>

        {/* Review room skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="w-24 h-5 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-4 space-y-3 h-48">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-1">
                <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
                <div className="w-3/4 h-8 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
