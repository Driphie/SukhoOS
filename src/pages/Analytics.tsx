import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { Clock, BookHeart, Flame, Sparkles } from "lucide-react";

interface Session { duration_seconds: number; subject_id: string | null; started_at: string; }
interface Subject { id: string; name: string; color: string; }
interface Book { current_page: number; }
interface Habit { id: string; name: string; target_per_day: number; }
interface Log { habit_id: string; log_date: string; count: number; }

export default function Analytics() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
      const [s, su, b, h, l] = await Promise.all([
        supabase.from("study_sessions").select("duration_seconds,subject_id,started_at").gte("started_at", monthStart.toISOString()),
        supabase.from("subjects").select("id,name,color"),
        supabase.from("books").select("current_page"),
        supabase.from("habits").select("id,name,target_per_day").eq("archived", false),
        supabase.from("habit_logs").select("habit_id,log_date,count").gte("log_date", monthStart.toISOString().slice(0,10)),
      ]);
      setSessions((s.data as Session[]) || []);
      setSubjects((su.data as Subject[]) || []);
      setBooks((b.data as Book[]) || []);
      setHabits((h.data as Habit[]) || []);
      setLogs((l.data as Log[]) || []);
    })();
  }, [user]);

  const totalMin = useMemo(() => Math.round(sessions.reduce((a, s) => a + s.duration_seconds, 0) / 60), [sessions]);
  const totalPages = useMemo(() => books.reduce((a, b) => a + (b.current_page || 0), 0), [books]);

  const bySubject = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => {
      const key = s.subject_id || "_none";
      map.set(key, (map.get(key) || 0) + s.duration_seconds);
    });
    return Array.from(map.entries()).map(([id, sec]) => {
      const subj = subjects.find((x) => x.id === id);
      return { name: subj?.name || "Sin materia", color: subj?.color || "hsl(var(--muted-foreground))", minutes: Math.round(sec / 60) };
    });
  }, [sessions, subjects]);

  const dailyMinutes = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0,10)] = 0;
    }
    sessions.forEach((s) => {
      const k = s.started_at.slice(0,10);
      if (days[k] !== undefined) days[k] += s.duration_seconds;
    });
    return Object.entries(days).map(([d, sec]) => ({ date: d.slice(5), minutes: Math.round(sec/60) }));
  }, [sessions]);

  const habitCompliance = useMemo(() => {
    if (habits.length === 0) return [];
    const days: Record<string, { done: number; total: number }> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0,10)] = { done: 0, total: habits.length };
    }
    logs.forEach((l) => {
      const habit = habits.find(h => h.id === l.habit_id);
      if (habit && days[l.log_date] && l.count >= habit.target_per_day) {
        days[l.log_date].done++;
      }
    });
    return Object.entries(days).map(([d, v]) => ({ date: d.slice(5), pct: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0 }));
  }, [habits, logs]);

  const stats = [
    { icon: Clock, label: "Min. estudiados", value: totalMin, color: "from-primary to-accent" },
    { icon: BookHeart, label: "Páginas leídas", value: totalPages, color: "from-pink-500 to-primary" },
    { icon: Flame, label: "Sesiones", value: sessions.length, color: "from-amber-500 to-pink-500" },
    { icon: Sparkles, label: "Hábitos activos", value: habits.length, color: "from-accent to-cyan-400" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Analytics Hub</p>
        <h1 className="text-3xl md:text-4xl font-semibold text-gradient">Tu mes en datos</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <motion.div key={s.label} whileHover={{ y: -3 }} className="glass-card p-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} grid place-items-center shadow-glow mb-3`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-3xl font-light tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4">Tiempo por materia</h3>
          {bySubject.length === 0 ? <Empty/> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={bySubject} dataKey="minutes" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {bySubject.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v} min`} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <ul className="text-xs space-y-1 mt-2">
            {bySubject.map((s) => (
              <li key={s.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }}/>
                <span className="flex-1">{s.name}</span>
                <span className="text-muted-foreground tabular-nums">{s.minutes} min</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4">Estudio diario (30 días)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyMinutes}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={3} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v} min`}/>
              <Bar dataKey="minutes" fill="url(#barGrad)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-semibold mb-4">Cumplimiento de hábitos (mensual)</h3>
        {habits.length === 0 ? <Empty msg="Crea hábitos para ver tu cumplimiento."/> : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={habitCompliance}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={3}/>
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[0, 100]}/>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`}/>
              <Line type="monotone" dataKey="pct" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="glass-card p-5 text-center">
        <p className="text-sm text-muted-foreground">Resumen del mes</p>
        <p className="text-2xl mt-2">
          Has leído <span className="text-gradient font-semibold">{totalPages}</span> páginas
          y estudiado <span className="text-gradient font-semibold">{Math.floor(totalMin/60)}h {totalMin%60}m</span>.
        </p>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
};

function Empty({ msg = "Sin datos aún." }: { msg?: string }) {
  return <p className="text-sm text-muted-foreground text-center py-10">{msg}</p>;
}
