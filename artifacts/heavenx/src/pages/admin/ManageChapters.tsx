import { useEffect, useState, useRef } from "react";
import { useSearch } from "wouter";
import { apiFetch, apiUpload, API_BASE } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Upload, Trash2, Archive, Images, ChevronDown, BookOpen, X, Package, MessageSquare, Eye, EyeOff } from "lucide-react";

interface SeriesComment {
  id: string; chapterId: string; userId: string; username: string;
  text: string; isHidden: string; createdAt: string; chapterNumber?: number;
}

interface Series { id: string; title: string }
interface Chapter { id: string; number: number; title?: string; pageCount: number; views: number; createdAt: string }

interface MultiZipEntry {
  file: File;
  chapterNumber: number;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  result?: string;
  error?: string;
}

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
  const [chapterTitle, setChapterTitle] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<HTMLInputElement>(null);
  const multiZipRef = useRef<HTMLInputElement>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Comments state
  const [seriesComments, setSeriesComments] = useState<SeriesComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentActionId, setCommentActionId] = useState<string | null>(null);

  // Multi-ZIP state
  const [multiZipEntries, setMultiZipEntries] = useState<MultiZipEntry[]>([]);
  const [startChapterNum, setStartChapterNum] = useState("");

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

  const loadComments = async () => {
    if (!selectedSeries) return;
    setCommentsLoading(true);
    try {
      const data = await apiFetch<SeriesComment[]>(`/admin/series/${selectedSeries}/comments`);
      setSeriesComments(data);
    } catch {} finally { setCommentsLoading(false); }
  };

  useEffect(() => { loadComments(); }, [selectedSeries]);

  const handleHideComment = async (id: string, hidden: boolean) => {
    setCommentActionId(id);
    try {
      await apiFetch(`/comments/${id}/${hidden ? "hide" : "unhide"}`, { method: "PATCH" });
      setSeriesComments(prev => prev.map(c => c.id === id ? { ...c, isHidden: hidden ? "true" : "false" } : c));
    } catch {} finally { setCommentActionId(null); }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm("Kommentar löschen?")) return;
    setCommentActionId(id);
    try {
      await apiFetch(`/comments/${id}`, { method: "DELETE" });
      setSeriesComments(prev => prev.filter(c => c.id !== id));
    } catch {} finally { setCommentActionId(null); }
  };

  // ── Single ZIP upload ──
  const handleZipUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = zipRef.current?.files?.[0];
    if (!file || !selectedSeries || !chapterNum) {
      setMessage({ type: "error", text: "Bitte Serie, Kapitel-Nummer und Datei auswählen" });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("seriesId", selectedSeries);
      fd.append("chapterNumber", chapterNum);
      if (chapterTitle) fd.append("chapterTitle", chapterTitle);
      const result = await apiUpload<{ message: string; pageCount: number }>("/upload/zip", fd);
      setMessage({ type: "success", text: `${result.message} — ${result.pageCount} Seiten` });
      setChapterNum(""); setChapterTitle("");
      if (zipRef.current) zipRef.current.value = "";
      loadChapters();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("error") });
    } finally { setUploading(false); }
  };

  // ── Images upload ──
  const handleImagesUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const files = imagesRef.current?.files;
    if (!files || files.length === 0 || !selectedSeries || !chapterNum) {
      setMessage({ type: "error", text: "Bitte Serie, Kapitel-Nummer und Bilder auswählen" });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      Array.from(files).forEach(f => fd.append("images", f));
      fd.append("seriesId", selectedSeries);
      fd.append("chapterNumber", chapterNum);
      if (chapterTitle) fd.append("chapterTitle", chapterTitle);
      const result = await apiUpload<{ message: string; pageCount: number }>("/upload/images", fd);
      setMessage({ type: "success", text: `${result.message} — ${result.pageCount} Seiten` });
      setChapterNum(""); setChapterTitle("");
      if (imagesRef.current) imagesRef.current.value = "";
      loadChapters();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("error") });
    } finally { setUploading(false); }
  };

  // ── Multi-ZIP: build queue from file picker ──
  const handleMultiZipPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 10);
    const start = parseInt(startChapterNum) || 1;
    const entries: MultiZipEntry[] = files
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .map((file, i) => ({
        file,
        chapterNumber: start + i,
        status: "pending",
        progress: 0,
      }));
    setMultiZipEntries(entries);
  };

  // ── Multi-ZIP: upload files one by one with XHR progress ──
  const handleMultiZipUpload = async () => {
    if (!selectedSeries || multiZipEntries.length === 0 || !startChapterNum) {
      setMessage({ type: "error", text: "Bitte Serie, Startkapitel und ZIP-Dateien auswählen" });
      return;
    }
    setUploading(true);
    setMessage(null);

    const cookieHeader = document.cookie; // passed automatically via credentials

    for (let i = 0; i < multiZipEntries.length; i++) {
      const entry = multiZipEntries[i];

      setMultiZipEntries(prev => prev.map((e, idx) =>
        idx === i ? { ...e, status: "uploading", progress: 0 } : e
      ));

      await new Promise<void>((resolve) => {
        const fd = new FormData();
        fd.append("file", entry.file);
        fd.append("seriesId", selectedSeries);
        fd.append("chapterNumber", String(entry.chapterNumber));

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE}/upload/zip`);
        xhr.withCredentials = true;

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setMultiZipEntries(prev => prev.map((e, idx) =>
              idx === i ? { ...e, progress: pct } : e
            ));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            setMultiZipEntries(prev => prev.map((e, idx) =>
              idx === i ? { ...e, status: "done", progress: 100, result: `${data.pageCount} Seiten` } : e
            ));
          } else {
            let errMsg = "Fehler";
            try { errMsg = JSON.parse(xhr.responseText).error || errMsg; } catch {}
            setMultiZipEntries(prev => prev.map((e, idx) =>
              idx === i ? { ...e, status: "error", error: errMsg } : e
            ));
          }
          resolve();
        };

        xhr.onerror = () => {
          setMultiZipEntries(prev => prev.map((e, idx) =>
            idx === i ? { ...e, status: "error", error: "Netzwerkfehler" } : e
          ));
          resolve();
        };

        xhr.send(fd);
      });
    }

    setUploading(false);
    loadChapters();
    const succeeded = multiZipEntries.filter(e => e.status === "done").length;
    setMessage({ type: "success", text: `${succeeded}/${multiZipEntries.length} Kapitel hochgeladen` });
  };

  // ── Delete chapter (with file cleanup) ──
  const handleDelete = async (id: string) => {
    if (!confirm(t("areYouSure"))) return;
    setDeleting(id);
    try {
      await apiFetch(`/chapters/${id}`, { method: "DELETE" });
      setChapters(prev => prev.filter(c => c.id !== id));
      setMessage({ type: "success", text: "Kapitel und Dateien gelöscht." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("error") });
    } finally { setDeleting(null); }
  };

  const selectedSeriesName = allSeries.find(s => s.id === selectedSeries)?.title || "";

  const tabBtn = (mode: "zip" | "images" | "multi-zip", icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setUploadMode(mode)}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-xl transition-all${uploadMode === mode ? " btn-on-white" : ""}`}
      style={uploadMode === mode
        ? { background: "#ffffff", color: "#000" }
        : { background: "#1a1a1a", color: "#aaa" }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#f0f0f0" }}>{t("manageChapters")}</h1>

      {/* Series select */}
      <div className="rounded-2xl border p-5 mb-6" style={{ background: "#111", borderColor: "#222" }}>
        <label className="text-sm font-semibold block mb-2" style={{ color: "#ccc" }}>Manhwa auswählen</label>
        <div className="relative">
          <select
            value={selectedSeries}
            onChange={e => setSelectedSeries(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl appearance-none pr-8 focus:outline-none"
            style={{ background: "#1a1a1a", color: "#f0f0f0", border: "1px solid #2a2a2a" }}
          >
            <option value="">-- Serie wählen --</option>
            {allSeries.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#555" }} />
        </div>
      </div>

      {selectedSeries && (
        <>
          {/* Upload panel */}
          <div className="rounded-2xl border p-5 mb-6" style={{ background: "#111", borderColor: "#222" }}>
            <h2 className="font-semibold mb-4" style={{ color: "#f0f0f0" }}>{t("uploadChapter")}</h2>

            {/* Mode tabs */}
            <div className="flex gap-2 mb-5">
              {tabBtn("zip", <Archive size={13} />, "ZIP")}
              {tabBtn("images", <Images size={13} />, "Bilder")}
              {tabBtn("multi-zip", <Package size={13} />, "Multi-ZIP")}
            </div>

            {/* ── ZIP & Images forms ── */}
            {(uploadMode === "zip" || uploadMode === "images") && (
              <form onSubmit={uploadMode === "zip" ? handleZipUpload : handleImagesUpload} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: "#888" }}>Kapitel-Nr. *</label>
                    <input
                      type="number" min="1" required value={chapterNum}
                      onChange={e => setChapterNum(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl focus:outline-none"
                      style={{ background: "#1a1a1a", color: "#f0f0f0", border: "1px solid #2a2a2a" }}
                      placeholder="z.B. 1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: "#888" }}>Titel (optional)</label>
                    <input
                      value={chapterTitle} onChange={e => setChapterTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl focus:outline-none"
                      style={{ background: "#1a1a1a", color: "#f0f0f0", border: "1px solid #2a2a2a" }}
                      placeholder="z.B. Der Anfang"
                    />
                  </div>
                </div>

                {uploadMode === "zip" ? (
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: "#888" }}>ZIP-Datei *</label>
                    <input
                      ref={zipRef} type="file" accept=".zip" required
                      className="w-full text-sm rounded-xl px-3 py-2"
                      style={{ background: "#1a1a1a", color: "#f0f0f0", border: "1px solid #2a2a2a" }}
                    />
                    <p className="text-xs mt-1" style={{ color: "#555" }}>Bilder werden alphabetisch sortiert</p>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: "#888" }}>Bilddateien (JPG/PNG/WebP) *</label>
                    <input
                      ref={imagesRef} type="file" accept="image/*" multiple required
                      className="w-full text-sm rounded-xl px-3 py-2"
                      style={{ background: "#1a1a1a", color: "#f0f0f0", border: "1px solid #2a2a2a" }}
                    />
                    <p className="text-xs mt-1" style={{ color: "#555" }}>Nach Dateiname sortiert. Max. 50 Bilder.</p>
                  </div>
                )}

                {message && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                    style={message.type === "success"
                      ? { background: "#0f2a0f", color: "#66cc66" }
                      : { background: "#2a0f0f", color: "#ff6b6b" }}>
                    {message.text}
                    <button type="button" onClick={() => setMessage(null)} className="ml-auto"><X size={14} /></button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploading || !selectedSeries || !chapterNum}
                  className="btn-on-white w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl disabled:opacity-60 transition-all"
                  style={{ background: "#ffffff", color: "#000" }}
                >
                  {uploading
                    ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Hochladen...</>
                    : <><Upload size={15} /> Kapitel hochladen</>}
                </button>
              </form>
            )}

            {/* ── Multi-ZIP form ── */}
            {uploadMode === "multi-zip" && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl text-xs" style={{ background: "#1a1a1a", color: "#888", border: "1px solid #222" }}>
                  📦 Bis zu 10 ZIP-Dateien gleichzeitig hochladen. Jede ZIP wird automatisch als separates Kapitel angelegt. Dateien werden alphabetisch sortiert.
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: "#888" }}>Start-Kapitel-Nr. *</label>
                  <input
                    type="number" min="1" value={startChapterNum}
                    onChange={e => {
                      setStartChapterNum(e.target.value);
                      const start = parseInt(e.target.value) || 1;
                      setMultiZipEntries(prev => prev.map((entry, i) => ({ ...entry, chapterNumber: start + i })));
                    }}
                    className="w-full px-3 py-2 text-sm rounded-xl focus:outline-none"
                    style={{ background: "#1a1a1a", color: "#f0f0f0", border: "1px solid #2a2a2a" }}
                    placeholder="z.B. 1"
                  />
                  <p className="text-xs mt-1" style={{ color: "#555" }}>Kapitel werden ab dieser Nummer nummeriert (1→2→3…)</p>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: "#888" }}>ZIP-Dateien (max. 10) *</label>
                  <input
                    ref={multiZipRef}
                    type="file"
                    accept=".zip"
                    multiple
                    onChange={handleMultiZipPick}
                    className="w-full text-sm rounded-xl px-3 py-2"
                    style={{ background: "#1a1a1a", color: "#f0f0f0", border: "1px solid #2a2a2a" }}
                  />
                </div>

                {/* Queue list with progress */}
                {multiZipEntries.length > 0 && (
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #2a2a2a" }}>
                    {multiZipEntries.map((entry, i) => (
                      <div key={i} className="px-4 py-3" style={{ borderBottom: i < multiZipEntries.length - 1 ? "1px solid #1a1a1a" : "none" }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div>
                            <span className="text-xs font-semibold" style={{ color: "#f0f0f0" }}>
                              Ch.{entry.chapterNumber}
                            </span>
                            <span className="text-xs ml-2 truncate max-w-[180px] inline-block" style={{ color: "#666" }}>
                              {entry.file.name}
                            </span>
                          </div>
                          <span className="text-xs font-medium" style={{
                            color: entry.status === "done" ? "#66cc66"
                              : entry.status === "error" ? "#ff6b6b"
                              : entry.status === "uploading" ? "#aaa"
                              : "#555"
                          }}>
                            {entry.status === "done" ? `✓ ${entry.result}`
                              : entry.status === "error" ? `✗ ${entry.error}`
                              : entry.status === "uploading" ? `${entry.progress}%`
                              : "Wartend"}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1a1a1a" }}>
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${entry.progress}%`,
                              background: entry.status === "error" ? "#ff6b6b"
                                : entry.status === "done" ? "#66cc66"
                                : "#ffffff",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {message && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                    style={message.type === "success"
                      ? { background: "#0f2a0f", color: "#66cc66" }
                      : { background: "#2a0f0f", color: "#ff6b6b" }}>
                    {message.text}
                    <button onClick={() => setMessage(null)} className="ml-auto"><X size={14} /></button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleMultiZipUpload}
                  disabled={uploading || !selectedSeries || !startChapterNum || multiZipEntries.length === 0}
                  className="btn-on-white w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl disabled:opacity-60 transition-all"
                  style={{ background: "#ffffff", color: "#000" }}
                >
                  {uploading
                    ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Lädt hoch...</>
                    : <><Package size={15} /> {multiZipEntries.length} ZIPs hochladen</>}
                </button>
              </div>
            )}
          </div>

          {/* Chapter list */}
          <div className="rounded-2xl border mb-6" style={{ background: "#111", borderColor: "#222" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #1e1e1e" }}>
              <h2 className="font-semibold" style={{ color: "#f0f0f0" }}>Kapitel — {selectedSeriesName}</h2>
              <span className="text-sm" style={{ color: "#555" }}>{chapters.length} gesamt</span>
            </div>

            {loading ? (
              <div className="p-5 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "#1a1a1a" }} />
                ))}
              </div>
            ) : (
              <div>
                {chapters.map((ch, idx) => (
                  <div
                    key={ch.id}
                    className="flex items-center gap-3 px-5 py-3"
                    style={{ borderBottom: idx < chapters.length - 1 ? "1px solid #1a1a1a" : "none" }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#1a1a1a" }}>
                      <span className="font-bold text-sm" style={{ color: "#f0f0f0" }}>{ch.number}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: "#e0e0e0" }}>{ch.title || `Chapter ${ch.number}`}</p>
                      <p className="text-xs" style={{ color: "#555" }}>
                        {ch.pageCount} Seiten · {ch.views} Aufrufe · {new Date(ch.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(ch.id)}
                      disabled={deleting === ch.id}
                      className="p-2 rounded-lg transition-all disabled:opacity-50"
                      style={{ color: "#555" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#ff6b6b")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#555")}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {chapters.length === 0 && (
                  <div className="py-12 text-center" style={{ color: "#444" }}>
                    <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t("noResults")}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Comments section */}
          <div className="rounded-2xl border" style={{ background: "#111", borderColor: "#222" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #1e1e1e" }}>
              <div className="flex items-center gap-2">
                <MessageSquare size={16} style={{ color: "#60cfff" }} />
                <h2 className="font-semibold" style={{ color: "#f0f0f0" }}>Kommentare</h2>
              </div>
              <span className="text-sm" style={{ color: "#555" }}>{seriesComments.length} gesamt</span>
            </div>

            {commentsLoading ? (
              <div className="p-5 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "#1a1a1a" }} />
                ))}
              </div>
            ) : seriesComments.length === 0 ? (
              <div className="py-12 text-center" style={{ color: "#444" }}>
                <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Keine Kommentare</p>
              </div>
            ) : (
              <div>
                {seriesComments.map((c, idx) => {
                  const hidden = c.isHidden === "true";
                  const busy = commentActionId === c.id;
                  return (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 px-5 py-3"
                      style={{
                        borderBottom: idx < seriesComments.length - 1 ? "1px solid #1a1a1a" : "none",
                        opacity: hidden ? 0.5 : 1,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-xs font-semibold" style={{ color: "#60cfff" }}>{c.username}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#1a1a1a", color: "#555" }}>
                            Ch.{c.chapterNumber ?? "?"}
                          </span>
                          {hidden && (
                            <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "#2a1a00", color: "#f59e0b" }}>
                              مخفی
                            </span>
                          )}
                          <span className="text-xs" style={{ color: "#444" }}>
                            {new Date(c.createdAt).toLocaleDateString("fa-IR")}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: "#ccc" }}>{c.text}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleHideComment(c.id, !hidden)}
                          disabled={busy}
                          title={hidden ? "Einblenden" : "Ausblenden"}
                          className="p-2 rounded-lg transition-all disabled:opacity-50"
                          style={{ color: hidden ? "#66cc66" : "#f59e0b" }}
                        >
                          {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          disabled={busy}
                          title="Löschen"
                          className="p-2 rounded-lg transition-all disabled:opacity-50"
                          style={{ color: "#555" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#ff6b6b")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#555")}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
