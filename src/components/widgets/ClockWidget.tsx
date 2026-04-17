import { useNow } from "@/hooks/useNow";

export default function ClockWidget() {
  const now = useNow(1000);
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="glass-card p-6 floating">
      <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-1">Hora local</p>
      <h2 className="text-5xl md:text-6xl font-extralight tabular-nums text-gradient">{time}</h2>
      <p className="capitalize text-sm text-muted-foreground mt-2">{date}</p>
    </div>
  );
}
