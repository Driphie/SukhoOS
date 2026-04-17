import { Cloud, CloudRain, Sun } from "lucide-react";
import { useNow } from "@/hooks/useNow";

export default function WeatherWidget() {
  const now = useNow(60_000);
  const h = now.getHours();
  const condition = h >= 6 && h < 18 ? "Soleado" : "Nubes ligeras";
  const Icon = h >= 6 && h < 18 ? Sun : Cloud;
  const temp = 22; // placeholder

  return (
    <div className="glass-card p-6 floating-slow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-1">Clima</p>
          <h3 className="text-4xl font-light tabular-nums">{temp}°</h3>
          <p className="text-sm text-muted-foreground mt-1">{condition}</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-gradient-glow grid place-items-center text-white shadow-glow-blue">
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </div>
  );
}
