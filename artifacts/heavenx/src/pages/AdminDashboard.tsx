export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">HEAVENx Admin</h1>
        <span className="text-gray-500 text-sm">بازگشت ←</span>
      </div>

      {/* Main Control */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Manage Manhwa</h2>
          <p className="text-gray-500 text-sm">0 series total</p>
        </div>
        <button 
          onClick={() => window.location.hash = "/create-series"}
          className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2"
        >
          + Add Series
        </button>
      </div>

      {/* Search Bar */}
      <input 
        className="w-full p-4 bg-[#111] border border-gray-800 rounded-xl mb-8 outline-none focus:border-blue-500"
        placeholder="Search..."
      />

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-20 text-gray-600">
        <div className="text-4xl mb-2">📖</div>
        <p>No results</p>
      </div>
    </div>
  );
}
