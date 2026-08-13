import { create } from "zustand";

type ProgressState = {
  active: boolean;
  progress: number;
  failed: boolean;
  startProgress: () => void;
  setProgress: (value: number) => void;
  completeProgress: () => void;
  failProgress: () => void;
  resetProgress: () => void;
};

let progressTimer: ReturnType<typeof setInterval> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function clearProgressTimer() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, value));
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  active: false,
  progress: 0,
  failed: false,
  startProgress: () => {
    clearProgressTimer();
    clearHideTimer();
    set({ active: true, failed: false, progress: Math.max(get().progress, 8) });
    progressTimer = setInterval(() => {
      const current = get().progress;
      const next = current < 30 ? current + 7 : current < 80 ? current + 2.5 : current < 95 ? current + 0.7 : current;
      set({ progress: clampProgress(next) });
    }, 220);
  },
  setProgress: (value) => set({ active: true, progress: clampProgress(value), failed: false }),
  completeProgress: () => {
    clearProgressTimer();
    set({ active: true, failed: false, progress: 100 });
    clearHideTimer();
    hideTimer = setTimeout(() => set({ active: false, progress: 0, failed: false }), 360);
  },
  failProgress: () => {
    clearProgressTimer();
    set({ active: true, failed: true, progress: 100 });
    clearHideTimer();
    hideTimer = setTimeout(() => set({ active: false, progress: 0, failed: false }), 560);
  },
  resetProgress: () => {
    clearProgressTimer();
    clearHideTimer();
    set({ active: false, progress: 0, failed: false });
  }
}));
