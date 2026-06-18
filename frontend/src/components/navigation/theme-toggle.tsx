"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = resolvedTheme === "dark";
  const Icon = isDark ? Sun : Moon;
  const nextTheme = isDark ? "light" : "dark";

  return (
    <Button
      aria-label="Toggle theme"
      title={`Current theme: ${mounted ? theme ?? resolvedTheme : "system"}. Switch to ${nextTheme}.`}
      size="icon"
      variant="ghost"
      className={cn(
        "border",
        isDark
          ? "border-white/10 bg-white/10 text-white hover:bg-white/15"
          : "border-border bg-muted text-foreground hover:bg-muted/80",
        className
      )}
      onClick={() => setTheme(nextTheme)}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
