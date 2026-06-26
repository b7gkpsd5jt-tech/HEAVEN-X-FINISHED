import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { BarChart3, BookOpen, Layers, Users, MessageSquare, Eye } from "lucide-react";

interface Stats { userCount: number; seriesCount: number; chapterCount: number; pageCount: number; commentCount: number }

export default function Analytics() {
  const { t } = useLang();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    apiFetch<Stats>("/admin/stats").then(setStats).catch(() => {});
  }, []);

  const metrics = [
    { label: t("totalSeries"), value: stats?.seriesCount, icon: BookOpen, color: "from-indigo-500 to-violet-600" },
    { label: t("totalChapters"), value: stats?.chapterCount, icon: Layers, color: "from-violet-500 to-purple-600" },
    { label: "Total Pages", value: stats?.pageCount, icon: Eye, color: "from-blue-500 to-indigo-600" },
    { label: t("totalUsers"), value: stats?.userCount, icon: Users, color: "from-emerald-500 to-teal-600" },
    { label: t("totalComments"), value: stats?.commentCount, icon: MessageSquare, color: "from-orange-500 to-red-500" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
          <BarChart3 size={18} className="text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t("analytics")}</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className={`bg-gradient-to-br ${m.color} rounded-2xl p-5 text-white shadow-sm`}>
              <Icon size={22} className="opacity-80 mb-3" />
              <div className="text-3xl font-black">{m.value?.toLocaleString() ?? "—"}</div>
              <div className="text-sm opacity-80 mt-1 font-medium">{m.label}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Platform Overview</h2>
        <div className="space-y-4">
          {metrics.map(m => (
            <div key={m.label}>
              <div className="flex justify-between text-sm text-gray-600 mb-1.5">
                <span className="font-medium">{m.label}</span>
                <span className="font-bold text-gray-900">{m.value?.toLocaleString() ?? 0}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${m.color} rounded-full transition-all duration-700`}
                  style={{ width: stats ? `${Math.min(100, ((m.value || 0) / Math.max(stats.chapterCount, stats.pageCount, 1)) * 100)}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
