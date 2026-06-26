import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { motion } from "framer-motion";
import { BookOpen, Layers, Users, MessageSquare, TrendingUp, Upload, Clock } from "lucide-react";

interface Stats {
  userCount: number;
  seriesCount: number;
  chapterCount: number;
  pageCount: number;
  commentCount: number;
  recentUploads: { id: string; number: number; seriesId: string; createdAt: string }[];
}

export default function Dashboard() {
  const { t } = useLang();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Stats>("/admin/stats").then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: t("totalSeries"), value: stats?.seriesCount, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: t("totalChapters"), value: stats?.chapterCount, icon: Layers, color: "text-violet-600", bg: "bg-violet-50" },
    { label: t("totalUsers"), value: stats?.userCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: t("totalComments"), value: stats?.commentCount, icon: MessageSquare, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Pages", value: stats?.pageCount, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("dashboard")}</h1>
        <p className="text-sm text-gray-500">HEAVENx Admin Overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
            >
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={card.color} />
              </div>
              <div className="text-2xl font-black text-gray-900">
                {loading ? <div className="h-7 w-12 bg-gray-200 rounded animate-pulse" /> : (card.value ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 font-medium">{card.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent uploads */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 p-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Upload size={15} className="text-indigo-600" />
          </div>
          <h2 className="font-semibold text-gray-900">Recent Uploads</h2>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-48" />
                  <div className="h-3 bg-gray-200 rounded w-24 mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(stats?.recentUploads || []).map((ch, i) => (
              <div key={ch.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-xs">{ch.number}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Chapter {ch.number}</p>
                  <p className="text-xs text-gray-400">Series ID: {ch.seriesId.slice(0, 8)}…</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock size={11} />
                  {new Date(ch.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {(stats?.recentUploads || []).length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">{t("noResults")}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
