import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Smartphone, Shield, User, X } from "lucide-react";

interface User {
  id: string; username: string; email?: string; role: string;
  isActive: boolean; language: string; deviceLockMode: string;
  deviceId?: string; createdAt: string; lastLoginAt?: string;
}

interface Form {
  username: string; password: string; email: string;
  role: string; language: string; deviceLockMode: string; isActive: boolean;
}

const EMPTY_FORM: Form = { username: "", password: "", email: "", role: "USER", language: "DE", deviceLockMode: "ONE", isActive: true };

export default function ManageUsers() {
  const { t } = useLang();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try { setUsers(await apiFetch<User[]>("/users")); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ username: u.username, password: "", email: u.email || "", role: u.role, language: u.language, deviceLockMode: u.deviceLockMode, isActive: u.isActive });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (!payload.password) delete payload.password;
      if (!payload.email) delete payload.email;

      if (editing) {
        await apiFetch(`/users/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/users", { method: "POST", body: JSON.stringify(payload) });
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || t("error"));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("areYouSure"))) return;
    try {
      await apiFetch(`/users/${id}`, { method: "DELETE" });
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch {}
  };

  const resetDevice = async (id: string) => {
    try {
      await apiFetch(`/users/${id}/reset-device`, { method: "POST" });
      alert(t("success"));
    } catch {}
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("manageUsers")}</h1>
          <p className="text-sm text-gray-500">{users.length} users</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm">
          <Plus size={16} /> {t("create")}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${u.role === "ADMIN" ? "bg-indigo-100" : "bg-gray-100"}`}>
                  {u.role === "ADMIN" ? <Shield size={16} className="text-indigo-600" /> : <User size={16} className="text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{u.username}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {u.isActive ? t("active") : t("inactive")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{u.email || "—"} · {u.language} · {u.deviceLockMode}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => resetDevice(u.id)} title={t("resetDevice")} className="p-1.5 text-gray-400 hover:text-violet-500 hover:bg-violet-50 rounded-lg transition-all">
                    <Smartphone size={14} />
                  </button>
                  <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(u.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && <div className="py-12 text-center text-sm text-gray-400">{t("noResults")}</div>}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? t("edit") : t("create")} User</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">{t("username")} *</label>
                <input required value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} disabled={!!editing} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl disabled:bg-gray-50" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">{t("password")} {!editing && "*"}</label>
                <input type="password" required={!editing} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" placeholder={editing ? "Leave blank to keep current" : ""} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white">
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">{t("language")}</label>
                  <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white">
                    <option value="DE">DE</option>
                    <option value="EN">EN</option>
                    <option value="FA">FA</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">{t("deviceLock")}</label>
                  <select value={form.deviceLockMode} onChange={e => setForm(f => ({ ...f, deviceLockMode: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white">
                    <option value="ONE">ONE (1 device)</option>
                    <option value="TWO">TWO (2 devices)</option>
                    <option value="UNLIMITED">UNLIMITED</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
                  <select value={String(form.isActive)} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === "true" }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white">
                    <option value="true">{t("active")}</option>
                    <option value="false">{t("inactive")}</option>
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
