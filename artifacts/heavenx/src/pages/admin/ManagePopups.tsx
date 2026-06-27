import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Bell, X, Eye, EyeOff, Clock, ToggleLeft, ToggleRight } from "lucide-react";

interface Popup {
  id: string; title: string; content: string;
  buttonText?: string; buttonUrl?: string; closeText?: string;
  isEnabled: boolean; scheduleStart?: string; scheduleEnd?: string;
  displayDurationHours?: number | null;
}

interface Form {
  title: string; content: string; buttonText: string; buttonUrl: string;
  closeText: string; isEnabled: boolean; scheduleStart: string; scheduleEnd: string;
  displayDurationHours: string;
}

const EMPTY: Form = {
  title: "", content: "", buttonText: "", buttonUrl: "",
  closeText: "متوجه شدم", isEnabled: true,
  scheduleStart: "", scheduleEnd: "", displayDurationHours: "",
};

const DURATION_PRESETS = [
  { label: "یک‌بار (همیشه)", value: "" },
  { label: "۶ ساعت", value: "6" },
  { label: "۲۴ ساعت", value: "24" },
  { label: "۴۸ ساعت", value: "48" },
  { label: "۷ روز", value: "168" },
];

function durationLabel(hours?: number | null) {
  if (!hours) return "یک‌بار";
  if (hours < 24) return `${hours} ساعت`;
  const d = Math.round(hours / 24);
  return `${d} روز`;
}

function scheduleStatus(p: Popup): { label: string; color: string } {
  if (!p.isEnabled) return { label: "غیرفعال", color: "#ff6b6b" };
  const now = new Date();
  if (p.scheduleStart && new Date(p.scheduleStart) > now) return { label: "برنامه‌ریزی شده", color: "#f59e0b" };
  if (p.scheduleEnd && new Date(p.scheduleEnd) < now) return { label: "منقضی", color: "#555" };
  return { label: "فعال", color: "#66cc66" };
}

export default function ManagePopups() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { setPopups(await apiFetch<Popup[]>("/popups/all")); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowModal(true); setPreview(false); };
  const openEdit = (p: Popup) => {
    setEditing(p);
    setForm({
      title: p.title, content: p.content,
      buttonText: p.buttonText || "", buttonUrl: p.buttonUrl || "",
      closeText: p.closeText || "متوجه شدم", isEnabled: p.isEnabled,
      scheduleStart: p.scheduleStart ? p.scheduleStart.slice(0, 16) : "",
      scheduleEnd: p.scheduleEnd ? p.scheduleEnd.slice(0, 16) : "",
      displayDurationHours: p.displayDurationHours ? String(p.displayDurationHours) : "",
    });
    setShowModal(true);
    setPreview(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        scheduleStart: form.scheduleStart || null,
        scheduleEnd: form.scheduleEnd || null,
        displayDurationHours: form.displayDurationHours ? Number(form.displayDurationHours) : null,
      };
      if (editing) await apiFetch(`/popups/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await apiFetch("/popups", { method: "POST", body: JSON.stringify(payload) });
      setShowModal(false);
      fetch();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("این اعلان حذف شود؟")) return;
    await apiFetch(`/popups/${id}`, { method: "DELETE" }).catch(() => {});
    setPopups(prev => prev.filter(p => p.id !== id));
  };

  const handleToggle = async (p: Popup) => {
    try {
      await apiFetch(`/popups/${p.id}`, { method: "PATCH", body: JSON.stringify({ isEnabled: !p.isEnabled }) });
      setPopups(prev => prev.map(x => x.id === p.id ? { ...x, isEnabled: !x.isEnabled } : x));
    } catch {}
  };

  const f = (k: keyof Form, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }));

  const inputStyle = {
    background: "#141414", color: "#e0e0e0",
    border: "1px solid #2a2a2a", borderRadius: "12px",
  };
  const labelStyle = { color: "#888", fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#60cfff15", border: "1px solid #60cfff30" }}>
            <Bell size={16} style={{ color: "#60cfff" }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#f0f0f0" }}>اعلان‌ها</h1>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#1a1a1a", color: "#555" }}>
            {popups.length} اعلان
          </span>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all"
          style={{ background: "#60cfff", color: "#000" }}>
          <Plus size={15} /> اعلان جدید
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "#111" }} />
        )) : popups.length === 0 ? (
          <div className="py-16 text-center rounded-2xl" style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", color: "#333" }}>
            <Bell size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">هنوز اعلانی ایجاد نشده</p>
          </div>
        ) : popups.map(p => {
          const status = scheduleStatus(p);
          return (
            <div key={p.id} className="rounded-2xl p-4" style={{ background: "#0d0d0d", border: "1px solid #1e1e1e" }}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-sm" style={{ color: "#e0e0e0" }}>{p.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{ background: status.color + "22", color: status.color }}>
                      {status.label}
                    </span>
                    {p.displayDurationHours ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ background: "#60cfff11", color: "#60cfff88", border: "1px solid #60cfff22" }}>
                        <Clock size={9} /> هر {durationLabel(p.displayDurationHours)}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: "#1a1a1a", color: "#444" }}>
                        یک‌بار
                      </span>
                    )}
                  </div>
                  <p className="text-xs line-clamp-2" style={{ color: "#555" }}>{p.content}</p>
                  {(p.scheduleStart || p.scheduleEnd) && (
                    <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#444" }}>
                      <Clock size={10} />
                      {p.scheduleStart ? new Date(p.scheduleStart).toLocaleString("fa-IR") : "—"}
                      {" → "}
                      {p.scheduleEnd ? new Date(p.scheduleEnd).toLocaleString("fa-IR") : "بدون پایان"}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleToggle(p)} title={p.isEnabled ? "غیرفعال کن" : "فعال کن"}
                    className="p-2 rounded-lg transition-all"
                    style={{ color: p.isEnabled ? "#66cc66" : "#555" }}>
                    {p.isEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => openEdit(p)}
                    className="p-2 rounded-lg transition-all" style={{ color: "#555" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#60cfff")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#555")}>
                    <Edit2 size={14} />
                  </button>
                  {p.id !== "welcome-default" && (
                    <button onClick={() => handleDelete(p.id)}
                      className="p-2 rounded-lg transition-all" style={{ color: "#555" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#ff6b6b")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#555")}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
            <motion.div initial={{ scale: 0.93, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 16 }}
              className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-2xl overflow-hidden"
              style={{ background: "#0d0d0d", border: "1px solid #222" }}>

              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 shrink-0"
                style={{ borderBottom: "1px solid #1a1a1a" }}>
                <div className="flex items-center gap-2">
                  <Bell size={15} style={{ color: "#60cfff" }} />
                  <h2 className="font-bold text-sm" style={{ color: "#e8e8e8" }}>
                    {editing ? "ویرایش اعلان" : "اعلان جدید"}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPreview(!preview)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={preview ? { background: "#60cfff", color: "#000" } : { background: "#1a1a1a", color: "#888" }}>
                    {preview ? <EyeOff size={12} /> : <Eye size={12} />}
                    {preview ? "فرم" : "پیش‌نمایش"}
                  </button>
                  <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg" style={{ color: "#555" }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Preview mode */}
              {preview ? (
                <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.5)" }}>
                  <div className="relative w-full max-w-sm rounded-3xl overflow-hidden"
                    style={{
                      background: "rgba(10,15,25,0.97)",
                      border: "1px solid rgba(0,180,255,0.18)",
                      boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                    }} dir="rtl">
                    <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full opacity-20 pointer-events-none"
                      style={{ background: "radial-gradient(circle, #60cfff 0%, transparent 70%)" }} />
                    <div className="relative z-10 p-7">
                      <h2 className="text-center mb-2"
                        style={{ fontFamily: "'Reem Kufi', sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "#60cfff", textShadow: "0 0 12px rgba(0,180,255,0.85)" }}>
                        {form.title || "عنوان اعلان"}
                      </h2>
                      <div className="mx-auto mb-4 rounded-full" style={{ width: "48px", height: "2px", background: "linear-gradient(90deg, transparent, #60cfff, transparent)" }} />
                      <p className="text-center whitespace-pre-line"
                        style={{ fontFamily: "'Lalezar', cursive", fontSize: "0.88rem", color: "#fff", lineHeight: "2" }}>
                        {form.content || "متن اعلان اینجا نمایش داده می‌شود..."}
                      </p>
                      <div className="mt-5 flex flex-col gap-2">
                        {form.buttonUrl && form.buttonText && (
                          <div className="w-full py-3 rounded-2xl text-center font-semibold text-white text-sm"
                            style={{ fontFamily: "'Lalezar', cursive", background: "linear-gradient(135deg, #0088cc, #229ED9)" }}>
                            {form.buttonText}
                          </div>
                        )}
                        <div className="w-full py-3 rounded-2xl text-center text-white text-sm"
                          style={{ fontFamily: "'Lalezar', cursive", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                          {form.closeText || "متوجه شدم"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Title */}
                  <div>
                    <label style={labelStyle}>عنوان *</label>
                    <input required value={form.title} onChange={e => f("title", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm focus:outline-none"
                      style={inputStyle} dir="rtl" placeholder="به بهشت منهوا خوش آمدید" />
                  </div>

                  {/* Content */}
                  <div>
                    <label style={labelStyle}>متن اصلی *</label>
                    <textarea required rows={6} value={form.content} onChange={e => f("content", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm focus:outline-none resize-none"
                      style={inputStyle} dir="rtl" />
                  </div>

                  {/* Button */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={labelStyle}>متن دکمه (اختیاری)</label>
                      <input value={form.buttonText} onChange={e => f("buttonText", e.target.value)}
                        className="w-full px-3 py-2.5 text-sm focus:outline-none"
                        style={inputStyle} placeholder="کانال تلگرام" />
                    </div>
                    <div>
                      <label style={labelStyle}>لینک دکمه</label>
                      <input type="url" value={form.buttonUrl} onChange={e => f("buttonUrl", e.target.value)}
                        className="w-full px-3 py-2.5 text-sm focus:outline-none"
                        style={inputStyle} placeholder="https://t.me/..." />
                    </div>
                  </div>

                  {/* Close text */}
                  <div>
                    <label style={labelStyle}>متن دکمه بستن</label>
                    <input value={form.closeText} onChange={e => f("closeText", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm focus:outline-none"
                      style={inputStyle} dir="rtl" />
                  </div>

                  {/* Timer / Duration */}
                  <div>
                    <label style={labelStyle} className="flex items-center gap-1.5">
                      <Clock size={12} style={{ color: "#60cfff" }} />
                      تایمر — چند بار برای کاربر نمایش داده شود؟
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {DURATION_PRESETS.map(p => (
                        <button key={p.value} type="button"
                          onClick={() => f("displayDurationHours", p.value)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                          style={form.displayDurationHours === p.value
                            ? { background: "#60cfff", color: "#000" }
                            : { background: "#1a1a1a", color: "#666", border: "1px solid #2a2a2a" }}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="1" value={form.displayDurationHours}
                        onChange={e => f("displayDurationHours", e.target.value)}
                        className="w-28 px-3 py-2 text-sm focus:outline-none"
                        style={inputStyle} placeholder="ساعت" />
                      <span className="text-xs" style={{ color: "#444" }}>
                        {form.displayDurationHours
                          ? `پس از ${durationLabel(Number(form.displayDurationHours))} دوباره نمایش داده می‌شود`
                          : "فقط یک‌بار نمایش داده می‌شود"}
                      </span>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div>
                    <label style={labelStyle} className="flex items-center gap-1.5">
                      <Clock size={12} style={{ color: "#888" }} />
                      زمان‌بندی نمایش (اختیاری)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label style={{ ...labelStyle, color: "#555" }}>از تاریخ</label>
                        <input type="datetime-local" value={form.scheduleStart} onChange={e => f("scheduleStart", e.target.value)}
                          className="w-full px-3 py-2 text-sm focus:outline-none"
                          style={{ ...inputStyle, colorScheme: "dark" }} />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, color: "#555" }}>تا تاریخ</label>
                        <input type="datetime-local" value={form.scheduleEnd} onChange={e => f("scheduleEnd", e.target.value)}
                          className="w-full px-3 py-2 text-sm focus:outline-none"
                          style={{ ...inputStyle, colorScheme: "dark" }} />
                      </div>
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: "#333" }}>اگر خالی بماند، بلافاصله فعال می‌شود</p>
                  </div>

                  {/* Status toggle */}
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl"
                    style={{ background: "#141414", border: "1px solid #222" }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#e0e0e0" }}>وضعیت اعلان</p>
                      <p className="text-xs" style={{ color: "#555" }}>
                        {form.isEnabled ? "فعال — برای کاربران نمایش داده می‌شود" : "غیرفعال — نمایش داده نمی‌شود"}
                      </p>
                    </div>
                    <button type="button" onClick={() => f("isEnabled", !form.isEnabled)}
                      style={{ color: form.isEnabled ? "#66cc66" : "#444" }}>
                      {form.isEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)}
                      className="flex-1 py-2.5 text-sm rounded-xl transition-all"
                      style={{ background: "#141414", color: "#777", border: "1px solid #222" }}>
                      انصراف
                    </button>
                    <button type="submit" disabled={saving}
                      className="flex-1 py-2.5 text-sm font-bold rounded-xl disabled:opacity-50 transition-all"
                      style={{ background: "#60cfff", color: "#000" }}>
                      {saving
                        ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> در حال ذخیره...</span>
                        : editing ? "ذخیره تغییرات" : "ایجاد اعلان"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
