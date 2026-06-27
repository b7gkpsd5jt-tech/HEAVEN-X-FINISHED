import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sende Login-Daten an das Backend
      const res = await apiFetch<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      // Speichere das Token oder die Benutzerinfo
      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        
        // Weiterleitung zum Admin-Bereich
        window.location.hash = "/admin";
      }
    } catch (err) {
      alert("Login fehlgeschlagen. Bitte prüfe Benutzername und Passwort.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
      <form onSubmit={handleLogin} className="bg-[#111] p-8 rounded-2xl w-full max-w-sm border border-[#222]">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <input 
          className="w-full p-3 mb-4 bg-black border border-gray-700 rounded-lg text-white"
          placeholder="Username" 
          onChange={e => setUsername(e.target.value)} 
          required 
        />
        <input 
          className="w-full p-3 mb-6 bg-black border border-gray-700 rounded-lg text-white"
          type="password" 
          placeholder="Passwort" 
          onChange={e => setPassword(e.target.value)} 
          required 
        />
        <button 
          type="submit" 
          className="w-full bg-blue-600 py-3 rounded-lg font-bold hover:bg-blue-700" 
          disabled={loading}
        >
          {loading ? "Wird angemeldet..." : "Anmelden"}
        </button>
      </form>
    </div>
  );
}
