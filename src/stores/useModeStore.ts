import { create } from 'zustand';
import type { AppMode, AppState, ModeActions } from '../types';

interface ModeStore extends AppState, ModeActions {}

export const useModeStore = create<ModeStore>((set, get) => ({
  // Initial state
  mode: 'formula',
  previousMode: null,
  transitioning: false,

  // Actions
  setMode: (mode: AppMode) => {
    const currentMode = get().mode;
    if (currentMode === mode) return;

    set({
      transitioning: true,
      previousMode: currentMode,
    });

    // Simulate transition animation
    setTimeout(() => {
      set({
        mode,
        transitioning: false,
      });
    }, 300);
  },

  toggleMode: () => {
    const currentMode = get().mode;
    const newMode = currentMode === 'formula' ? 'proof' : 'formula';
    get().setMode(newMode);
  },
}));