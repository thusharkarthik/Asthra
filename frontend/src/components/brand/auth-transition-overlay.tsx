"use client";

import { AsthraLogo } from "@/components/brand/asthra-logo";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

const blocks = Array.from({ length: 9 }, (_, index) => index);

export function AuthTransitionOverlay() {
  const authTransition = useUIStore((state) => state.authTransition);

  if (!authTransition) return null;

  const isLogin = authTransition === "login";

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#008fa3] text-white",
        isLogin ? "animate-auth-overlay-in" : "animate-auth-overlay-out"
      )}
      aria-live="polite"
      aria-label={isLogin ? "Opening Asthra" : "Signing out of Asthra"}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),transparent_48%)]" />
      <div className="relative flex flex-col items-center gap-6">
        <div className="grid grid-cols-3 gap-3">
          {blocks.map((block) => (
            <span
              key={block}
              className={cn(
                "h-4 w-4 rounded-sm bg-white/90 shadow-sm",
                isLogin ? "animate-auth-block-in" : "animate-auth-block-out"
              )}
              style={{ animationDelay: `${isLogin ? block * 75 : (8 - block) * 65}ms` }}
            />
          ))}
        </div>
        <AsthraLogo
          className={cn(isLogin ? "animate-auth-logo-in" : "animate-auth-logo-out")}
          markClassName="h-24 w-24 rounded-[1.75rem] shadow-2xl"
        />
        <div className={cn("text-sm font-medium tracking-wide", isLogin ? "animate-auth-text-in" : "animate-auth-text-out")}>
          {isLogin ? "Opening workspace" : "Closing session"}
        </div>
      </div>
    </div>
  );
}
