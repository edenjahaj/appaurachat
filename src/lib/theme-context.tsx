import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";
const KEY = "aura.theme";

interface ThemeCtx {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
}
const Ctx = createContext<ThemeCtx | undefined>(undefined);

function apply(t: Theme): "light" | "dark" {
  const sys = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const r = t === "system" ? sys : t;
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", r === "dark");
    document.documentElement.style.colorScheme = r;
  }
  return r;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (typeof localStorage !== "undefined" && (localStorage.getItem(KEY) as Theme | null)) || "system";
    setThemeState(stored);
    setResolved(apply(stored));
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => { if ((localStorage.getItem(KEY) ?? "system") === "system") setResolved(apply("system")); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem(KEY, t);
    setResolved(apply(t));
  };

  return <Ctx.Provider value={{ theme, resolved, setTheme }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme outside ThemeProvider");
  return c;
}
