import { create } from "zustand";

export type UserRole = "admin" | "editor" | "viewer";

interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

interface AuthState {
  user: User;
  setUser: (user: User) => void;
  setRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: "u1",
    name: "Demo User",
    role: "admin", // Default to admin for demo
  },
  setUser: (user) => set({ user }),
  setRole: (role) =>
    set((state) => ({
      user: { ...state.user, role },
    })),
}));
