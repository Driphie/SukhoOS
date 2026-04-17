import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Check, X, Sparkles, Calendar, Telescope } from "lucide-react";
import { toast } from "sonner";

type Scope = "annual" | "monthly" | "decade";
interface Goal { id: string; scope: Scope; title: string; description: string | null; done: boolean; }

const SCOPES: { key: Scope; label: string; subtitle: string; icon: any; gradient: string }[] = [
  { key: "monthly", label: "Metas mensuales", subtitle: "Este mes", icon: Calendar, gradient: "from-cyan-400 to-accent" },
  { key: "annual", label: "Metas anuales", subtitle: new Date().getFullYear().toString(), icon: Sparkles, gradient: "from-primary to-pink-500" },
  { key: "decade", label: "Visión 10 años", subtitle: "El Sukho del futuro", icon: Telescope, gradient: "from-violet-500 to-cyan-400" },
];

export default function Vision() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState<Scope | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("goals").select("*").order("created_at");
    setGoals((data as Goal[]) || []);
  };
  useEffect(() => { load(); }, [user]);

  const add = async (scope: Scope) => {
    if (!newTitle.trim() || !user) return;
    const { error } = await supabase.from("goals").insert({ user_id: user.id, scope, title: newTitle.trim() });
    if (error) toast.error(error.message);
    else { setNewTitle(""); setAdding(null); load(); }
  };

  const save = async (id: string) => {
    await supabase.from("goals").update({ title: draft }).eq("id", id);
    setEditing(null); load();
  };

  const toggle = async (g: Goal) => {
    await supabase.from("goals").update({ done: !g.done }).eq("id", g.id);
    load();
  };
  const remove = async (id: string) => {
    await supabase.from("goals").delete().eq("id", id);
    load();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Vision Board</p>
        <h1 className="text-3xl md:text-4xl font-semibold text-gradient">Hacia dónde vas</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {SCOPES.map((s) => {
          const list = goals.filter((g) => g.scope === s.key);
          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5 flex flex-col"
              style={{ perspective: 1000 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${s.gradient} grid place-items-center shadow-glow`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{s.label}</h3>
                  <p className="text-xs text-muted-foreground">{s.subtitle}</p>
                </div>
              </div>

              <ul className="space-y-2 flex-1">
                <AnimatePresence>
                  {list.map((g) => (
                    <motion.li
                      key={g.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      whileHover={{ rotateX: 2, rotateY: -2 }}
                      className="glass rounded-2xl p-3 flex items-center gap-2 group"
                    >
                      <button
                        onClick={() => toggle(g)}
                        className={`w-6 h-6 rounded-full border-2 grid place-items-center shrink-0 transition ${g.done ? "bg-gradient-primary border-transparent" : "border-foreground/30"}`}
                      >
                        {g.done && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                      </button>
                      {editing === g.id ? (
                        <>
                          <input
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && save(g.id)}
                            className="flex-1 bg-transparent outline-none text-sm"
                          />
                          <button onClick={() => save(g.id)} className="text-primary"><Check size={14} /></button>
                        </>
                      ) : (
                        <>
                          <span className={`flex-1 text-sm ${g.done ? "line-through text-muted-foreground" : ""}`}>{g.title}</span>
                          <button onClick={() => { setEditing(g.id); setDraft(g.title); }} className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-foreground"><Pencil size={12} /></button>
                          <button onClick={() => remove(g.id)} className="opacity-0 group-hover:opacity-100 transition text-destructive"><Trash2 size={12} /></button>
                        </>
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>

              {adding === s.key ? (
                <div className="flex gap-2 mt-3">
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") add(s.key); if (e.key === "Escape") setAdding(null); }}
                    placeholder="Nueva meta…"
                    className="flex-1 glass rounded-xl px-3 py-2 bg-transparent outline-none text-sm"
                  />
                  <button onClick={() => add(s.key)} className="haptic px-3 rounded-xl bg-gradient-primary text-primary-foreground"><Check size={14} /></button>
                  <button onClick={() => setAdding(null)} className="haptic px-3 rounded-xl glass"><X size={14} /></button>
                </div>
              ) : (
                <button onClick={() => setAdding(s.key)} className="haptic mt-3 w-full glass rounded-2xl py-2.5 text-sm flex items-center justify-center gap-2 hover:bg-primary/10">
                  <Plus size={14} /> Añadir meta
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
