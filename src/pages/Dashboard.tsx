import ClockWidget from "@/components/widgets/ClockWidget";
import WeatherWidget from "@/components/widgets/WeatherWidget";
import MotivationBanner from "@/components/widgets/MotivationBanner";
import HabitTracker from "@/components/HabitTracker";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { ArrowRight, BookHeart, GraduationCap, Target } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ studyMin: 0, pages: 0, goals: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const monthStart = new Date();
      monthStart.setDate(1); monthStart.setHours(0,0,0,0);
      const [{ data: sessions }, { data: books }, { data: goals }] = await Promise.all([
        supabase.from("study_sessions").select("duration_seconds,started_at").gte("started_at", monthStart.toISOString()),
        supabase.from("books").select("current_page,total_pages,status"),
        supabase.from("goals").select("done").eq("done", false),
      ]);
      const studyMin = Math.round((sessions || []).reduce((s, x) => s + (x.duration_seconds || 0), 0) / 60);
      const pages = (books || []).reduce((s, b) => s + (b.current_page || 0), 0);
      setStats({ studyMin, pages, goals: goals?.length || 0 });
    })();
  }, [user]);

  const cards = [
    { to: "/vision", icon: Target, label: "Metas activas", value: stats.goals, color: "from-primary to-accent" },
    { to: "/library", icon: BookHeart, label: "Páginas leídas", value: stats.pages, color: "from-pink-500 to-primary" },
    { to: "/study", icon: GraduationCap, label: "Min. estudiados (mes)", value: stats.studyMin, color: "from-accent to-cyan-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><ClockWidget /></div>
        <WeatherWidget />
      </div>

      <MotivationBanner />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.to} to={c.to}>
            <motion.div whileHover={{ y: -4 }} className="glass-card p-5 group cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} grid place-items-center shadow-glow`}>
                  <c.icon className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="text-muted-foreground group-hover:translate-x-1 transition-transform" size={18} />
              </div>
              <p className="text-3xl font-light mt-4 tabular-nums">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      <HabitTracker />
    </motion.div>
  );
}
