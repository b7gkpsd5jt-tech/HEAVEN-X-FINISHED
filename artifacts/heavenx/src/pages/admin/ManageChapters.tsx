import { useEffect, useState, useRef } from "react";
import { useSearch } from "wouter";
import { apiFetch, apiUpload } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { motion } from "framer-motion";
import { Upload, Trash2, Archive, Images, ChevronDown, BookOpen, X } from "lucide-react";

interface Series { id: string; title: string }
interface Chapter { id: string; number: number; title?: string; pageCount: number; views: number; createdAt: string }

export default function ManageChapters() {
  const { t } = useLang();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const preselectedSeries = params.get("seriesId") || "";

  const [allSeries, setAllSeries] = useState<Series[]>([]);
  const [selectedSeries, setSelectedSeries] = useState(preselectedSeries);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<"zip" | "images">("zip");
  const [uploading, setUploading] = useState(false);
  const [chapterNum, setChapterNum] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<HTMLInputElement>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ data: Series[] }>("/series?limit=100").then(r => setAllSeries(r.data)).catch(() => {});
  }, []);

  const loadChapters = async () => {
    if (!selectedSeries) return;
    setLoading(true);
    try {
      const chs = await apiFetch<Chapter[]>(`/chapters/series/${selectedSeries}`);
      setChapters(chs.reverse());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadChapters(); }, [selectedSeries]);

  const handleZipUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = zipRef.current?.files?.[0];
    if (!file || !selectedSeries || !chapterNum) { setMessage({ type: "error", text: "Please select a series, enter chapter number, and choose a file" }); return; }

    setUploading(true);
    setProgress(0);
    setMessage(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("seriesId", selectedSeries);
      fd.append("chapterNumber", chapterNum);
      if (chapterTitle) fd.append("chapterTitle", chapterTitle);

      const result = await apiUpload<{ message: string; pageCount: number }>("/upload/zip", fd);
      setMessage({ type: "success", text: `${result.message} — ${result.pageCount} pages` });
      setChapterNum("");
      setChapterTitle("");
      if (zipRef.current) zipRef.current.value = "";
      loadChapters();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("error") });
    } finally { setUploading(false); setProgress(0); }
  };

  const handleImagesUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const files = imagesRef.current?.files;
    if (!files || files.length === 0 || !selectedSeries || !chapterNum) { setMessage({ type: "error", text: "Please select a series, chapter number, and images" }); return; }

    setUploading(true);
    setProgress(0);
    setMessage(null);

    try {
      const fd = new FormData();
      Array.from(files).forEach(f => fd.append("images", f));
      fd.append("seriesId", selectedSeries);
      fd.append("chapterNumber", chapterNum);
      if (chapterTitle) fd.append("chapterTitle", chapterTitle);

      const result = await apiUpload<{ message: string; pageCount: number }>("/upload/images", fd);
      setMessage({ type: "success", text: `${result.message} — ${result.pageCount} pages` });
      setChapterNum("");
      setChapterTitle("");
      if (imagesRef.current) imagesRef.current.value = "";
      loadChapters();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("error") });
    } finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("areYouSure"))) return;
    setDeleting(id);
    try {
      await apiFetch(`/chapters/${id}`, { method: "DELETE" });
      setChapters(prev => prev.filter(c => c.id !== id));
    } catch {} finally { setDeleting(null); }
  };

  const selectedSeriesName = allSeries.find(s => s.id === selectedSeries)?.title || "";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("manageChapters")}</h1>

      {/* Series select */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <label className="text-sm font-semibold text-gray-700 block mb-2">Select Manhwa</label>
        <div className="relative">
          <select
            value={selectedSeries}
            onChange={e => setSelectedSeries(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white appearance-none pr-8"
          >
            <option value="">-- Select a series --</option>
            {allSeries.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {selectedSeries && (
        <>
          {/* Upload panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">{t("uploadChapter")}</h2>

            {/* Mode tabs */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setUploadMode("zip")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all ${uploadMode === "zip" ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                <Archive size={15} /> {t("uploadZip")}
              </button>
              <button
                onClick={() => setUploadMode("images")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all ${uploadMode === "images" ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                <Images size={15} /> {t("uploadImages")}
              </button>
            </div>

            <form onSubmit={uploadMode === "zip" ? handleZipUpload : handleImagesUpload} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Chapter Number *</label>
                  <input
                    type="number" min="1" required value={chapterNum}
                    onChange={e => setChapterNum(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="e.g. 1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Chapter Title (optional)</label>
                  <input value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="e.g. The Beginning" />
                </div>
              </div>

              {uploadMode === "zip" ? (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">ZIP File (containing images) *</label>
                  <input ref={zipRef} type="file" accept=".zip" required className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-xs file:font-medium" />
                  <p className="text-xs text-gray-400 mt-1">Images inside the ZIP will be sorted alphabetically</p>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Image Files (JPG/PNG/WebP) *</label>
                  <input ref={imagesRef} type="file" accept="image/*" multiple required className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-xs file:font-medium" />
                  <p className="text-xs text-gray-400 mt-1">Files will be sorted by name. Max 50 images.</p>
                </div>
              )}

              {message && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {message.text}
                  <button type="button" onClick={() => setMessage(null)} className="ml-auto"><X size={14} /></button>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || !selectedSeries || !chapterNum}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-all"
              >
                {uploading ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Uploading...</>
                ) : (
                  <><Upload size={15} /> Upload Chapter</>
                )}
              </button>
            </form>
          </div>

          {/* Chapter list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Chapters — {selectedSeriesName}</h2>
              <span className="text-sm text-gray-500">{chapters.length} total</span>
            </div>

            {loading ? (
              <div className="p-5 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {chapters.map(ch => (
                  <div key={ch.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-sm">{ch.number}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{ch.title || `Chapter ${ch.number}`}</p>
                      <p className="text-xs text-gray-400">{ch.pageCount} pages · {ch.views} views · {new Date(ch.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => handleDelete(ch.id)} disabled={deleting === ch.id} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {chapters.length === 0 && (
                  <div className="py-12 text-center text-gray-400">
                    <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t("noResults")}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
