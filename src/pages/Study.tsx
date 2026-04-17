import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, Plus, Trash2, BookOpen, Link as LinkIcon, Calculator, X, Maximize2, Volume2, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import Ring from "@/components/Ring";
import { celebrate } from "@/lib/confetti";

interface Subject { id: string; name: string; color: string; attendance_present: number; attendance_total: number; drive_url: string | null; bibliography_url: string | null; }
interface GradeComp { id: string; subject_id: string; name: string; weight: number; score: number | null; max_score: number; }
interface Session { id: string; subject_id: string | null; label: string; duration_seconds: number; started_at: string; }

const SUBJECT_COLORS = [
  "hsl(280 90% 65%)", "hsl(200 100% 65%)", "hsl(160 80% 55%)",
  "hsl(330 90% 65%)", "hsl(40 100% 60%)", "hsl(15 90% 60%)",
];

export default function Study() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [grades, setGrades] = useState<GradeComp[]>([]);
  const [zen, setZen] = useState(false);

  // Timer
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(45);
  const [label, setLabel] = useState("");
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [planned, setPlanned] = useState(0);
  const startedAtRef = useRef<Date | null>(null);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  const load = async () => {
    if (!user) return;
    const [{ data: s }, { data: ses }, { data: g }] = await Promise.all([
      supabase.from("subjects").select("*").eq("archived", false).order("created_at"),
      supabase.from("study_sessions").select("*").order("started_at", { ascending: false }).limit(20),
      supabase.from("grade_components").select("*"),
    ]);
    setSubjects((s as Subject[]) || []);
    setSessions((ses as Session[]) || []);
    setGrades((g as GradeComp[]) || []);
  };
  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (running && !paused) {
      tickRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else if (tickRef.current) {
      clearInterval(tickRef.current); tickRef.current = null;
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [running, paused]);

  const start = () => {
    const total = hours * 3600 + minutes * 60;
    if (total <= 0) { toast.error("Configura tiempo primero"); return; }
    if (!label.trim()) { toast.error("Ponle una etiqueta a la sesión"); return; }
    setPlanned(total); setElapsed(0); setRunning(true); setPaused(false);
    startedAtRef.current = new Date();
  };

  const stop = async (auto = false) => {
    if (!user || !startedAtRef.current) { setRunning(false); return; }
    setRunning(false); setPaused(false);
    const dur = elapsed;
    if (dur > 5) {
      await supabase.from("study_sessions").insert({
        user_id: user.id, subject_id: activeSubject, label, duration_seconds: dur,
        planned_seconds: planned, started_at: startedAtRef.current.toISOString(),
        ended_at: new Date().toISOString(),
      });
      if (auto) { celebrate({ intensity: "high" }); toast.success(`Sesión completada: ${label}`); }
      else toast.success(`Guardado: ${formatHM(dur)} de ${label}`);
      load();
    }
    setElapsed(0); setPlanned(0);
  };

  // auto-stop when reaching planned
  useEffect(() => {
    if (running && planned > 0 && elapsed >= planned) stop(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, running, planned]);

  const remaining = Math.max(0, planned - elapsed);
  const progress = planned > 0 ? Math.min(1, elapsed / planned) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Hub Académico</p>
        <h1 className="text-3xl md:text-4xl font-semibold text-gradient">Alto Rendimiento</h1>
      </div>

      {/* Timer */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative grid lg:grid-cols-[auto_1fr] gap-8 items-center">
          <Ring progress={progress || (running ? 0.001 : 0)} size={220} stroke={18}>
            <div className="text-center">
              <p className="text-4xl font-extralight tabular-nums text-gradient">
                {running ? formatHMS(remaining || elapsed) : formatHMS(hours * 3600 + minutes * 60)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{running ? (paused ? "Pausa" : "Enfocado") : "Listo"}</p>
            </div>
          </Ring>

          <div className="space-y-4">
            {!running ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Horas</label>
                    <input type="number" min={0} max={8} value={hours} onChange={(e) => setHours(parseInt(e.target.value || "0"))} className="w-full glass rounded-xl px-3 py-3 bg-transparent outline-none text-2xl tabular-nums text-center" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Minutos</label>
                    <input type="number" min={0} max={59} value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value || "0"))} className="w-full glass rounded-xl px-3 py-3 bg-transparent outline-none text-2xl tabular-nums text-center" />
                  </div>
                </div>
                <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder='Ej. "2h de Álgebra"' className="w-full glass rounded-xl px-4 py-3 bg-transparent outline-none" />
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setActiveSubject(null)} className={`text-xs px-3 py-1.5 rounded-full glass ${activeSubject === null ? "ring-2 ring-primary" : ""}`}>Sin materia</button>
                  {subjects.map((s) => (
                    <button key={s.id} onClick={() => setActiveSubject(s.id)} className={`text-xs px-3 py-1.5 rounded-full glass ${activeSubject === s.id ? "ring-2 ring-primary" : ""}`} style={{ borderLeft: `3px solid ${s.color}` }}>{s.name}</button>
                  ))}
                </div>
                <button onClick={start} className="haptic w-full py-4 rounded-2xl bg-gradient-primary text-primary-foreground font-medium shadow-glow flex items-center justify-center gap-2">
                  <Play size={18}/> Iniciar sesión
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">Transcurrido: {formatHMS(elapsed)} / {formatHMS(planned)}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPaused(p => !p)} className="haptic flex-1 py-3 rounded-xl glass flex items-center justify-center gap-2">
                    {paused ? <><Play size={16}/>Reanudar</> : <><Pause size={16}/>Pausar</>}
                  </button>
                  <button onClick={() => stop()} className="haptic flex-1 py-3 rounded-xl bg-destructive/90 text-destructive-foreground flex items-center justify-center gap-2"><Square size={16}/>Detener</button>
                  <button onClick={() => setZen(true)} className="haptic w-12 grid place-items-center rounded-xl glass" title="Modo Zen"><Maximize2 size={16}/></button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Subjects */}
      <SubjectsPanel subjects={subjects} grades={grades} reload={load} />

      {/* Recent sessions */}
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><BookOpen size={16}/> Historial reciente</h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay sesiones registradas.</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {sessions.map((s) => {
              const subj = subjects.find((x) => x.id === s.subject_id);
              return (
                <li key={s.id} className="py-2 flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full" style={{ background: subj?.color || "hsl(var(--muted-foreground))" }} />
                  <span className="flex-1">{s.label}</span>
                  <span className="text-muted-foreground tabular-nums">{formatHM(s.duration_seconds)}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">{new Date(s.started_at).toLocaleDateString()}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Zen Mode */}
      <AnimatePresence>
        {zen && running && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6">
            <button onClick={() => setZen(false)} className="absolute top-6 right-6 w-12 h-12 glass rounded-2xl grid place-items-center"><X /></button>
            <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground mb-6">{subjects.find(s => s.id === activeSubject)?.name || label}</p>
            <p className="text-[15vw] md:text-[10vw] font-extralight tabular-nums text-gradient leading-none">{formatHMS(remaining || elapsed)}</p>
            <FocusWaves paused={paused} />
            <button onClick={() => setPaused(p => !p)} className="haptic mt-8 px-8 py-3 rounded-2xl glass flex items-center gap-2">
              {paused ? <><Play size={16}/>Reanudar</> : <><Pause size={16}/>Pausar</>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FocusWaves({ paused }: { paused: boolean }) {
  return (
    <div className="flex items-end gap-1.5 h-16 mt-8">
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.span
          key={i}
          className="w-1.5 rounded-full bg-gradient-primary"
          animate={paused ? { height: 6 } : { height: [6, 30 + ((i * 7) % 30), 6] }}
          transition={{ duration: 1.2 + (i % 5) * 0.1, repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }}
        />
      ))}
      <Volume2 className="ml-3 text-muted-foreground" size={16}/>
    </div>
  );
}

function SubjectsPanel({ subjects, grades, reload }: { subjects: Subject[]; grades: GradeComp[]; reload: () => void }) {
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [drive, setDrive] = useState("");
  const [biblio, setBiblio] = useState("");
  const [calcSubject, setCalcSubject] = useState<Subject | null>(null);

  const add = async () => {
    if (!name.trim() || !user) return;
    const color = SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length];
    await supabase.from("subjects").insert({ user_id: user.id, name: name.trim(), color, drive_url: drive || null, bibliography_url: biblio || null });
    setName(""); setDrive(""); setBiblio(""); setAdding(false); reload();
  };
  const remove = async (id: string) => { await supabase.from("subjects").delete().eq("id", id); reload(); };
  const attendance = async (s: Subject, present: boolean) => {
    await supabase.from("subjects").update({
      attendance_total: s.attendance_total + 1,
      attendance_present: s.attendance_present + (present ? 1 : 0),
    }).eq("id", s.id);
    reload();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2"><GraduationCap size={16}/> Materias</h3>
        <button onClick={() => setAdding(v => !v)} className="haptic h-9 px-3 rounded-xl glass flex items-center gap-1 text-sm"><Plus size={14}/>Materia</button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="glass-card p-4 grid md:grid-cols-4 gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="glass rounded-xl px-3 py-2 bg-transparent outline-none text-sm" />
              <input value={drive} onChange={(e) => setDrive(e.target.value)} placeholder="URL Drive" className="glass rounded-xl px-3 py-2 bg-transparent outline-none text-sm" />
              <input value={biblio} onChange={(e) => setBiblio(e.target.value)} placeholder="URL Bibliografía" className="glass rounded-xl px-3 py-2 bg-transparent outline-none text-sm" />
              <button onClick={add} className="haptic px-3 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-sm">Crear</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((s) => {
          const myGrades = grades.filter((g) => g.subject_id === s.id);
          const totalW = myGrades.reduce((a, g) => a + g.weight, 0);
          const earned = myGrades.reduce((a, g) => a + ((g.score ?? 0) / g.max_score) * g.weight, 0);
          const avg = totalW > 0 ? (earned / totalW) * 10 : null;
          const attRate = s.attendance_total > 0 ? Math.round((s.attendance_present / s.attendance_total) * 100) : null;

          return (
            <motion.div key={s.id} layout whileHover={{ y: -3 }} className="glass-card p-5 relative" style={{ borderTop: `3px solid ${s.color}` }}>
              <button onClick={() => remove(s.id)} className="absolute top-3 right-3 text-destructive/70 hover:text-destructive"><Trash2 size={14}/></button>
              <h4 className="font-semibold">{s.name}</h4>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="glass rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Promedio</p>
                  <p className="text-2xl font-light tabular-nums">{avg != null ? avg.toFixed(2) : "—"}</p>
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Asistencia</p>
                  <p className="text-2xl font-light tabular-nums">{attRate != null ? `${attRate}%` : "—"}</p>
                  <p className="text-[10px] text-muted-foreground">{s.attendance_present}/{s.attendance_total}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => attendance(s, true)} className="haptic flex-1 text-xs py-2 rounded-xl glass hover:bg-success/10">+ Asistí</button>
                <button onClick={() => attendance(s, false)} className="haptic flex-1 text-xs py-2 rounded-xl glass hover:bg-destructive/10">+ Falté</button>
              </div>
              <div className="flex gap-2 mt-3">
                {s.drive_url && <a href={s.drive_url} target="_blank" className="haptic flex-1 text-xs py-2 rounded-xl glass flex items-center justify-center gap-1"><LinkIcon size={11}/>Drive</a>}
                {s.bibliography_url && <a href={s.bibliography_url} target="_blank" className="haptic flex-1 text-xs py-2 rounded-xl glass flex items-center justify-center gap-1"><BookOpen size={11}/>Biblio</a>}
                <button onClick={() => setCalcSubject(s)} className="haptic flex-1 text-xs py-2 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center gap-1"><Calculator size={11}/>Notas</button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {calcSubject && (
        <GradeCalculator subject={calcSubject} grades={grades.filter((g) => g.subject_id === calcSubject.id)} onClose={() => { setCalcSubject(null); reload(); }} />
      )}
    </div>
  );
}

function GradeCalculator({ subject, grades, onClose }: { subject: Subject; grades: GradeComp[]; onClose: () => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<GradeComp[]>(grades);
  const [target, setTarget] = useState(7);
  const [finalWeight, setFinalWeight] = useState(40);

  useEffect(() => { setItems(grades); }, [grades]);

  const addItem = async () => {
    if (!user) return;
    const { data } = await supabase.from("grade_components").insert({
      user_id: user.id, subject_id: subject.id, name: "Nuevo", weight: 1, max_score: 10,
    }).select().single();
    if (data) setItems((x) => [...x, data as GradeComp]);
  };
  const update = async (id: string, patch: Partial<GradeComp>) => {
    setItems((x) => x.map((i) => i.id === id ? { ...i, ...patch } : i));
    await supabase.from("grade_components").update(patch).eq("id", id);
  };
  const remove = async (id: string) => {
    setItems((x) => x.filter((i) => i.id !== id));
    await supabase.from("grade_components").delete().eq("id", id);
  };

  const totalWeight = items.reduce((a, g) => a + g.weight, 0);
  const earnedPct = items.reduce((a, g) => a + ((g.score ?? 0) / g.max_score) * g.weight, 0);
  const currentAvg = totalWeight > 0 ? (earnedPct / totalWeight) * 10 : 0;

  // Projection: required exam grade
  const w = finalWeight / 100;
  const currentContribution = currentAvg * (1 - w);
  const required = (target - currentContribution) / w;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: .96, y: 12 }} animate={{ scale: 1, y: 0 }} className="glass-strong rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground">{subject.name}</p>
            <h3 className="text-xl font-semibold">Calculadora de Notas</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 grid place-items-center glass rounded-xl"><X size={16}/></button>
        </div>

        <div className="space-y-2 mb-4">
          {items.map((g) => (
            <div key={g.id} className="glass rounded-xl p-2 grid grid-cols-[1fr_70px_70px_70px_auto] gap-2 items-center">
              <input value={g.name} onChange={(e) => update(g.id, { name: e.target.value })} className="bg-transparent outline-none text-sm px-2" />
              <input type="number" value={g.weight} onChange={(e) => update(g.id, { weight: parseFloat(e.target.value || "0") })} className="bg-transparent outline-none text-center text-sm" placeholder="peso" />
              <input type="number" value={g.score ?? ""} onChange={(e) => update(g.id, { score: e.target.value === "" ? null : parseFloat(e.target.value) })} className="bg-transparent outline-none text-center text-sm" placeholder="nota" />
              <input type="number" value={g.max_score} onChange={(e) => update(g.id, { max_score: parseFloat(e.target.value || "10") })} className="bg-transparent outline-none text-center text-sm" placeholder="máx" />
              <button onClick={() => remove(g.id)} className="text-destructive"><Trash2 size={12}/></button>
            </div>
          ))}
          <button onClick={addItem} className="haptic w-full glass rounded-xl py-2 text-sm flex items-center justify-center gap-1"><Plus size={12}/>Componente</button>
        </div>

        <div className="glass-card p-4 grid sm:grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Promedio actual</p>
            <p className="text-3xl font-light tabular-nums text-gradient">{currentAvg.toFixed(2)}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Nota objetivo</label>
            <input type="number" value={target} onChange={(e) => setTarget(parseFloat(e.target.value || "0"))} className="w-full glass rounded-xl px-3 py-2 bg-transparent outline-none text-2xl tabular-nums" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Peso del final %</label>
            <input type="number" value={finalWeight} onChange={(e) => setFinalWeight(parseFloat(e.target.value || "0"))} className="w-full glass rounded-xl px-3 py-2 bg-transparent outline-none text-2xl tabular-nums" />
          </div>
        </div>

        <div className="mt-4 glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Necesitas en el examen final</p>
          <p className={`text-5xl font-extralight tabular-nums mt-1 ${required > 10 ? "text-destructive" : required < 0 ? "text-success" : "text-gradient"}`}>
            {required > 10 ? "Imposible" : required < 0 ? "Ya estás 🎉" : required.toFixed(2)}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function formatHMS(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}
function formatHM(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
