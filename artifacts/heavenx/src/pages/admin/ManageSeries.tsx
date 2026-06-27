import { useEffect, useState, useRef } from "react";
import { apiFetch, apiUpload, API_BASE } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Upload, X, Search, BookOpen, Image, Type } from "lucide-react";
import { Link } from "wouter";

interface Series {
  id: string; title: string; altTitle?: string; description?: string;
  cover?: string; author?: string; artist?: string; status: string;
  titleFont?: string; views: number;
  genres?: { genre: { name: string } }[];
  _count?: { chapters: number };
}

interface Form {
  title: string; altTitle: string; description: string;
  author: string; artist: string; status: string;
  genres: string; titleFont: string; authorFont: string; descriptionFont: string;
}

const EMPTY_FORM: Form = {
  title: "", altTitle: "", description: "",
  author: "", artist: "", status: "ONGOING",
  genres: "", titleFont: "", authorFont: "", descriptionFont: "",
};

const FA_FONTS = [
  { label: "پیش‌فرض (بدون فونت)", value: "" },
  { label: "Vazirmatn", value: "Vazirmatn" },
  { label: "Lalezar", value: "Lalezar" },
  { label: "Reem Kufi", value: "Reem Kufi" },
  { label: "Markazi Text", value: "Markazi Text" },
  { label: "Noto Nastaliq Urdu", value: "Noto Nastaliq Urdu" },
  { label: "Amiri", value: "Amiri" },
  { label: "Scheherazade New", value: "Scheherazade New" },
  { label: "Inter (لاتین)", value: "Inter" },
  { label: "Exo 2 (لاتین)", value: "Exo 2" },
];

const D = {
  bg: "#0a0a0a",
  panel: "#111111",
  card: "#141414",
  border: "#222222",
  input: "#1a1a1a",
  text: "#e8e8e8",
  muted: "#888888",
  accent: "#60cfff",
  hover: "#1c1c1c",
};

const inputCls = {
  background: D.input,
  color: D.text,
  border: `1px solid ${D.border}`,
  borderRadius: 12,
  padding: "8px 12px",
  fontSize: 14,
  width: "100%",
  outline: "none",
};

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
  const [error, setError] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchSeries = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Series[] }>(`/series?limit=200`);
      setSeries(res.data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchSeries(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setCoverFile(null);
    setCoverPreview("");
    setError("");
    setShowModal(true);
  };

  const openEdit = (s: Series) => {
    setEditing(s);
    setForm({
      title: s.title,
      altTitle: s.altTitle || "",
      description: s.description || "",
      author: s.author || "",
      artist: s.artist || "",
      status: s.status,
      genres: s.genres?.map(g => g.genre.name).join(", ") || "",
      titleFont: s.titleFont || "",
      authorFont: (s as any).authorFont || "",
      descriptionFont: (s as any).descriptionFont || "",
    });
    setCoverFile(null);
    const cv = s.cover ? (s.cover.startsWith("/uploads") ? `${API_BASE.replace("/api", "")}${s.cover}` : s.cover) : "";
    setCoverPreview(cv);
    setError("");
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
    if (!form.title.trim()) { setError("عنوان الزامی است"); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title.trim(),
        altTitle: form.altTitle.trim() || undefined,
        description: form.description.trim() || undefined,
        author: form.author.trim() || undefined,
        artist: form.artist.trim() || undefined,
        status: form.status,
        genres: form.genres ? form.genres.split(",").map(g => g.trim()).filter(Boolean) : [],
        titleFont: form.titleFont || null,
        authorFont: form.authorFont || null,
        descriptionFont: form.descriptionFont || null,
      };

      let saved: Series;
      if (editing) {
        saved = await apiFetch<Series>(`/series/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        saved = await apiFetch<Series>("/series", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (coverFile) {
        const fd = new FormData();
        fd.append("cover", coverFile);
        fd.append("seriesId", saved.id);
        await apiUpload("/upload/cover", fd);
      }

      setShowModal(false);
      fetchSeries();
    } catch (err: any) {
      setError(err.message || t("error"));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("areYouSure"))) return;
    setDeleting(id);
    try {
      await apiFetch(`/series/${id}`, { method: "DELETE" });
      setSeries(prev => prev.filter(s => s.id !== id));
    } catch { } finally { setDeleting(null); }
  };

  const statusStyle = (status: string) =>
    status === "ONGOING"   ? { background: "rgba(34,197,94,0.15)",  color: "#22c55e",  border: "1px solid rgba(34,197,94,0.3)" } :
    status === "COMPLETED" ? { background: "rgba(234,179,8,0.15)",  color: "#eab308",  border: "1px solid rgba(234,179,8,0.3)" } :
    status === "HIATUS"    ? { background: "rgba(251,146,60,0.15)", color: "#fb923c",  border: "1px solid rgba(251,146,60,0.3)" } :
    status === "DROPPED"   ? { background: "rgba(239,68,68,0.15)",  color: "#ef4444",  border: "1px solid rgba(239,68,68,0.3)" } :
    { color: "#aaa" };

  const filtered = series.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label style={{ fontSize: 12, fontWeight: 600, color: D.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {children}
    </label>
  );

  return (
    <div className="p-6" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: D.text }}>{t("manageSeries")}</h1>
          <p className="text-sm mt-0.5" style={{ color: D.muted }}>{series.length} series total</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all"
          style={{ background: D.accent, color: "#000" }}
        >
          <Plus size={16} /> {t("addSeries")}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: D.muted }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t("search")}
          style={{ ...inputCls, paddingLeft: 36 }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl h-24" style={{ background: D.card }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => {
            const coverUrl = s.cover
              ? (s.cover.startsWith("/uploads") ? `${API_BASE.replace("/api", "")}${s.cover}` : s.cover)
              : null;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl p-4 flex gap-3 transition-colors"
                style={{ background: D.card, border: `1px solid ${D.border}` }}
              >
                <div
                  className="w-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                  style={{ height: 72, background: D.input, boxShadow: "0 0 12px rgba(0,180,255,0.25)" }}
                >
                  {coverUrl
                    ? <img src={coverUrl} alt={s.title} className="w-full h-full object-cover" />
                    : <BookOpen size={18} style={{ color: D.muted }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-semibold text-sm truncate"
                    style={{ color: D.text, fontFamily: s.titleFont || undefined }}
                  >
                    {s.title}
                  </h3>
                  {s.altTitle && <p className="text-xs truncate" style={{ color: D.muted }}>{s.altTitle}</p>}
                  <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: D.muted }}>
                    <span>{s._count?.chapters || 0} ch</span>
                    <span>·</span>
                    <span className="font-medium px-2 py-0.5 rounded-full" style={statusStyle(s.status)}>
                      {s.status}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Link href={`/admin/chapters?seriesId=${s.id}`}>
                      <button
                        className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-all"
                        style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}
                      >
                        <Upload size={11} /> Chapters
                      </button>
                    </Link>
                    <button
                      onClick={() => openEdit(s)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-all"
                      style={{ background: "rgba(96,207,255,0.12)", color: D.accent, border: `1px solid rgba(96,207,255,0.2)` }}
                    >
                      <Edit size={11} /> {t("edit")}
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deleting === s.id}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-all disabled:opacity-50"
                      style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
                    >
                      <Trash2 size={11} /> {t("delete")}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16" style={{ color: D.muted }}>
              <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
              {t("noResults")}
            </div>
          )}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden"
            style={{ background: D.panel, border: `1px solid ${D.border}`, maxHeight: "92vh", overflowY: "auto" }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
              style={{ background: D.panel, borderBottom: `1px solid ${D.border}` }}
            >
              <h2 className="font-bold text-base" style={{ color: D.text }}>
                {editing ? `✏️ ${t("edit")}` : `➕ ${t("addSeries")}`}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: D.muted }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Error */}
              {error && (
                <div className="px-3 py-2 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {error}
                </div>
              )}

              {/* Cover */}
              <div>
                <Label>Cover</Label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-28 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                    style={{ background: D.input, border: `1px solid ${D.border}`, boxShadow: "0 0 16px rgba(0,180,255,0.2)" }}
                  >
                    {coverPreview
                      ? <img src={coverPreview} className="w-full h-full object-cover" alt="cover" />
                      : <Image size={22} style={{ color: D.muted }} />}
                  </div>
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="px-4 py-2 text-sm font-medium rounded-xl transition-all"
                      style={{ background: D.input, color: D.text, border: `1px solid ${D.border}` }}
                    >
                      📁 {t("uploadCover")}
                    </button>
                    {coverFile && (
                      <p className="text-xs mt-1.5 truncate max-w-[160px]" style={{ color: D.accent }}>
                        ✓ {coverFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <Label>{t("title")} *</Label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="عنوان Manhwa..."
                  style={{ ...inputCls, fontFamily: form.titleFont || undefined }}
                />
              </div>

              {/* Alt Title */}
              <div>
                <Label>Alt Title</Label>
                <input
                  value={form.altTitle}
                  onChange={e => setForm(f => ({ ...f, altTitle: e.target.value }))}
                  style={inputCls}
                />
              </div>

              {/* Author + Artist */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t("author")}</Label>
                  <input
                    value={form.author}
                    onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                    style={{ ...inputCls, fontFamily: form.authorFont || undefined }}
                  />
                </div>
                <div>
                  <Label>{t("artist")}</Label>
                  <input
                    value={form.artist}
                    onChange={e => setForm(f => ({ ...f, artist: e.target.value }))}
                    style={inputCls}
                  />
                </div>
              </div>

              {/* Author Font */}
              <div>
                <Label>
                  <span className="flex items-center gap-1.5">
                    <Type size={11} style={{ display: "inline" }} />
                    فونت نویسنده (Author Font)
                  </span>
                </Label>
                <select
                  value={form.authorFont}
                  onChange={e => setForm(f => ({ ...f, authorFont: e.target.value }))}
                  style={{ ...inputCls, cursor: "pointer", fontFamily: form.authorFont || undefined }}
                >
                  {FA_FONTS.map(f => (
                    <option key={f.value} value={f.value} style={{ background: D.panel, fontFamily: f.value || undefined }}>
                      {f.label}
                    </option>
                  ))}
                </select>
                {form.authorFont && form.author && (
                  <p className="mt-2 text-sm px-3 py-1.5 rounded-lg" style={{ background: D.input, color: D.text, fontFamily: form.authorFont, border: `1px solid ${D.border}` }}>
                    {form.author}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <Label>{t("status")}</Label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  style={{ ...inputCls, cursor: "pointer" }}
                >
                  {["ONGOING", "COMPLETED", "HIATUS", "DROPPED"].map(s => (
                    <option key={s} value={s} style={{ background: D.panel }}>
                      {t(s.toLowerCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* Genres */}
              <div>
                <Label>{t("genres")} (comma-separated)</Label>
                <input
                  value={form.genres}
                  onChange={e => setForm(f => ({ ...f, genres: e.target.value }))}
                  placeholder="Action, Fantasy, Romance"
                  style={inputCls}
                />
              </div>

              {/* Title Font */}
              <div>
                <Label>
                  <span className="flex items-center gap-1.5">
                    <Type size={11} style={{ display: "inline" }} />
                    فونت عنوان (اختیاری)
                  </span>
                </Label>
                <select
                  value={form.titleFont}
                  onChange={e => setForm(f => ({ ...f, titleFont: e.target.value }))}
                  style={{ ...inputCls, cursor: "pointer", fontFamily: form.titleFont || undefined }}
                >
                  {FA_FONTS.map(f => (
                    <option key={f.value} value={f.value} style={{ background: D.panel, fontFamily: f.value || undefined }}>
                      {f.label}
                    </option>
                  ))}
                </select>
                {form.titleFont && (
                  <p
                    className="mt-2 text-sm px-3 py-1.5 rounded-lg"
                    style={{ background: D.input, color: D.text, fontFamily: form.titleFont, border: `1px solid ${D.border}` }}
                  >
                    {form.title || "پیش‌نمایش عنوان"}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label>{t("description")}</Label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                  style={{ ...inputCls, resize: "none", lineHeight: 1.6, fontFamily: form.descriptionFont || undefined }}
                />
              </div>

              {/* Description Font */}
              <div>
                <Label>
                  <span className="flex items-center gap-1.5">
                    <Type size={11} style={{ display: "inline" }} />
                    فونت توضیحات (Description Font)
                  </span>
                </Label>
                <select
                  value={form.descriptionFont}
                  onChange={e => setForm(f => ({ ...f, descriptionFont: e.target.value }))}
                  style={{ ...inputCls, cursor: "pointer", fontFamily: form.descriptionFont || undefined }}
                >
                  {FA_FONTS.map(f => (
                    <option key={f.value} value={f.value} style={{ background: D.panel, fontFamily: f.value || undefined }}>
                      {f.label}
                    </option>
                  ))}
                </select>
                {form.descriptionFont && form.description && (
                  <p className="mt-2 text-sm px-3 py-1.5 rounded-lg" style={{ background: D.input, color: D.text, fontFamily: form.descriptionFont, border: `1px solid ${D.border}`, lineHeight: 1.7, direction: "rtl" }}>
                    {form.description.slice(0, 100)}{form.description.length > 100 ? "…" : ""}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-all"
                  style={{ background: D.input, color: D.muted, border: `1px solid ${D.border}` }}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all disabled:opacity-60"
                  style={{ background: D.accent, color: "#000" }}
                >
                  {saving ? "..." : editing ? `✓ ${t("update")}` : `✓ ${t("create")}`}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
