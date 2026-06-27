import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // 🔒 HIER DEINE ADMIN-ZUGANGSDATEN EINTRÄGEN
    const EXACT_ADMIN_USER = "admin";
    const EXACT_ADMIN_PASS = "Hamid4747!"; 

    if (username === EXACT_ADMIN_USER && password === EXACT_ADMIN_PASS) {
      localStorage.setItem("hx_admin_auth", "true");
      localStorage.setItem("hx_admin_user", username);
      setError("");
      navigate("/admin");
    } else {
      setError("Falscher Admin-Benutzername oder Passwort.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-6 left-6">
        <Link href="/">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer transition-all">
            <ArrowLeft size={16} />
            Zurück zur Website
          </div>
        </Link>
      </div>

      <div className="sm:mx-auto w-full max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white font-black text-lg">HX</span>
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-gray-900 tracking-tight">
          HEAVEN<span className="text-indigo-600">x</span> Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Nur für Administratoren zugänglich
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium text-center animate-shake">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Admin Benutzername
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="z.B. admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Passwort
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                Einloggen
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
