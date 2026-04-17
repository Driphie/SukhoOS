import confetti from "canvas-confetti";

export function celebrate(opts?: { intensity?: "low" | "high" }) {
  const count = opts?.intensity === "high" ? 200 : 80;
  const defaults = { startVelocity: 35, spread: 360, ticks: 60, zIndex: 9999 };

  const colors = ["#a855f7", "#3b82f6", "#06b6d4", "#ec4899", "#f59e0b"];

  confetti({
    ...defaults,
    particleCount: count,
    origin: { x: 0.5, y: 0.5 },
    colors,
    scalar: 1.1,
  });

  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: count / 2,
      origin: { x: 0.2, y: 0.7 },
      colors,
    });
    confetti({
      ...defaults,
      particleCount: count / 2,
      origin: { x: 0.8, y: 0.7 },
      colors,
    });
  }, 200);
}
