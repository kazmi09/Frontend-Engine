import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { GridState } from "./types";
import { OnChangeFn, ColumnSizingState, VisibilityState, SortingState, ColumnOrderState, ColumnPinningState } from "@tanstack/react-table";

interface GridStore extends GridState {
  setColumnVisibility: OnChangeFn<VisibilityState>;
  setColumnOrder: OnChangeFn<ColumnOrderState>;
  setColumnPinning: OnChangeFn<ColumnPinningState>;
  setColumnSizing: OnChangeFn<ColumnSizingState>;
  setSorting: OnChangeFn<SortingState>;
  resetLayout: () => void;
}

const initialState: GridState = {
  columnVisibility: {},
  columnOrder: [],
  columnPinning: { left: [], right: [] },
  columnSizing: {},
  sorting: [],
};

// We use a factory function to create unique stores per grid ID if needed
// For this MVP, we'll use a single global store for the main grid
export const useGridStore = create<GridStore>()(
  persist(
    (set) => ({
      ...initialState,
      setColumnVisibility: (updaterOrValue) =>
        set((state) => {
          const newVisibility = typeof updaterOrValue === "function" ? updaterOrValue(state.columnVisibility) : updaterOrValue;
          return { columnVisibility: newVisibility };
        }),
      setColumnOrder: (updaterOrValue) =>
        set((state) => {
          const newOrder = typeof updaterOrValue === "function" ? updaterOrValue(state.columnOrder) : updaterOrValue;
          return { columnOrder: newOrder };
        }),
      setColumnPinning: (updaterOrValue) =>
        set((state) => {
          const newPinning = typeof updaterOrValue === "function" ? updaterOrValue(state.columnPinning) : updaterOrValue;
          return { columnPinning: newPinning };
        }),
      setColumnSizing: (updaterOrValue) =>
        set((state) => {
          const newSizing = typeof updaterOrValue === "function" ? updaterOrValue(state.columnSizing) : updaterOrValue;
          return { columnSizing: newSizing };
        }),
      setSorting: (updaterOrValue) =>
        set((state) => {
          const newSorting = typeof updaterOrValue === "function" ? updaterOrValue(state.sorting) : updaterOrValue;
          return { sorting: newSorting };
        }),
      resetLayout: () => set(initialState),
    }),
    {
      name: "nexus-grid-storage", // unique name for localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
