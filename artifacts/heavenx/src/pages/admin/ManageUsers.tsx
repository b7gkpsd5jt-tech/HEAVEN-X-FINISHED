import { useEffect, useState, useRef, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, Smartphone, Shield, User, X,
  Users, Upload, Download, Search, ChevronDown, ToggleLeft, ToggleRight,
  Zap, FileText, CheckCircle, AlertCircle,
} from "lucide-react";

interface UserRow {
  id: string; username: string; email?: string; role: string;
  isActive: boolean; language: string; deviceLockMode: string;
  deviceId?: string; createdAt: string; lastLoginAt?: string;
}
interface Form {
  username: string; password: string; email: string;
  role: string; language: string; deviceLockMode: string; isActive: boolean;
}
interface BulkResult { total: number; created: number; skipped: number; errors: string[] }

const EMPTY_FORM: Form = {
  username: "", password: "", email: "",
  role: "USER", language: "DE", deviceLockMode: "ONE", isActive: true,
};

const inp = {
  className: "w-full px-3 py-2.5 text-sm focus:outline-none rounded-xl",
  style: { background: "#141414", color: "#e0e0e0", border: "1px solid #2a2a2a" } as React.CSSProperties,
};
const lbl = { style: { color: "#888", fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" } as React.CSSProperties };
const sel = {
  className: "w-full px-3 py-2.5 text-sm focus:outline-none rounded-xl appearance-none",
  style: { background: "#141414", color: "#e0e0e0", border: "1px solid #2a2a2a" } as React.CSSProperties,
};

function pad(n: number, total: number) {
  return String(n).padStart(String(total).length, "0");
}

export default function ManageUsers() {
  const { t } = useLang();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"list" | "bulk">("list");
  const [search, setSearch] = useState("");

  // Single create/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Bulk import state
  const [bulkMode, setBulkMode] = useState<"auto" | "csv">("auto");
  const [prefix, setPrefix] = useState("");
  const [startNum, setStartNum] = useState("1");
  const [count, setCount] = useState("100");
  const [bulkPassword, setBulkPassword] = useState("");
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try { setUsers(await apiFetch<UserRow[]>("/users")); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchUsers(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? users.filter(u => u.username.toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)) : users;
  }, [users, search]);

  const visibleUsers = filtered.slice(0, 200);

  // Single user handlers
  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (u: UserRow) => {
    setEditing(u);
    setForm({ username: u.username, password: "", email: u.email || "", role: u.role, language: u.language, deviceLockMode: u.deviceLockMode, isActive: u.isActive });
    setShowModal(true);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload: any = { ...form };
      if (!payload.password) delete payload.password;
      if (!payload.email) delete payload.email;
      if (editing) await apiFetch(`/users/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await apiFetch("/users", { method: "POST", body: JSON.stringify(payload) });
      setShowModal(false); fetchUsers();
    } catch (err: any) { alert(err.message || t("error")); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    if (!confirm(t("areYouSure"))) return;
    await apiFetch(`/users/${id}`, { method: "DELETE" }).catch(() => {});
    setUsers(prev => prev.filter(u => u.id !== id));
  };
  const resetDevice = async (id: string) => {
    await apiFetch(`/users/${id}/reset-device`, { method: "POST" }).catch(() => {});
  };

  // Generate preview list
  const autoPreview = useMemo(() => {
    const n = Math.min(parseInt(count) || 0, 10000);
    const s = parseInt(startNum) || 1;
    if (!prefix || n === 0) return [];
    const arr = [];
    for (let i = 0; i < Math.min(n, 5); i++) arr.push(`${prefix}${pad(s + i, s + n - 1)}`);
    if (n > 5) arr.push("...");
    if (n > 5) arr.push(`${prefix}${pad(s + n - 1, s + n - 1)}`);
    return arr;
  }, [prefix, startNum, count]);

  // CSV parse
  const csvUsers = useMemo(() => {
    if (!csvText.trim()) return [];
    return csvText.trim().split("\n").map(line => {
      const [username, password] = line.split(",").map(s => s.trim());
      return { username, password };
    }).filter(u => u.username && u.password);
  }, [csvText]);

  // Bulk import — sends in batches of 5000
  const handleBulkImport = async () => {
    let allUsers: Array<{ username: string; password: string }> = [];

    if (bulkMode === "auto") {
      const n = parseInt(count) || 0;
      const s = parseInt(startNum) || 1;
      if (!prefix || !bulkPassword || n === 0) { alert("Präfix, Passwort und Anzahl eingeben"); return; }
      for (let i = 0; i < n; i++) {
        allUsers.push({ username: `${prefix}${pad(s + i, s + n - 1)}`, password: bulkPassword });
      }
    } else {
      if (csvUsers.length === 0) { alert("Keine gültigen Zeilen in der CSV"); return; }
      allUsers = csvUsers;
    }

    const BATCH = 5000;
    setImporting(true);
    setImportTotal(allUsers.length);
    setImportProgress(0);
    setBulkResult(null);

    let totalCreated = 0, totalSkipped = 0;
    const allErrors: string[] = [];

    for (let i = 0; i < allUsers.length; i += BATCH) {
      const chunk = allUsers.slice(i, i + BATCH);
      try {
        const res = await apiFetch<BulkResult>("/users/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ users: chunk }),
        });
        totalCreated += res.created;
        totalSkipped += res.skipped;
        allErrors.push(...res.errors);
      } catch (err: any) {
        allErrors.push(err.message);
      }
      setImportProgress(Math.min(i + BATCH, allUsers.length));
    }

    setBulkResult({ total: allUsers.length, created: totalCreated, skipped: totalSkipped, errors: allErrors });
    setImporting(false);
    fetchUsers();
  };

  // Download result CSV
  const downloadResult = () => {
    if (bulkMode !== "auto" && csvUsers.length === 0) return;
    let rows: string[] = ["username,password,status"];
    if (bulkMode === "auto") {
      const n = parseInt(count) || 0;
      const s = parseInt(startNum) || 1;
      for (let i = 0; i < n; i++) {
        rows.push(`${prefix}${pad(s + i, s + n - 1)},${bulkPassword},erstellt`);
      }
    } else {
      csvUsers.forEach(u => rows.push(`${u.username},${u.password},erstellt`));
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `users_${Date.now()}.csv`; a.click();
  };

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCsvText(ev.target?.result as string || "");
    reader.readAsText(file);
  };

  const progressPct = importTotal > 0 ? Math.round((importProgress / importTotal) * 100) : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#60cfff15", border: "1px solid #60cfff30" }}>
            <Users size={16} style={{ color: "#60cfff" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#f0f0f0" }}>{t("manageUsers")}</h1>
            <p className="text-xs" style={{ color: "#444" }}>{users.length.toLocaleString()} کاربر</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl"
          style={{ background: "#60cfff", color: "#000" }}>
          <Plus size={15} /> کاربر جدید
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: "#0d0d0d", border: "1px solid #1e1e1e" }}>
        {([["list", <Users size={14} />, "لیست کاربران"], ["bulk", <Zap size={14} />, "ایجاد انبوه"]] as const).map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key as any)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition-all"
            style={tab === key ? { background: "#60cfff", color: "#000" } : { color: "#555" }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── USER LIST TAB ── */}
      {tab === "list" && (
        <>
          {/* Search */}
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#444" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="جستجو در نام کاربری یا ایمیل..."
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl focus:outline-none"
              style={{ background: "#0d0d0d", color: "#e0e0e0", border: "1px solid #1e1e1e" }} />
          </div>

          {search && (
            <p className="text-xs mb-2" style={{ color: "#444" }}>
              {filtered.length.toLocaleString()} نتیجه — نمایش {Math.min(filtered.length, 200).toLocaleString()}
            </p>
          )}

          <div className="rounded-2xl overflow-hidden" style={{ background: "#0d0d0d", border: "1px solid #1e1e1e" }}>
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-13 rounded-xl animate-pulse" style={{ background: "#141414" }} />)}
              </div>
            ) : (
              <div>
                {visibleUsers.map((u, idx) => (
                  <div key={u.id} className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: idx < visibleUsers.length - 1 ? "1px solid #141414" : "none" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: u.role === "ADMIN" ? "#60cfff15" : "#1a1a1a" }}>
                      {u.role === "ADMIN"
                        ? <Shield size={14} style={{ color: "#60cfff" }} />
                        : <User size={14} style={{ color: "#555" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold" style={{ color: "#e0e0e0" }}>{u.username}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                          style={u.isActive
                            ? { background: "#0f2a0f", color: "#66cc66" }
                            : { background: "#2a0f0f", color: "#ff6b6b" }}>
                          {u.isActive ? "فعال" : "غیرفعال"}
                        </span>
                      </div>
                      <p className="text-xs truncate" style={{ color: "#444" }}>
                        {u.email || "—"} · {u.language} · {u.deviceLockMode}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => resetDevice(u.id)} title={t("resetDevice")}
                        className="p-1.5 rounded-lg transition-all" style={{ color: "#555" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#a78bfa")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#555")}>
                        <Smartphone size={13} />
                      </button>
                      <button onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg transition-all" style={{ color: "#555" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#60cfff")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#555")}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDelete(u.id)}
                        className="p-1.5 rounded-lg transition-all" style={{ color: "#555" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#ff6b6b")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#555")}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="py-12 text-center" style={{ color: "#333" }}>
                    <User size={28} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">{t("noResults")}</p>
                  </div>
                )}
                {filtered.length > 200 && (
                  <div className="py-3 text-center text-xs" style={{ color: "#444", borderTop: "1px solid #141414" }}>
                    {(filtered.length - 200).toLocaleString()} کاربر بیشتر — جستجو کن تا نتایج کمتر شوند
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── BULK IMPORT TAB ── */}
      {tab === "bulk" && (
        <div className="space-y-4">
          {/* Sub-mode tabs */}
          <div className="flex gap-2">
            {([["auto", <Zap size={13} />, "Auto-Generieren"], ["csv", <FileText size={13} />, "CSV Import"]] as const).map(([k, icon, label]) => (
              <button key={k} onClick={() => { setBulkMode(k as any); setBulkResult(null); }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-all"
                style={bulkMode === k
                  ? { background: "#60cfff", color: "#000" }
                  : { background: "#141414", color: "#666", border: "1px solid #222" }}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* AUTO MODE */}
          {bulkMode === "auto" && (
            <div className="rounded-2xl p-5 space-y-4" style={{ background: "#0d0d0d", border: "1px solid #1e1e1e" }}>
              <div className="p-3 rounded-xl text-xs" style={{ background: "#141414", color: "#60cfff88", border: "1px solid #60cfff22" }}>
                ⚡ Namen werden automatisch generiert: <strong>Präfix + Nummer</strong>, z.B. <code>user0001</code>…<code>user9999</code>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label {...lbl}>Präfix *</label>
                  <input value={prefix} onChange={e => setPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="z.B. user" {...inp} />
                </div>
                <div>
                  <label {...lbl}>Startnummer</label>
                  <input type="number" min="1" value={startNum} onChange={e => setStartNum(e.target.value)}
                    {...inp} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label {...lbl}>Anzahl * <span style={{ color: "#555" }}>(max. 50.000)</span></label>
                  <input type="number" min="1" max="50000" value={count} onChange={e => setCount(e.target.value)}
                    {...inp} />
                </div>
                <div>
                  <label {...lbl}>Passwort für alle *</label>
                  <input value={bulkPassword} onChange={e => setBulkPassword(e.target.value)}
                    placeholder="Einheitliches Passwort" {...inp} />
                </div>
              </div>

              {/* Quick count presets */}
              <div>
                <label {...lbl}>Schnellauswahl Anzahl</label>
                <div className="flex flex-wrap gap-2">
                  {[100, 500, 1000, 5000, 10000, 50000].map(n => (
                    <button key={n} type="button" onClick={() => setCount(String(n))}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={count === String(n)
                        ? { background: "#60cfff", color: "#000" }
                        : { background: "#1a1a1a", color: "#666", border: "1px solid #2a2a2a" }}>
                      {n.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {autoPreview.length > 0 && (
                <div className="rounded-xl px-4 py-3" style={{ background: "#141414", border: "1px solid #222" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#888" }}>Vorschau</p>
                  <div className="flex flex-wrap gap-2">
                    {autoPreview.map((name, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-md font-mono"
                        style={{ background: name === "..." ? "transparent" : "#0d0d0d", color: name === "..." ? "#333" : "#60cfff" }}>
                        {name}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs mt-2" style={{ color: "#444" }}>
                    {(parseInt(count) || 0).toLocaleString()} Benutzer mit Passwort „{bulkPassword || "—"}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CSV MODE */}
          {bulkMode === "csv" && (
            <div className="rounded-2xl p-5 space-y-4" style={{ background: "#0d0d0d", border: "1px solid #1e1e1e" }}>
              <div className="p-3 rounded-xl text-xs" style={{ background: "#141414", color: "#888", border: "1px solid #222" }}>
                Format: eine Zeile pro Benutzer → <code style={{ color: "#60cfff" }}>username,passwort</code><br />
                Beispiel: <code style={{ color: "#888" }}>max123,geheim456</code>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label {...lbl} style={{ ...lbl.style, marginBottom: 0 }}>CSV einfügen oder hochladen</label>
                  <button onClick={() => csvRef.current?.click()}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                    style={{ background: "#1a1a1a", color: "#888", border: "1px solid #2a2a2a" }}>
                    <Upload size={11} /> Datei
                  </button>
                  <input ref={csvRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvFile} />
                </div>
                <textarea
                  value={csvText} onChange={e => setCsvText(e.target.value)}
                  rows={10} placeholder={"max,passwort1\njohn,pass456\nanna,sicher789"}
                  className="w-full px-3 py-2.5 text-sm focus:outline-none resize-y rounded-xl font-mono"
                  style={{ background: "#141414", color: "#e0e0e0", border: "1px solid #2a2a2a" }} />
              </div>

              {csvUsers.length > 0 && (
                <div className="flex items-center gap-2 text-sm" style={{ color: "#66cc66" }}>
                  <CheckCircle size={14} />
                  {csvUsers.length.toLocaleString()} gültige Einträge erkannt
                </div>
              )}
            </div>
          )}

          {/* Progress */}
          {importing && (
            <div className="rounded-2xl p-5" style={{ background: "#0d0d0d", border: "1px solid #1e1e1e" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: "#e0e0e0" }}>Importiere...</span>
                <span className="text-sm font-mono" style={{ color: "#60cfff" }}>
                  {importProgress.toLocaleString()} / {importTotal.toLocaleString()}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1a1a1a" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #60cfff, #0088cc)" }} />
              </div>
              <p className="text-xs mt-2" style={{ color: "#444" }}>{progressPct}% abgeschlossen</p>
            </div>
          )}

          {/* Result */}
          {bulkResult && !importing && (
            <div className="rounded-2xl p-5" style={{ background: "#0d0d0d", border: "1px solid #1e1e1e" }}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={18} style={{ color: "#66cc66" }} />
                <span className="font-bold" style={{ color: "#e0e0e0" }}>Import abgeschlossen</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  ["Gesamt", bulkResult.total, "#888"],
                  ["Erstellt", bulkResult.created, "#66cc66"],
                  ["Übersprungen", bulkResult.skipped, "#f59e0b"],
                ].map(([label, val, color]) => (
                  <div key={label as string} className="rounded-xl p-3 text-center" style={{ background: "#141414" }}>
                    <p className="text-xl font-black" style={{ color: color as string }}>{(val as number).toLocaleString()}</p>
                    <p className="text-xs" style={{ color: "#555" }}>{label as string}</p>
                  </div>
                ))}
              </div>
              {bulkResult.errors.length > 0 && (
                <div className="rounded-xl p-3 mb-3" style={{ background: "#2a0f0f", border: "1px solid #ff3a3a22" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertCircle size={13} style={{ color: "#ff6b6b" }} />
                    <span className="text-xs font-semibold" style={{ color: "#ff6b6b" }}>{bulkResult.errors.length} Fehler</span>
                  </div>
                  {bulkResult.errors.slice(0, 3).map((e, i) => (
                    <p key={i} className="text-xs font-mono" style={{ color: "#ff6b6b88" }}>{e}</p>
                  ))}
                </div>
              )}
              <button onClick={downloadResult}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "#141414", color: "#60cfff", border: "1px solid #60cfff22" }}>
                <Download size={14} /> CSV herunterladen (username + passwort)
              </button>
            </div>
          )}

          {/* Import Button */}
          {!importing && (
            <button onClick={handleBulkImport}
              disabled={importing || (bulkMode === "auto" ? (!prefix || !bulkPassword || !(parseInt(count) > 0)) : csvUsers.length === 0)}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-black rounded-xl disabled:opacity-40 transition-all"
              style={{ background: "#60cfff", color: "#000" }}>
              <Zap size={16} />
              {bulkMode === "auto"
                ? `${(parseInt(count) || 0).toLocaleString()} Benutzer erstellen`
                : `${csvUsers.length.toLocaleString()} Benutzer importieren`}
            </button>
          )}
        </div>
      )}

      {/* ── SINGLE CREATE/EDIT MODAL ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
            <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: "#0d0d0d", border: "1px solid #222" }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #1a1a1a" }}>
                <h2 className="font-bold text-sm" style={{ color: "#e8e8e8" }}>
                  {editing ? "ویرایش کاربر" : "کاربر جدید"}
                </h2>
                <button onClick={() => setShowModal(false)} style={{ color: "#555" }}><X size={16} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-3">
                <div>
                  <label {...lbl}>نام کاربری *</label>
                  <input required value={form.username} disabled={!!editing}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    {...inp} style={{ ...inp.style, opacity: editing ? 0.5 : 1 }} />
                </div>
                <div>
                  <label {...lbl}>رمز عبور {!editing && "*"}</label>
                  <input type="password" required={!editing} value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder={editing ? "خالی = بدون تغییر" : ""}
                    {...inp} />
                </div>
                <div>
                  <label {...lbl}>ایمیل (اختیاری)</label>
                  <input type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} {...inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label {...lbl}>نقش</label>
                    <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} {...sel}>
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div>
                    <label {...lbl}>زبان</label>
                    <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} {...sel}>
                      <option value="DE">DE</option>
                      <option value="EN">EN</option>
                      <option value="FA">FA</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label {...lbl}>دستگاه</label>
                    <select value={form.deviceLockMode} onChange={e => setForm(f => ({ ...f, deviceLockMode: e.target.value }))} {...sel}>
                      <option value="ONE">۱ دستگاه</option>
                      <option value="TWO">۲ دستگاه</option>
                      <option value="UNLIMITED">نامحدود</option>
                    </select>
                  </div>
                  <div>
                    <label {...lbl}>وضعیت</label>
                    <select value={String(form.isActive)} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === "true" }))} {...sel}>
                      <option value="true">فعال</option>
                      <option value="false">غیرفعال</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 text-sm rounded-xl"
                    style={{ background: "#141414", color: "#777", border: "1px solid #222" }}>
                    انصراف
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 text-sm font-bold rounded-xl disabled:opacity-50"
                    style={{ background: "#60cfff", color: "#000" }}>
                    {saving
                      ? <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          ...
                        </span>
                      : editing ? "ذخیره" : "ایجاد"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
