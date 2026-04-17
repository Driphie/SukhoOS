import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Ring from "@/components/Ring";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Check } from "lucide-react";
import { celebrate } from "@/lib/confetti";
import { toast } from "sonner";

interface Habit {
  id: string;
  name: string;
  icon: string | null;
  ring_color: string | null;
  target_per_day: number;
}

interface Log { habit_id: string; count: number; }

const COLORS = [
  "hsl(280 90% 65%)",
  "hsl(200 100% 65%)",
  "hsl(160 80% 55%)",
  "hsl(330 90% 65%)",
  "hsl(40 100% 60%)",
];

export default function HabitTracker() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: hs } = await supabase
      .from("habits")
      .select("*")
      .eq("archived", false)
      .order("position", { ascending: true });
    const { data: ls } = await supabase
      .from("habit_logs")
      .select("habit_id,count")
      .eq("log_date", today);
    setHabits(hs || []);
    const map: Record<string, number> = {};
    (ls as Log[] | null)?.forEach((l) => { map[l.habit_id] = l.count; });
    setLogs(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const addHabit = async () => {
    if (!newName.trim() || !user) return;
    const color = COLORS[habits.length % COLORS.length];
    const { error } = await supabase.from("habits").insert({
      user_id: user.id,
      name: newName.trim(),
      ring_color: color,
      position: habits.length,
      target_per_day: 1,
    });
    if (error) { toast.error(error.message); return; }
    setNewName(""); setAdding(false);
    load();
  };

  const tick = async (h: Habit) => {
    if (!user) return;
    const current = logs[h.id] || 0;
    const next = current + 1;
    const wasUnder = current < h.target_per_day;
    const reached = next >= h.target_per_day;

    setLogs((m) => ({ ...m, [h.id]: next }));

    const { error } = await supabase
      .from("habit_logs")
      .upsert(
        { user_id: user.id, habit_id: h.id, log_date: today, count: next },
        { onConflict: "habit_id,log_date" }
      );
    if (error) { toast.error(error.message); load(); return; }

    if (wasUnder && reached) {
      celebrate();
      toast.success(`¡${h.name} completado!`);
    }
  };

  const remove = async (id: string) => {
    await supabase.from("habits").delete().eq("id", id);
    load();
  };

  if (loading) return <div className="glass-card p-6 h-64 animate-pulse" />;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Habit Rings</p>
          <h3 className="text-xl font-semibold">Hoy</h3>
        </div>
        <button onClick={() => setAdding((v) => !v)} className="haptic w-10 h-10 rounded-2xl bg-gradient-primary text-primary-foreground grid place-items-center shadow-glow">
          <Plus size={18} />
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="flex gap-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHabit()}
                placeholder="Nuevo hábito (ej. Meditar 10min)"
                className="flex-1 glass rounded-2xl px-4 py-3 bg-transparent outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button onClick={addHabit} className="haptic px-4 rounded-2xl bg-gradient-primary text-primary-foreground">Añadir</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {habits.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">Aún no hay hábitos. Crea tu primero ✨</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {habits.map((h) => {
            const count = logs[h.id] || 0;
            const progress = Math.min(1, count / Math.max(1, h.target_per_day));
            const done = count >= h.target_per_day;
            return (
              <motion.div
                key={h.id}
                layout
                whileHover={{ y: -4 }}
                className="glass rounded-3xl p-4 flex flex-col items-center gap-2 group relative"
              >
                <button
                  onClick={() => remove(h.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition w-7 h-7 rounded-full grid place-items-center text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={12} />
                </button>
                <button onClick={() => tick(h)} className="haptic">
                  <Ring progress={progress} size={120} stroke={12} color={h.ring_color || "hsl(var(--primary))"}>
                    <div className="text-center">
                      {done ? (
                        <Check className="w-6 h-6 text-primary mx-auto" />
                      ) : (
                        <div className="text-xl font-light tabular-nums">{count}/{h.target_per_day}</div>
                      )}
                    </div>
                  </Ring>
                </button>
                <p className="text-xs font-medium text-center line-clamp-1">{h.name}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
