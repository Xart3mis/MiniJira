import { create } from 'zustand';

const useUiStore = create((set) => ({
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  selectedTaskId: null,
  taskPanelOpen: false,
  createTaskOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),

  openTaskPanel: (taskId) => set({ selectedTaskId: taskId, taskPanelOpen: true }),
  closeTaskPanel: () => set({ taskPanelOpen: false, selectedTaskId: null }),

  openCreateTask: () => set({ createTaskOpen: true }),
  closeCreateTask: () => set({ createTaskOpen: false }),
}));

export default useUiStore;
