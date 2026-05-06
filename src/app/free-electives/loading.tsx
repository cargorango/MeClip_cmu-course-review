export default function FreeElectivesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
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
        <div className="w-24 h-9 bg-white border border-gray-200 rounded-lg animate-pulse" />
        <div className="h-14 bg-white rounded-2xl border border-gray-200 animate-pulse" />
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  )
}
