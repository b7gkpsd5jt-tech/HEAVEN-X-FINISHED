import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Bell, X } from "lucide-react";

interface Popup {
  id: string; title: string; content: string; buttonText?: string;
  buttonUrl?: string; closeText?: string; isEnabled: boolean;
  scheduleStart?: string; scheduleEnd?: string;
}

interface Form {
  title: string; content: string; buttonText: string; buttonUrl: string;
  closeText: string; isEnabled: boolean; scheduleStart: string; scheduleEnd: string;
}

const EMPTY_FORM: Form = { title: "", content: "", buttonText: "", buttonUrl: "", closeText: "بستن", isEnabled: true, scheduleStart: "", scheduleEnd: "" };

export default function ManagePopups() {
  const { t } = useLang();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchPopups = async () => {
    setLoading(true);
    try { setPopups(await apiFetch<Popup[]>("/popups/all")); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchPopups(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (p: Popup) => {
    setEditing(p);
    setForm({ title: p.title, content: p.content, buttonText: p.buttonText || "", buttonUrl: p.buttonUrl || "", closeText: p.closeText || "بستن", isEnabled: p.isEnabled, scheduleStart: p.scheduleStart ? p.scheduleStart.slice(0, 16) : "", scheduleEnd: p.scheduleEnd ? p.scheduleEnd.slice(0, 16) : "" });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, scheduleStart: form.scheduleStart || null, scheduleEnd: form.scheduleEnd || null };
      if (editing) { await apiFetch(`/popups/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) }); }
      else { await apiFetch("/popups", { method: "POST", body: JSON.stringify(payload) }); }
      setShowModal(false);
      fetchPopups();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("areYouSure"))) return;
    await apiFetch(`/popups/${id}`, { method: "DELETE" }).catch(() => {});
    setPopups(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
            <Bell size={18} className="text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("popups")}</h1>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">
          <Plus size={16} /> {t("create")}
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)
        ) : popups.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{p.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${p.isEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {p.isEnabled ? t("enabled") : t("disabled")}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{p.content}</p>
                {(p.scheduleStart || p.scheduleEnd) && (
                  <p className="text-xs text-indigo-500 mt-1">⏰ {p.scheduleStart ? new Date(p.scheduleStart).toLocaleString() : "—"} → {p.scheduleEnd ? new Date(p.scheduleEnd).toLocaleString() : "—"}</p>
                )}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {!loading && popups.length === 0 && <div className="py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">{t("noResults")}</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? t("edit") : t("create")} Popup</h2>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">{t("title")} *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" dir="rtl" placeholder="به بهشت منهوا خوش آمدید" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">{t("content")} *</label>
                <textarea required rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none" dir="rtl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Button Text</label>
                  <input value={form.buttonText} onChange={e => setForm(f => ({ ...f, buttonText: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Button URL</label>
                  <input type="url" value={form.buttonUrl} onChange={e => setForm(f => ({ ...f, buttonUrl: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Close Button Text</label>
                <input value={form.closeText} onChange={e => setForm(f => ({ ...f, closeText: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" dir="rtl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Start Date</label>
                  <input type="datetime-local" value={form.scheduleStart} onChange={e => setForm(f => ({ ...f, scheduleStart: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">End Date</label>
                  <input type="datetime-local" value={form.scheduleEnd} onChange={e => setForm(f => ({ ...f, scheduleEnd: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
                <select value={String(form.isEnabled)} onChange={e => setForm(f => ({ ...f, isEnabled: e.target.value === "true" }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white">
                  <option value="true">{t("enabled")}</option>
                  <option value="false">{t("disabled")}</option>
                </select>
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
