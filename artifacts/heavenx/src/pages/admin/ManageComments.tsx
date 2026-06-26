import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Trash2, Eye, EyeOff, MessageSquare } from "lucide-react";

interface Comment {
  id: string; chapterId: string; userId: string; username: string;
  text: string; isHidden: string; createdAt: string;
}

export default function ManageComments() {
  const { t } = useLang();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Comment[]>("/admin/all-comments").then(setComments).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t("areYouSure"))) return;
    setDeleting(id);
    try {
      await apiFetch(`/comments/${id}`, { method: "DELETE" });
      setComments(prev => prev.filter(c => c.id !== id));
    } catch {} finally { setDeleting(null); }
  };

  const handleHide = async (id: string) => {
    try {
      await apiFetch(`/comments/${id}/hide`, { method: "PATCH" });
      setComments(prev => prev.map(c => c.id === id ? { ...c, isHidden: "true" } : c));
    } catch {}
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
          <MessageSquare size={18} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("manageComments")}</h1>
          <p className="text-sm text-gray-500">{comments.length} total</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {comments.map(c => (
              <div key={c.id} className={`flex gap-3 px-5 py-4 ${c.isHidden === "true" ? "opacity-50 bg-gray-50" : ""}`}>
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 font-bold text-xs">{c.username.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-indigo-600">{c.username}</span>
                    {c.isHidden === "true" && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">Hidden</span>}
                    <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 break-words">{c.text}</p>
                  <p className="text-[11px] text-gray-400 mt-1">Chapter: {c.chapterId.slice(0, 8)}…</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {c.isHidden !== "true" && (
                    <button onClick={() => handleHide(c.id)} title="Hide comment" className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg">
                      <EyeOff size={14} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {comments.length === 0 && <div className="py-12 text-center text-sm text-gray-400">{t("noResults")}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
