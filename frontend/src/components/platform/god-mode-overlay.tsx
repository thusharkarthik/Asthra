"use client";

import { useEffect, useState } from "react";
import { useSimulationStore } from "@/lib/permission-simulator";

/**
 * Full-screen overlay that plays during God Mode entry and exit.
 * Renders nothing when no animation is in progress.
 *
 * Entry sequence (1800ms total):
 *   0ms   – overlay fades in
 *   300ms – ⚡ icon scales in
 *   600ms – GOD MODE text fades up
 *   1000ms – role name fades in
 *   1300ms – purple edge flash
 *   1500ms – overlay fades out → onActivationComplete()
 *   1800ms – store sets isGodModeReady = true (timer in store)
 *
 * Exit sequence (1200ms total):
 *   0ms   – overlay fades in
 *   200ms – "Exiting God Mode" text appears
 *   500ms – ⚡ icon shrinks
 *   800ms – overlay fades out → onDeactivationComplete()
 *   1200ms – store clears all state (timer in store)
 */
export function GodModeOverlay() {
  const isActivating = useSimulationStore((s) => s.isActivating);
  const isDeactivating = useSimulationStore((s) => s.isDeactivating);
  const simulatedRoleName = useSimulationStore((s) => s.simulatedRoleName);
  const onActivationComplete = useSimulationStore((s) => s.onActivationComplete);
  const onDeactivationComplete = useSimulationStore((s) => s.onDeactivationComplete);

  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isActivating) return;
    setPhase(0);
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1000),
      setTimeout(() => setPhase(4), 1300),
      setTimeout(() => {
        setPhase(5);
        onActivationComplete();
      }, 1500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isActivating, onActivationComplete]);

  useEffect(() => {
    if (!isDeactivating) return;
    setPhase(10);
    const timers = [
      setTimeout(() => setPhase(11), 200),
      setTimeout(() => setPhase(12), 500),
      setTimeout(() => {
        setPhase(0);
        onDeactivationComplete();
      }, 800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isDeactivating, onDeactivationComplete]);

  if (!isActivating && !isDeactivating) return null;

  const isFadingOut = phase === 5;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        backgroundColor: isActivating ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.65)",
        transition: "opacity 300ms ease",
        opacity: isFadingOut ? 0 : 1,
        pointerEvents: isFadingOut ? "none" : "auto",
      }}
    >
      {isActivating && (
        <>
          {/* ⚡ Icon */}
          <div
            style={{
              fontSize: "5rem",
              lineHeight: 1,
              marginBottom: "1.5rem",
              transition: "transform 300ms ease, opacity 300ms ease",
              transform: phase >= 1 ? "scale(1)" : "scale(0)",
              opacity: phase >= 1 ? 1 : 0,
            }}
          >
            ⚡
          </div>

          {/* GOD MODE text */}
          <div
            style={{
              fontSize: "3rem",
              fontWeight: 900,
              letterSpacing: "0.3em",
              color: "#a78bfa",
              marginBottom: "1rem",
              transition: "opacity 300ms ease, transform 300ms ease",
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? "translateY(0)" : "translateY(1rem)",
            }}
          >
            GOD MODE
          </div>

          {/* Role name */}
          {simulatedRoleName && (
            <div
              style={{
                fontSize: "1.125rem",
                color: "hsl(var(--muted-foreground))",
                transition: "opacity 300ms ease",
                opacity: phase >= 3 ? 1 : 0,
              }}
            >
              Simulating: {simulatedRoleName}
            </div>
          )}

          {/* Purple edge flash */}
          {phase === 4 && (
            <div
              className="pointer-events-none fixed inset-0"
              style={{
                boxShadow: "inset 0 0 0 3px #8b5cf6",
                animation: "godmodePulse 200ms ease-out forwards",
              }}
            />
          )}
        </>
      )}

      {isDeactivating && (
        <>
          {/* Exit text */}
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "hsl(var(--muted-foreground))",
              marginBottom: "1.5rem",
              transition: "opacity 300ms ease",
              opacity: phase >= 11 ? 1 : 0,
            }}
          >
            Exiting God Mode
          </div>

          {/* ⚡ shrinks away */}
          <div
            style={{
              fontSize: "4rem",
              lineHeight: 1,
              transition: "transform 300ms ease, opacity 300ms ease",
              transform: phase >= 12 ? "scale(0)" : "scale(1)",
              opacity: phase >= 12 ? 0 : 1,
            }}
          >
            ⚡
          </div>
        </>
      )}

      <style>{`
        @keyframes godmodePulse {
          0%   { opacity: 0; }
          50%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
