import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Check, StickyNote as StickyIcon, ListTodo } from "lucide-react";
import { toast } from "sonner";

interface Task { id: string; title: string; due_date: string; start_time: string | null; end_time: string | null; done: boolean; }
interface Note { id: string; content: string; color: string; pos_x: number; pos_y: number; width: number; height: number; }

const NOTE_COLORS = ["violet", "blue", "pink", "amber"];
const NOTE_BG: Record<string, string> = {
  violet: "from-primary/40 to-primary/10",
  blue: "from-accent/40 to-accent/10",
  pink: "from-pink-500/40 to-pink-500/10",
  amber: "from-amber-500/40 to-amber-500/10",
};

export default function Planner() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"day" | "notes">("day");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const loadTasks = async () => {
    if (!user) return;
    const { data } = await supabase.from("tasks").select("*").eq("due_date", date).order("start_time", { ascending: true, nullsFirst: false });
    setTasks((data as Task[]) || []);
  };
  const loadNotes = async () => {
    if (!user) return;
    const { data } = await supabase.from("notes").select("*").order("created_at");
    setNotes((data as Note[]) || []);
  };
  useEffect(() => { loadTasks(); }, [user, date]);
  useEffect(() => { loadNotes(); }, [user]);

  const addTask = async () => {
    if (!newTitle.trim() || !user) return;
    await supabase.from("tasks").insert({
      user_id: user.id, title: newTitle.trim(), due_date: date,
      start_time: newStart || null, end_time: newEnd || null,
    });
    setNewTitle(""); setNewStart(""); setNewEnd(""); loadTasks();
  };
  const toggleTask = async (t: Task) => { await supabase.from("tasks").update({ done: !t.done }).eq("id", t.id); loadTasks(); };
  const deleteTask = async (id: string) => { await supabase.from("tasks").delete().eq("id", id); loadTasks(); };

  const addNote = async () => {
    if (!user) return;
    const color = NOTE_COLORS[notes.length % NOTE_COLORS.length];
    await supabase.from("notes").insert({
      user_id: user.id, content: "Nueva nota…", color,
      pos_x: 40 + (notes.length * 30) % 200,
      pos_y: 40 + (notes.length * 25) % 150,
    });
    loadNotes();
  };
  const updateNote = async (id: string, patch: Partial<Note>) => {
    setNotes((n) => n.map((x) => x.id === id ? { ...x, ...patch } : x));
    await supabase.from("notes").update(patch).eq("id", id);
  };
  const deleteNote = async (id: string) => { await supabase.from("notes").delete().eq("id", id); loadNotes(); };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Daily Planner</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-gradient">Tu día, tu lienzo</h1>
        </div>
        <div className="glass rounded-2xl p-1 flex">
          <button onClick={() => setTab("day")} className={`px-4 py-2 rounded-xl text-sm flex items-center gap-2 ${tab==="day" ? "bg-gradient-primary text-primary-foreground" : ""}`}><ListTodo size={14}/>Timeline</button>
          <button onClick={() => setTab("notes")} className={`px-4 py-2 rounded-xl text-sm flex items-center gap-2 ${tab==="notes" ? "bg-gradient-primary text-primary-foreground" : ""}`}><StickyIcon size={14}/>Notas</button>
        </div>
      </div>

      {tab === "day" ? (
        <>
          <div className="glass-card p-5 grid md:grid-cols-[160px_1fr_120px_120px_auto] gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground">Día</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full glass rounded-xl px-3 py-2 bg-transparent outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tarea</label>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} placeholder="¿Qué hay que hacer?" className="w-full glass rounded-xl px-3 py-2 bg-transparent outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Inicio</label>
              <input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="w-full glass rounded-xl px-3 py-2 bg-transparent outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Fin</label>
              <input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="w-full glass rounded-xl px-3 py-2 bg-transparent outline-none text-sm" />
            </div>
            <button onClick={addTask} className="haptic h-10 px-4 rounded-xl bg-gradient-primary text-primary-foreground"><Plus size={16}/></button>
          </div>

          <div className="glass-card p-5">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-accent to-transparent" />
              <ul className="space-y-2">
                <AnimatePresence>
                  {tasks.map((t) => (
                    <motion.li key={t.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="relative pl-12 group">
                      <span className="absolute left-2.5 top-3 w-3 h-3 rounded-full bg-gradient-primary shadow-glow" />
                      <div className="glass rounded-2xl p-3 flex items-center gap-3">
                        <button onClick={() => toggleTask(t)} className={`w-6 h-6 rounded-full border-2 grid place-items-center shrink-0 ${t.done ? "bg-gradient-primary border-transparent" : "border-foreground/30"}`}>
                          {t.done && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                          {(t.start_time || t.end_time) && (
                            <p className="text-xs text-muted-foreground tabular-nums">{t.start_time?.slice(0,5)} {t.end_time && `– ${t.end_time.slice(0,5)}`}</p>
                          )}
                        </div>
                        <button onClick={() => deleteTask(t.id)} className="opacity-0 group-hover:opacity-100 transition text-destructive"><Trash2 size={14}/></button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-8 pl-12">No hay tareas para este día.</p>}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <button onClick={addNote} className="haptic h-11 px-4 rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow flex items-center gap-2"><Plus size={16}/>Nueva nota</button>
          <div className="glass-card p-4 min-h-[600px] relative overflow-hidden">
            {notes.length === 0 && <p className="text-sm text-muted-foreground text-center py-20">Lienzo vacío. Arrastra notas para organizarlas ✨</p>}
            {notes.map((n) => (
              <DraggableNote key={n.id} note={n} onChange={(p) => updateNote(n.id, p)} onDelete={() => deleteNote(n.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DraggableNote({ note, onChange, onDelete }: { note: Note; onChange: (p: Partial<Note>) => void; onDelete: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState(note.content);

  useEffect(() => { setContent(note.content); }, [note.content]);

  return (
    <motion.div
      ref={ref}
      drag
      dragMomentum={false}
      initial={{ x: note.pos_x, y: note.pos_y }}
      onDragEnd={(_, info) => {
        const x = note.pos_x + info.offset.x;
        const y = note.pos_y + info.offset.y;
        onChange({ pos_x: x, pos_y: y });
      }}
      whileDrag={{ scale: 1.05, zIndex: 30 }}
      className={`absolute glass-strong rounded-2xl p-3 cursor-grab active:cursor-grabbing bg-gradient-to-br ${NOTE_BG[note.color] || NOTE_BG.violet}`}
      style={{ width: note.width, height: note.height }}
    >
      <button onClick={onDelete} className="absolute top-1 right-1 w-6 h-6 grid place-items-center text-destructive/80 hover:text-destructive"><Trash2 size={12}/></button>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={() => content !== note.content && onChange({ content })}
        className="w-full h-full bg-transparent outline-none resize-none text-sm pt-4"
      />
    </motion.div>
  );
}
