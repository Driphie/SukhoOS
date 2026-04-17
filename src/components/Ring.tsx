import { motion } from "framer-motion";

interface RingProps {
  progress: number; // 0..1
  size?: number;
  stroke?: number;
  color?: string;
  trackOpacity?: number;
  children?: React.ReactNode;
  glow?: boolean;
}

export default function Ring({ progress, size = 140, stroke = 14, color = "hsl(var(--primary))", trackOpacity = 0.15, children, glow = true }: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={glow ? "ring-glow" : ""}>
        <defs>
          <linearGradient id={`grad-${size}-${Math.round(p*100)}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeOpacity={trackOpacity} strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          stroke={`url(#grad-${size}-${Math.round(p*100)})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - p) }}
          transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
