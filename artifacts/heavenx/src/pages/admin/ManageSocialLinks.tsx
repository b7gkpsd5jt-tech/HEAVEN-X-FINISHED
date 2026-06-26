import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Share2, X } from "lucide-react";

interface SocialLink {
  id: string; platform: string; url: string; label?: string;
  isEnabled: boolean; sortOrder: number;
}

interface Form { platform: string; url: string; label: string; isEnabled: boolean; sortOrder: string }
const EMPTY_FORM: Form = { platform: "", url: "", label: "", isEnabled: true, sortOrder: "0" };

const PLATFORMS = ["telegram", "instagram", "twitter", "youtube", "discord", "facebook", "whatsapp", "tiktok", "website", "other"];

export default function ManageSocialLinks() {
  const { t } = useLang();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SocialLink | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { setLinks(await apiFetch<SocialLink[]>("/social-links/all")); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (l: SocialLink) => {
    setEditing(l);
    setForm({ platform: l.platform, url: l.url, label: l.label || "", isEnabled: l.isEnabled, sortOrder: String(l.sortOrder) });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder) };
      if (editing) {
        await apiFetch(`/social-links/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/social-links", { method: "POST", body: JSON.stringify(payload) });
      }
      setShowModal(false);
      fetch();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("areYouSure"))) return;
    await apiFetch(`/social-links/${id}`, { method: "DELETE" }).catch(() => {});
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <Share2 size={18} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("socialLinks")}</h1>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">
          <Plus size={16} /> {t("create")}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {loading ? (
          <div className="p-5 space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {links.map(l => (
              <div key={l.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${l.isEnabled ? "bg-blue-50" : "bg-gray-50"}`}>
                  <span className="text-sm">{l.platform === "telegram" ? "✈️" : l.platform === "instagram" ? "📷" : l.platform === "youtube" ? "▶️" : l.platform === "discord" ? "💬" : "🔗"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 capitalize">{l.label || l.platform}</p>
                  <p className="text-xs text-gray-400 truncate">{l.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${l.isEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {l.isEnabled ? t("enabled") : t("disabled")}
                  </span>
                  <button onClick={() => openEdit(l)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(l.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {links.length === 0 && <div className="py-12 text-center text-sm text-gray-400">{t("noResults")}</div>}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? t("edit") : t("create")} Link</h2>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">{t("platform")} *</label>
                <select required value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white">
                  <option value="">-- Select --</option>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">{t("url")} *</label>
                <input required type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">{t("label")}</label>
                <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" placeholder="Display name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">{t("sortOrder")}</label>
                  <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Enabled</label>
                  <select value={String(form.isEnabled)} onChange={e => setForm(f => ({ ...f, isEnabled: e.target.value === "true" }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white">
                    <option value="true">{t("enabled")}</option>
                    <option value="false">{t("disabled")}</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl">{t("cancel")}</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-60">
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
