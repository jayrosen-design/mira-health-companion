import { createContext, useContext, type ReactNode } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";

export const COLOR_SCHEMES = [
  { id: "warm", name: "Warm Sage" },
  { id: "ufhealth", name: "UF Health" },
  { id: "sparc", name: "SPARC C-LEAR" },
] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number]["id"];
export function isColorScheme(value: unknown): value is ColorScheme {
  return COLOR_SCHEMES.some((scheme) => scheme.id === value);
}
const ThemeContext = createContext<{ theme: ColorScheme; setTheme: (theme: ColorScheme) => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const theme = useRouterState({ select: (state) => {
    const value = state.location.search.theme;
    return isColorScheme(value) ? value : "warm";
  } });
  const setTheme = (next: ColorScheme) => {
    // Router replacement uses history.replaceState and keeps its location in sync.
    void router.navigate({ to: ".", search: (previous) => ({ ...previous, theme: next }), replace: true });
  };
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useColorScheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("Color scheme controls require ThemeProvider");
  return context;
}