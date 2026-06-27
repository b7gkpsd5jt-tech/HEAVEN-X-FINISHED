import { useEffect, useState, useRef } from "react";
import { useSearch, useLocation } from "wouter";
import { apiFetch, apiUpload, API_BASE } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Upload, Trash2, Archive, Images, ChevronDown, BookOpen, X, Package, MessageSquare, Eye, EyeOff } from "lucide-react";

interface Series { id: string; title: string }
interface Chapter { id: string; number: number; title?: string; pageCount: number; views: number; createdAt: string }
interface MultiZipEntry { file: File; chapterNumber: number; status: "pending" | "uploading" | "done" | "error"; progress: number; }

export default function ManageChapters() {
  const { t } = useLang();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const preselectedSeries = params.get("seriesId") || "";

  const [allSeries, setAllSeries] = useState<Series[]>([]);
  const [selectedSeries, setSelectedSeries] = useState(preselectedSeries);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<"zip" | "images" | "multi-zip">("zip");
  const [uploading, setUploading] = useState(false);
  const [chapterNum, setChapterNum] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [multiZipEntries, setMultiZipEntries] = useState<MultiZipEntry[]>([]);
  const [startChapterNum, setStartChapterNum] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ data: Series[] }>("/series?limit=100").then(r => setAllSeries(r.data)).catch(() => {});
  }, []);

  const loadChapters = async () => {
    if (!selectedSeries) return;
    setLoading(true);
    try {
      const chs = await apiFetch<Chapter[]>(`/chapters/series/${selectedSeries}`);
      setChapters(chs.sort((a, b) => b.number - a.number));
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadChapters(); }, [selectedSeries]);

  // ── NEU: Sicherer Multi-Upload mit Queue ──
  const handleMultiZipPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 10);
    const start = parseInt(startChapterNum) || 1;
    setMultiZipEntries(files.map((file, i) => ({
      file, chapterNumber: start + i, status: "pending", progress: 0
    })));
  };

  const handleMultiZipUpload = async () => {
    if (!selectedSeries || multiZipEntries.length === 0) return;
    setUploading(true);
    
    for (let i = 0; i < multiZipEntries.length; i++) {
      const entry = multiZipEntries[i];
      setMultiZipEntries(prev => prev.map((e, idx) => idx === i ? { ...e, status: "uploading", progress: 0 } : e));

      try {
        const fd = new FormData();
        fd.append("file", entry.file);
        fd.append("seriesId", selectedSeries);
        fd.append("chapterNumber", String(entry.chapterNumber));
        await apiUpload("/upload/zip", fd);
        setMultiZipEntries(prev => prev.map((e, idx) => idx === i ? { ...e, status: "done", progress: 100 } : e));
      } catch {
        setMultiZipEntries(prev => prev.map((e, idx) => idx === i ? { ...e, status: "error", progress: 0 } : e));
      }
    }
    setUploading(false);
    loadChapters();
  };

  // ── NEU: Sicheres Löschen ──
  const handleDelete = async (id: string) => {
    if (!confirm("Kapitel und alle Bilder wirklich löschen?")) return;
    setDeleting(id);
    try {
      await apiFetch(`/chapters/${id}`, { method: "DELETE" });
      setChapters(prev => prev.filter(c => c.id !== id));
      setMessage({ type: "success", text: "Erfolgreich gelöscht." });
    } catch {
      setMessage({ type: "error", text: "Fehler beim Löschen." });
    } finally { setDeleting(null); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-6">Kapitelverwaltung</h1>

      <select 
        value={selectedSeries} 
        onChange={e => setSelectedSeries(e.target.value)}
        className="w-full p-3 bg-[#111] border border-[#222] rounded-xl mb-6"
      >
        <option value="">-- Serie wählen --</option>
        {allSeries.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
      </select>

      {selectedSeries && (
        <div className="bg-[#111] border border-[#222] p-5 rounded-2xl">
          <div className="flex gap-2 mb-5">
            <button onClick={() => setUploadMode("multi-zip")} className="p-3 bg-white text-black rounded-xl font-bold text-xs">Multi-ZIP Upload</button>
          </div>

          {/* Upload Liste */}
          <input type="number" placeholder="Startnummer" className="bg-[#222] p-2 rounded mb-2 w-full" onChange={e => setStartChapterNum(e.target.value)} />
          <input type="file" multiple accept=".zip" onChange={handleMultiZipPick} className="mb-4 w-full" />
          
          <button 
            onClick={handleMultiZipUpload} 
            disabled={uploading}
            className="w-full py-3 bg-blue-600 rounded-xl font-bold"
          >
            {uploading ? "Lade hoch..." : "Jetzt hochladen"}
          </button>

          <div className="mt-4 space-y-2">
            {multiZipEntries.map((e, i) => (
              <div key={i} className="flex justify-between p-2 bg-[#222] rounded">
                <span>Ch.{e.chapterNumber}: {e.file.name}</span>
                <span>{e.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kapitel Liste */}
      <div className="mt-8">
        {chapters.map(ch => (
          <div key={ch.id} className="flex items-center justify-between p-4 border-b border-[#222]">
            <span>Kapitel {ch.number}</span>
            <button onClick={() => handleDelete(ch.id)} className="text-red-500"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
