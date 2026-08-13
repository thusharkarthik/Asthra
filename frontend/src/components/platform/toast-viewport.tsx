"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToastStore } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) => window.setTimeout(() => removeToast(toast.id), 4000));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [removeToast, toasts]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[70] w-[min(420px,calc(100vw-2rem))] space-y-2" aria-live="polite" aria-label="Toast notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-lg border bg-card p-3 shadow-lg",
            toast.type === "success" && "border-primary/30",
            toast.type === "error" && "border-destructive/40",
            toast.type === "info" && "border-muted"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{toast.title}</p>
              {toast.message ? <p className="mt-1 text-sm text-muted-foreground">{toast.message}</p> : null}
            </div>
            <Button aria-label="Dismiss toast" size="icon" variant="ghost" onClick={() => removeToast(toast.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
