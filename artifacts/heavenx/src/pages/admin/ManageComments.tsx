import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { motion } from "framer-motion";
import { Eye, EyeOff, Trash2, MessageSquare, Search } from "lucide-react";

interface AdminComment {
  id: string;
  chapterId: string;
  userId: string;
  username: string;
  text: string;
  isHidden: string;
  createdAt: string;
  chapterNumber?: number;
  seriesTitle?: string;
}

const D = {
  bg: "#0a0a0a",
  panel: "#111111",
  card: "#141414",
  border: "#222222",
  text: "#e8e8e8",
  muted: "#666666",
  accent: "#60cfff",
  danger: "#ef4444",
  warn: "#f59e0b",
};

export default function ManageComments() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<AdminComment[]>("/admin/all-comments");
      setComments(data);
    } catch { } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComments(); }, []);

  const handleHide = async (id: string) => {
    setActionId(id);
    try {
      const updated = await apiFetch<AdminComment>(`/comments/${id}/hide`, { method: "PATCH" });
      setComments(prev => prev.map(c => c.id === id ? { ...c, isHidden: updated.isHidden } : c));
    } catch { } finally { setActionId(null); }
  };

  const handleUnhide = async (id: string) => {
    setActionId(id);
    try {
      const updated = await apiFetch<AdminComment>(`/comments/${id}/unhide`, { method: "PATCH" });
      setComments(prev => prev.map(c => c.id === id ? { ...c, isHidden: updated.isHidden } : c));
    } catch { } finally { setActionId(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("این کامنت حذف شود؟")) return;
    setActionId(id);
    try {
      await apiFetch(`/comments/${id}`, { method: "DELETE" });
      setComments(prev => prev.filter(c => c.id !== id));
    } catch { } finally { setActionId(null); }
  };

  const filtered = comments.filter(c => {
    const matchSearch =
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.text.toLowerCase().includes(search.toLowerCase()) ||
      (c.seriesTitle || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ? true :
      filter === "visible" ? c.isHidden === "false" :
      c.isHidden === "true";
    return matchSearch && matchFilter;
  });

  const hiddenCount = comments.filter(c => c.isHidden === "true").length;
  const visibleCount = comments.filter(c => c.isHidden === "false").length;

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: D.bg }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(96,207,255,0.1)", border: "1px solid rgba(96,207,255,0.2)" }}>
            <MessageSquare size={18} style={{ color: D.accent }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: D.text }}>Manage Comments</h1>
        </div>
        <p className="text-sm" style={{ color: D.muted, paddingLeft: 52 }}>
          {comments.length} total · {visibleCount} نمایش داده · {hiddenCount} مخفی
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: D.muted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجو در کامنت‌ها، کاربران..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl focus:outline-none"
            style={{ background: D.panel, color: D.text, border: `1px solid ${D.border}` }}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "visible", "hidden"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 text-xs font-semibold rounded-xl transition-all"
              style={filter === f
                ? { background: D.accent, color: "#000" }
                : { background: D.panel, color: D.muted, border: `1px solid ${D.border}` }}
            >
              {f === "all" ? "همه" : f === "visible" ? "نمایش داده" : "مخفی"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: `${D.accent} ${D.accent} ${D.accent} transparent` }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl py-16 text-center text-sm"
          style={{ background: D.panel, border: `1px solid ${D.border}`, color: D.muted }}>
          نتیجه‌ای یافت نشد
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(comment => {
            const isHidden = comment.isHidden === "true";
            const busy = actionId === comment.id;
            return (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl p-4"
                style={{
                  background: D.card,
                  border: `1px solid ${isHidden ? "rgba(239,68,68,0.3)" : D.border}`,
                  opacity: isHidden ? 0.65 : 1,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                      <span className="text-xs font-bold" style={{ color: D.accent }}>{comment.username}</span>
                      {comment.seriesTitle && (
                        <>
                          <span style={{ color: D.muted }}>·</span>
                          <span className="text-xs truncate max-w-[180px]" style={{ color: D.muted }}>
                            {comment.seriesTitle}
                            {comment.chapterNumber !== undefined ? ` — Ch.${comment.chapterNumber}` : ""}
                          </span>
                        </>
                      )}
                      <span style={{ color: D.muted }}>·</span>
                      <span className="text-[11px]" style={{ color: D.muted }}>
                        {new Date(comment.createdAt).toLocaleString("fa-IR")}
                      </span>
                      {isHidden && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(239,68,68,0.15)", color: D.danger, border: "1px solid rgba(239,68,68,0.3)" }}>
                          مخفی
                        </span>
                      )}
                    </div>
                    {/* Text */}
                    <p className="text-sm leading-relaxed break-words" style={{ color: D.text }}>{comment.text}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                    {isHidden ? (
                      <button
                        onClick={() => handleUnhide(comment.id)}
                        disabled={busy}
                        title="نمایش دوباره"
                        className="p-2 rounded-xl transition-colors disabled:opacity-40"
                        style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}
                      >
                        <Eye size={15} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleHide(comment.id)}
                        disabled={busy}
                        title="مخفی کردن"
                        className="p-2 rounded-xl transition-colors disabled:opacity-40"
                        style={{ background: "rgba(245,158,11,0.1)", color: D.warn, border: "1px solid rgba(245,158,11,0.25)" }}
                      >
                        <EyeOff size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={busy}
                      title="حذف"
                      className="p-2 rounded-xl transition-all disabled:opacity-40"
                      style={{ background: "rgba(239,68,68,0.08)", color: D.danger, border: "1px solid rgba(239,68,68,0.15)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
