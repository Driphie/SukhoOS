import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

const SUKHO_EMAIL = "sukho@sukho.app";
const SUKHO_PASS = "Allievi2002";
const SUKHO_USER = "Sukho";

type Ctx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, password: string) => {
    if (username.trim().toLowerCase() !== SUKHO_USER.toLowerCase()) {
      return { error: "Usuario incorrecto" };
    }
    if (password !== SUKHO_PASS) {
      return { error: "Contraseña incorrecta" };
    }

    // Try sign in; if user doesn't exist yet, sign up first.
    const { error } = await supabase.auth.signInWithPassword({
      email: SUKHO_EMAIL,
      password: SUKHO_PASS,
    });

    if (error) {
      // Sign up the singleton user
      const { error: suErr } = await supabase.auth.signUp({
        email: SUKHO_EMAIL,
        password: SUKHO_PASS,
        options: {
          emailRedirectTo: window.location.origin,
          data: { username: SUKHO_USER, display_name: SUKHO_USER },
        },
      });
      if (suErr) return { error: suErr.message };
      // Try sign in again
      const { error: siErr } = await supabase.auth.signInWithPassword({
        email: SUKHO_EMAIL,
        password: SUKHO_PASS,
      });
      if (siErr) return { error: siErr.message };
    }
    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
