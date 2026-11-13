import { create } from "zustand";

interface ThemeState {
  theme: "dark" | "light";
  toggleTheme: () => void;
  setTheme: (theme: "dark" | "light") => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  // Read existing preference or default to dark
  const saved = localStorage.getItem("gapfinder_theme") as "dark" | "light" | null;
  const initialTheme = saved || "dark";

  // Apply to document element immediately
  if (typeof document !== "undefined") {
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  return {
    theme: initialTheme,

    toggleTheme: () => {
      const next = get().theme === "dark" ? "light" : "dark";
      localStorage.setItem("gapfinder_theme", next);
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      set({ theme: next });
    },

    setTheme: (theme) => {
      localStorage.setItem("gapfinder_theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      set({ theme });
    },
  };
});
