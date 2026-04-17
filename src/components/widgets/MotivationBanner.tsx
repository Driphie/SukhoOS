import { useMemo } from "react";
import { useNow } from "@/hooks/useNow";
import { Sparkles } from "lucide-react";

const MESSAGES = {
  morning: [
    "El día apenas empieza. Hazlo memorable, Sukho.",
    "Cada mañana es un lienzo. Tú sostienes el pincel.",
    "Disciplina hoy, libertad mañana.",
  ],
  afternoon: [
    "El esfuerzo silencioso construye imperios.",
    "Sigue. La constancia se nota.",
    "Una hora enfocada vale por tres dispersas.",
  ],
  evening: [
    "Cierra el día con orgullo, no con pendientes.",
    "Lo que hoy plantes, mañana lo recogerás.",
    "Recuerda quién quieres ser en 10 años.",
  ],
  night: [
    "Descansa. La mente clara es tu mejor herramienta.",
    "Mañana, otra vez. Mejor que hoy.",
    "El silencio también es trabajo.",
  ],
};

function pickPeriod(h: number): keyof typeof MESSAGES {
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  if (h >= 18 && h < 22) return "evening";
  return "night";
}

export default function MotivationBanner() {
  const now = useNow(60_000);
  const period = pickPeriod(now.getHours());
  const msg = useMemo(() => {
    const list = MESSAGES[period];
    const idx = Math.floor(now.getMinutes() / 20) % list.length;
    return list[idx];
  }, [period, now]);

  return (
    <div className="glass-card p-5 relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/30 rounded-full blur-3xl" />
      <div className="flex items-center gap-3 relative">
        <div className="w-10 h-10 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow shrink-0">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <p className="text-sm md:text-base text-foreground/90 italic">"{msg}"</p>
      </div>
    </div>
  );
}
