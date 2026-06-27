import { useState } from "react";

export default function CreateSeries() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Cover Upload */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">COVER</label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-32 bg-[#111] border border-gray-800 rounded-lg flex items-center justify-center text-gray-600">
              🖼️
            </div>
            <button className="bg-[#111] border border-gray-800 px-4 py-2 rounded-lg flex items-center gap-2">
              📁 Upload Cover
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">TITLE *</label>
            <input className="w-full p-3 bg-[#111] border border-gray-800 rounded-lg" placeholder="عنوان Manhwa..." />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">TRANSLATOR TEAM</label>
              <input className="w-full p-3 bg-[#111] border border-gray-800 rounded-lg" />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">ARTIST</label>
              <input className="w-full p-3 bg-[#111] border border-gray-800 rounded-lg" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">STATUS</label>
            <select className="w-full p-3 bg-[#111] border border-gray-800 rounded-lg">
              <option>Ongoing</option>
              <option>Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">GENRES (COMMA-SEPARATED)</label>
            <input className="w-full p-3 bg-[#111] border border-gray-800 rounded-lg" placeholder="Action, Fantasy, Romance" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">DESCRIPTION</label>
            <textarea className="w-full p-3 bg-[#111] border border-gray-800 rounded-lg h-32"></textarea>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button className="flex-1 p-3 bg-[#111] border border-gray-800 rounded-lg">Cancel</button>
          <button className="flex-1 p-3 bg-blue-500 rounded-lg font-bold">✓ Create</button>
        </div>
      </div>
    </div>
  );
}
