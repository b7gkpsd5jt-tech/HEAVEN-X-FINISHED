import { useEffect, useState, useRef } from "react";
import { apiFetch, apiUpload, API_BASE } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Upload, X, Search, BookOpen, Image } from "lucide-react";
import { Link } from "wouter";

interface Series {
  id: string; title: string; altTitle?: string; description?: string;
  cover?: string; author?: string; artist?: string; status: string;
  views: number; genres?: { genre: { name: string } }[];
  _count?: { chapters: number };
}

interface Form {
  title: string; altTitle: string; description: string; author: string;
  artist: string; status: string; genres: string;
}

const EMPTY_FORM: Form = { title: "", altTitle: "", description: "", author: "", artist: "", status: "ONGOING", genres: "" };

export default function ManageSeries() {
  const { t } = useLang();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Series | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchSeries = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Series[] }>(`/series?limit=100`);
      setSeries(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchSeries(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setCoverFile(null); setCoverPreview(""); setShowModal(true); };
  const openEdit = (s: Series) => {
    setEditing(s);
    setForm({ title: s.title, altTitle: s.altTitle || "", description: s.description || "", author: s.author || "", artist: s.artist || "", status: s.status, genres: s.genres?.map(g => g.genre.name).join(", ") || "" });
    setCoverFile(null);
    const cv = s.cover ? (s.cover.startsWith("/uploads") ? `${API_BASE.replace("/api", "")}${s.cover}` : s.cover) : "";
    setCoverPreview(cv);
    setShowModal(true);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        altTitle: form.altTitle || undefined,
        description: form.description || undefined,
        author: form.author || undefined,
        artist: form.artist || undefined,
        status: form.status,
        genres: form.genres ? form.genres.split(",").map(g => g.trim()).filter(Boolean) : [],
      };

      let saved: Series;
      if (editing) {
        saved = await apiFetch<Series>(`/series/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        saved = await apiFetch<Series>("/series", { method: "POST", body: JSON.stringify(payload) });
      }

      // Upload cover if selected
      if (coverFile) {
        const fd = new FormData();
        fd.append("cover", coverFile);
        fd.append("seriesId", saved.id);
        await apiUpload("/upload/cover", fd);
      }

      setShowModal(false);
      fetchSeries();
    } catch (err: any) {
      alert(err.message || t("error"));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("areYouSure"))) return;
    setDeleting(id);
    try {
      await apiFetch(`/series/${id}`, { method: "DELETE" });
      setSeries(prev => prev.filter(s => s.id !== id));
    } catch {} finally { setDeleting(null); }
  };

  const filtered = series.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("manageSeries")}</h1>
          <p className="text-sm text-gray-500">{series.length} series total</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all">
          <Plus size={16} /> {t("addSeries")}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("search")} className="w-full max-w-sm pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="animate-pulse bg-gray-200 rounded-2xl h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => {
            const coverUrl = s.cover ? (s.cover.startsWith("/uploads") ? `${API_BASE.replace("/api", "")}${s.cover}` : s.cover) : null;
            return (
              <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 flex gap-3">
                <div className="w-14 h-18 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {coverUrl ? <img src={coverUrl} alt={s.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen size={20} className="text-gray-300" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{s.title}</h3>
                  {s.altTitle && <p className="text-xs text-gray-400 truncate">{s.altTitle}</p>}
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{s._count?.chapters || 0} ch</span>
                    <span>·</span>
                    <span className={`font-medium ${s.status === "ONGOING" ? "text-green-600" : s.status === "COMPLETED" ? "text-blue-600" : "text-gray-500"}`}>{s.status}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Link href={`/admin/chapters?seriesId=${s.id}`}>
                      <button className="flex items-center gap-1 px-2.5 py-1 text-xs bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg transition-all">
                        <Upload size={11} /> Chapters
                      </button>
                    </Link>
                    <button onClick={() => openEdit(s)} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-all">
                      <Edit size={11} /> {t("edit")}
                    </button>
                    <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all disabled:opacity-50">
                      <Trash2 size={11} /> {t("delete")}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
              {t("noResults")}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? t("edit") : t("addSeries")}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Cover */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Cover Image</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-28 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    {coverPreview ? <img src={coverPreview} className="w-full h-full object-cover" alt="cover" /> : <div className="w-full h-full flex items-center justify-center"><Image size={20} className="text-gray-300" /></div>}
                  </div>
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                    <button type="button" onClick={() => fileRef.current?.click()} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                      {t("uploadCover")}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">{t("title")} *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Alt Title</label>
                <input value={form.altTitle} onChange={e => setForm(f => ({ ...f, altTitle: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">{t("author")}</label>
                  <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">{t("artist")}</label>
                  <input value={form.artist} onChange={e => setForm(f => ({ ...f, artist: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">{t("status")}</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                  {["ONGOING", "COMPLETED", "HIATUS", "DROPPED"].map(s => (
                    <option key={s} value={s}>{t(s.toLowerCase())}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">{t("genres")} (comma-separated)</label>
                <input value={form.genres} onChange={e => setForm(f => ({ ...f, genres: e.target.value }))} placeholder="Action, Romance, Fantasy" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">{t("description")}</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                  {t("cancel")}
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-60">
                  {saving ? t("loading") : editing ? t("update") : t("create")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
