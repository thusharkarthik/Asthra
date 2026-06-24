import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useProgressStore } from "@/stores/progress-store";

describe("progress store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useProgressStore.getState().resetProgress();
  });

  afterEach(() => {
    useProgressStore.getState().resetProgress();
    vi.useRealTimers();
  });

  it("starts, advances, completes, and hides", () => {
    useProgressStore.getState().startProgress();
    expect(useProgressStore.getState().active).toBe(true);
    expect(useProgressStore.getState().progress).toBeGreaterThan(0);

    vi.advanceTimersByTime(500);
    expect(useProgressStore.getState().progress).toBeGreaterThan(8);

    useProgressStore.getState().completeProgress();
    expect(useProgressStore.getState().progress).toBe(100);

    vi.advanceTimersByTime(400);
    expect(useProgressStore.getState().active).toBe(false);
    expect(useProgressStore.getState().progress).toBe(0);
  });

  it("fails and hides after a short delay", () => {
    useProgressStore.getState().startProgress();
    useProgressStore.getState().failProgress();

    expect(useProgressStore.getState().failed).toBe(true);
    expect(useProgressStore.getState().progress).toBe(100);

    vi.advanceTimersByTime(600);
    expect(useProgressStore.getState().active).toBe(false);
    expect(useProgressStore.getState().failed).toBe(false);
  });
});
