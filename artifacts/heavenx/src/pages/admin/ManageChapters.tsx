import { useState, useEffect } from "react";
import { apiFetch, apiUpload } from "@/lib/api";
import { Trash2, Package } from "lucide-react";

export default function ManageChapters() {
  const [selectedSeries, setSelectedSeries] = useState("");
  const [allSeries, setAllSeries] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [multiZipEntries, setMultiZipEntries] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { 
    apiFetch<{ data: any[] }>("/series?limit=100").then(r => setAllSeries(r.data)).catch(() => {}); 
  }, []);

  const loadChapters = async () => {
    if (!selectedSeries) return;
    const chs = await apiFetch<any[]>(`/chapters/series/${selectedSeries}`);
    setChapters(chs.sort((a, b) => b.number - a.number));
  };

  useEffect(() => { loadChapters(); }, [selectedSeries]);

  const handleMultiZipUpload = async () => {
    setUploading(true);
    for (let entry of multiZipEntries) {
      const fd = new FormData();
      fd.append("file", entry.file);
      fd.append("seriesId", selectedSeries);
      fd.append("chapterNumber", entry.chapterNumber);
      await apiUpload("/upload/zip", fd);
    }
    setUploading(false);
    loadChapters();
    alert("Upload abgeschlossen!");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Wirklich löschen?")) return;
    await apiFetch(`/chapters/${id}`, { method: "DELETE" });
    loadChapters();
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Kapitelverwaltung</h1>
      <select className="w-full p-2 bg-black border rounded mb-4" onChange={(e) => setSelectedSeries(e.target.value)}>
        <option value="">Serie wählen</option>
        {allSeries.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
      </select>
      
      <div className="space-y-4">
        <button onClick={handleMultiZipUpload} disabled={uploading} className="bg-blue-600 px-4 py-2 rounded">
          {uploading ? "Lädt hoch..." : "Alle hochladen"}
        </button>
        {chapters.map(ch => (
          <div key={ch.id} className="flex justify-between items-center p-2 border-b">
            <span>Kapitel {ch.number}</span>
            <button onClick={() => handleDelete(ch.id)} className="text-red-500"><Trash2 /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
