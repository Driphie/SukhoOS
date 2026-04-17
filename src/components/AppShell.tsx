import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Target, BookHeart, Calendar, GraduationCap, BarChart3, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const items = [
  { to: "/", label: "Inicio", icon: LayoutDashboard },
  { to: "/vision", label: "Visión", icon: Target },
  { to: "/library", label: "Biblioteca", icon: BookHeart },
  { to: "/planner", label: "Planner", icon: Calendar },
  { to: "/study", label: "Estudio", icon: GraduationCap },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const { theme, toggle } = useTheme();
  const loc = useLocation();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-64 p-4 gap-2 sticky top-0 h-screen">
        <div className="glass-card p-5 mb-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Ethereal</p>
          <h1 className="text-2xl font-semibold text-gradient">Sukho OS</h1>
        </div>
        <nav className="glass-card p-3 flex-1 flex flex-col gap-1">
          {items.map((it) => {
            const active = loc.pathname === it.to;
            return (
              <NavLink key={it.to} to={it.to} className="relative">
                {active && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-2xl bg-gradient-primary shadow-glow"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <div className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${active ? "text-primary-foreground" : "hover:bg-foreground/5 text-foreground/80"}`}>
                  <it.icon size={18} />
                  <span className="text-sm font-medium">{it.label}</span>
                </div>
              </NavLink>
            );
          })}
        </nav>
        <div className="glass-card p-3 flex items-center gap-2">
          <button onClick={toggle} className="haptic flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl hover:bg-foreground/5">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            <span className="text-sm">{theme === "dark" ? "Claro" : "Oscuro"}</span>
          </button>
          <button onClick={logout} className="haptic w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-destructive/10 text-destructive" title="Salir">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 max-w-full overflow-x-hidden">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 glass-strong rounded-3xl p-2 flex justify-between z-40">
        {items.map((it) => {
          const active = loc.pathname === it.to;
          return (
            <NavLink key={it.to} to={it.to} className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-2xl ${active ? "text-primary" : "text-muted-foreground"}`}>
              <it.icon size={18} />
              <span className="text-[10px]">{it.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
