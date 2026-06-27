import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Hardcoded Admin-Check wie gewünscht
    if (username === "Dexter" && password === "Hamid4747") {
      localStorage.setItem("user", JSON.stringify({ role: "ADMIN", name: "Dexter" }));
      window.location.hash = "/admin";
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        window.location.hash = "/admin";
      }
    } catch (err) {
      alert("Login fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 text-white">
      {/* Header Bereich wie in image.png */}
      <div className="mb-8 flex flex-col items-center">
        <div className="w-32 h-32 mb-6 rounded-2xl border border-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.4)] overflow-hidden">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-3xl font-bold text-blue-400" style={{ textShadow: "0 0 15px rgba(96,165,250,0.6)" }}>
          بهشت منها
        </h1>
      </div>

      {/* Login Box */}
      <div className="w-full max-w-sm bg-[#0a0a0a] border border-blue-900/50 p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.8)]">
        <h2 className="text-xl text-blue-400 font-bold text-center mb-8 tracking-wider">Login</h2>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-blue-400 text-sm mb-2">Username</label>
            <input 
              className="w-full p-4 bg-[#050505] border border-blue-900/50 rounded-xl text-white outline-none focus:border-blue-500 transition-all"
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-blue-400 text-sm mb-2">Password</label>
            <input 
              type="password"
              className="w-full p-4 bg-[#050505] border border-blue-900/50 rounded-xl text-white outline-none focus:border-blue-500 transition-all"
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button 
            type="submit" 
            className="w-full p-4 bg-[#111] border border-blue-900/50 text-white rounded-xl font-bold hover:bg-blue-900/20 transition-all"
            disabled={loading}
          >
            {loading ? "Wird geladen..." : "Login"}
          </button>
        </form>

        {/* Telegram Button Sektion */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-xs mb-4">مارو دنبال کن</p>
          <button className="w-full p-4 bg-[#050505] border border-blue-900/50 text-white rounded-xl flex items-center justify-center gap-2 hover:border-blue-500 transition-all">
            <span>Telegram</span>
          </button>
        </div>
      </div>
    </div>
  );
}
