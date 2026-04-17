import { motion } from "framer-motion";
import { useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Fingerprint, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Lock() {
  const { login } = useAuth();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await login(user, pass);
    setBusy(false);
    if (error) toast.error(error);
    else toast.success("Bienvenido, Sukho");
  };

  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const day = now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Aurora orbs */}
      <motion.div
        className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full bg-primary/30 blur-3xl"
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -right-20 w-[600px] h-[600px] rounded-full bg-accent/30 blur-3xl"
        animate={{ x: [0, -80, 0], y: [0, -60, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: .98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: .7, ease: [.2,.8,.2,1] }}
        className="glass-strong rounded-[2.5rem] p-10 w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground mb-2">{day}</p>
          <h1 className="text-7xl font-extralight tracking-tight tabular-nums">{time}</h1>
        </div>

        <motion.div
          className="w-20 h-20 mx-auto rounded-full glass flex items-center justify-center mb-6 animate-pulse-glow"
          whileHover={{ scale: 1.05 }}
        >
          <Fingerprint className="w-10 h-10 text-primary" />
        </motion.div>

        <p className="text-center text-sm text-muted-foreground mb-6">Bio-Look · Acceso seguro</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <input
              autoFocus
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="Usuario"
              className="w-full glass rounded-2xl px-5 py-4 bg-transparent outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/70 transition-all"
            />
          </div>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Contraseña"
              className="w-full glass rounded-2xl px-5 py-4 pr-12 bg-transparent outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/70 transition-all"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <motion.button
            type="submit"
            disabled={busy}
            whileTap={{ scale: 0.96 }}
            className="haptic w-full rounded-2xl py-4 bg-gradient-primary text-primary-foreground font-medium shadow-glow flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Desbloquear"}
          </motion.button>
        </form>

        <p className="text-center text-xs text-muted-foreground/70 mt-8 tracking-wider">
          ETHEREAL · iOS 26 EDITION
        </p>
      </motion.div>
    </div>
  );
}
