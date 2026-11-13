import { create } from "zustand";
import { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  activeSubjectId: string | null;
  setAuth: (user: User, token: string) => void;
  setActiveSubjectId: (id: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedToken = localStorage.getItem("gapfinder_token");
  const savedUser = localStorage.getItem("gapfinder_user");

  let initialUser: User | null = null;
  if (savedUser) {
    try {
      initialUser = JSON.parse(savedUser);
    } catch {
      initialUser = null;
    }
  }

  return {
    user: initialUser,
    token: savedToken,
    isAuthenticated: !!savedToken && !!initialUser,
    activeSubjectId: localStorage.getItem("gapfinder_active_subject"),

    setAuth: (user, token) => {
      localStorage.setItem("gapfinder_token", token);
      localStorage.setItem("gapfinder_user", JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },

    setActiveSubjectId: (id) => {
      if (id) {
        localStorage.setItem("gapfinder_active_subject", id);
      } else {
        localStorage.removeItem("gapfinder_active_subject");
      }
      set({ activeSubjectId: id });
    },

    logout: () => {
      localStorage.removeItem("gapfinder_token");
      localStorage.removeItem("gapfinder_user");
      localStorage.removeItem("gapfinder_active_subject");
      set({ user: null, token: null, isAuthenticated: false, activeSubjectId: null });
    },
  };
});
