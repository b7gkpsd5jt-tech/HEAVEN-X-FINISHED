import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // ورود اضطراری برای دسترسی سریع
    if (username === "admin" && password === "Hamid4747") {
      localStorage.setItem("user", JSON.stringify({ role: "ADMIN", name: "Admin" }));
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
      alert("نام کاربری یا رمز عبور اشتباه است.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
      <form onSubmit={handleLogin} className="bg-[#111] p-8 rounded-2xl w-full max-w-sm border border-[#222]">
        {/* لوگو و نوشته آبی رنگ */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full mb-4 flex items-center justify-center text-white font-bold text-xl">
            HX
          </div>
          <h1 className="text-4xl font-bold text-blue-600">Heaven-X</h1>
        </div>
        
        <input 
          className="w-full p-3 mb-4 bg-black border border-gray-700 rounded-lg text-white"
          placeholder="Username" 
          onChange={e => setUsername(e.target.value)} 
          required 
        />
        <input 
          className="w-full p-3 mb-6 bg-black border border-gray-700 rounded-lg text-white"
          type="password" 
          placeholder="Password" 
          onChange={e => setPassword(e.target.value)} 
          required 
        />
        <button 
          type="submit" 
          className="w-full bg-blue-600 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors" 
          disabled={loading}
        >
          {loading ? "در حال ورود..." : "ورود"}
        </button>
      </form>
    </div>
  );
}
