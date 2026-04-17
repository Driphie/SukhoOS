import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, BookOpen, Check, Trophy } from "lucide-react";
import { celebrate } from "@/lib/confetti";
import { toast } from "sonner";

type Status = "pending" | "reading" | "finished";
type Priority = "critical" | "quick" | "complementary";
interface Book {
  id: string; title: string; author: string | null;
  status: Status; total_pages: number | null; current_page: number;
  priority: Priority; finished_at: string | null;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  critical: "bg-destructive/15 text-destructive",
  quick: "bg-accent/15 text-accent",
  complementary: "bg-muted text-muted-foreground",
};
const PRIORITY_LABEL: Record<Priority, string> = {
  critical: "Crítica", quick: "Rápida", complementary: "Complementaria",
};

export default function Library() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [adding, setAdding] = useState(false);
  const [t, setT] = useState(""); const [a, setA] = useState(""); const [pp, setPp] = useState(""); const [pr, setPr] = useState<Priority>("complementary");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("books").select("*").order("created_at", { ascending: false });
    setBooks((data as Book[]) || []);
  };
  useEffect(() => { load(); }, [user]);

  const add = async () => {
    if (!t.trim() || !user) return;
    await supabase.from("books").insert({ user_id: user.id, title: t.trim(), author: a.trim() || null, total_pages: pp ? parseInt(pp) : null, priority: pr });
    setT(""); setA(""); setPp(""); setAdding(false); load();
  };

  const updatePage = async (b: Book, page: number) => {
    const total = b.total_pages || 0;
    const next = Math.max(0, Math.min(total || page, page));
    const finished = total > 0 && next >= total;
    await supabase.from("books").update({
      current_page: next,
      status: finished ? "finished" : next > 0 ? "reading" : "pending",
      finished_at: finished ? new Date().toISOString() : null,
    }).eq("id", b.id);
    if (finished && b.status !== "finished") {
      celebrate({ intensity: "high" });
      toast.success(`¡Terminaste "${b.title}"!`);
    }
    load();
  };

  const finish = async (b: Book) => {
    await supabase.from("books").update({ status: "finished", finished_at: new Date().toISOString(), current_page: b.total_pages || b.current_page }).eq("id", b.id);
    celebrate({ intensity: "high" }); toast.success("Libro terminado 🏆");
    load();
  };

  const remove = async (id: string) => { await supabase.from("books").delete().eq("id", id); load(); };

  const pending = books.filter((b) => b.status !== "finished");
  const finished = books.filter((b) => b.status === "finished");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Biblioteca de Honor</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-gradient">Tus lecturas</h1>
        </div>
        <button onClick={() => setAdding(v => !v)} className="haptic h-11 px-4 rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow flex items-center gap-2">
          <Plus size={16} /> Libro
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="glass-card p-5 grid md:grid-cols-5 gap-3">
              <input value={t} onChange={(e) => setT(e.target.value)} placeholder="Título" className="md:col-span-2 glass rounded-xl px-3 py-2 bg-transparent outline-none text-sm" />
              <input value={a} onChange={(e) => setA(e.target.value)} placeholder="Autor" className="glass rounded-xl px-3 py-2 bg-transparent outline-none text-sm" />
              <input value={pp} onChange={(e) => setPp(e.target.value)} placeholder="Páginas" type="number" className="glass rounded-xl px-3 py-2 bg-transparent outline-none text-sm" />
              <select value={pr} onChange={(e) => setPr(e.target.value as Priority)} className="glass rounded-xl px-3 py-2 bg-transparent outline-none text-sm">
                <option value="critical">Crítica</option><option value="quick">Rápida</option><option value="complementary">Complementaria</option>
              </select>
              <button onClick={add} className="md:col-span-5 haptic py-2.5 rounded-xl bg-gradient-primary text-primary-foreground">Añadir</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section>
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><BookOpen size={14} /> Por leer / leyendo ({pending.length})</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {pending.map((b) => {
              const pct = b.total_pages ? Math.round((b.current_page / b.total_pages) * 100) : 0;
              return (
                <motion.div key={b.id} layout initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .9, x: 100 }} className="glass-card p-5 group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold">{b.title}</h4>
                      {b.author && <p className="text-xs text-muted-foreground">{b.author}</p>}
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full ${PRIORITY_COLORS[b.priority]}`}>{PRIORITY_LABEL[b.priority]}</span>
                  </div>
                  {b.total_pages ? (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <input type="number" value={b.current_page} onChange={(e) => updatePage(b, parseInt(e.target.value || "0"))} className="w-16 glass rounded-lg px-2 py-1 bg-transparent text-center" />
                        <span className="text-muted-foreground">de {b.total_pages} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-foreground/10 overflow-hidden relative">
                        <motion.div
                          className="h-full bg-gradient-primary relative"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: .8 }}
                        >
                          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,hsl(var(--primary-glow)/.7),transparent)] bg-[length:200%_100%] animate-shimmer" />
                        </motion.div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-3">Sin páginas registradas</p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => finish(b)} className="haptic flex-1 glass rounded-xl py-2 text-xs flex items-center justify-center gap-1 hover:bg-primary/10"><Check size={12} /> Terminar</button>
                    <button onClick={() => remove(b.id)} className="haptic w-9 h-9 grid place-items-center rounded-xl text-destructive hover:bg-destructive/10"><Trash2 size={12} /></button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><Trophy size={14} /> Logros ({finished.length})</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {finished.map((b) => (
              <motion.div key={b.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center"><Trophy className="w-5 h-5 text-primary-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium line-through decoration-primary/60 truncate">{b.title}</p>
                  {b.author && <p className="text-xs text-muted-foreground truncate">{b.author}</p>}
                </div>
                <button onClick={() => remove(b.id)} className="text-destructive opacity-0 hover:opacity-100"><Trash2 size={12} /></button>
              </motion.div>
            ))}
          </AnimatePresence>
          {finished.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay libros terminados.</p>}
        </div>
      </section>
    </div>
  );
}
