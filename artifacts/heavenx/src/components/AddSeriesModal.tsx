import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function AddSeriesModal({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ongoing"); // Standardwert auf Englisch
  const [genres, setGenres] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // WICHTIG: Genres in ein Array umwandeln & Status korrekt senden
      const submissionData = {
        title,
        description,
        status: status, // Sendet "ongoing" oder "completed"
        genres: genres.split(",").map(g => g.trim()).filter(g => g !== ""),
      };

      await apiFetch("/series", {
        method: "POST",
        body: JSON.stringify(submissionData),
      });

      onRefresh();
      onClose();
    } catch (err) {
      alert("Fehler beim Hochladen: Das Format der Daten ist ungültig.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-[#0f0f0f] rounded-2xl border border-[#1a3a55]">
      <h2 className="text-white text-xl font-bold mb-4">Serie hinzufügen</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400">TITEL</label>
          <input className="w-full p-3 bg-[#111] border border-[#222] rounded-lg text-white" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm text-gray-400">STATUS</label>
          <select 
            className="w-full p-3 bg-[#111] border border-[#222] rounded-lg text-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ongoing">Laufend</option>
            <option value="completed">Abgeschlossen</option>
            <option value="hiatus">Pausiert</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400">GENRES (mit Komma trennen)</label>
          <input className="w-full p-3 bg-[#111] border border-[#222] rounded-lg text-white" placeholder="Action, Fantasy" value={genres} onChange={(e) => setGenres(e.target.value)} />
        </div>

        <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 rounded-lg text-white font-bold hover:bg-blue-700">
          {loading ? "Wird hochgeladen..." : "Serie speichern"}
        </button>
      </div>
    </form>
  );
}
