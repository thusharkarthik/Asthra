"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { matchHelpContent, type HelpStep } from "@/lib/help-registry";
import { cn } from "@/lib/utils";

function AnimatedArrow({ visible }: { visible: boolean }) {
  return (
    <div
      className="self-center shrink-0 overflow-hidden transition-all duration-200 ease-out"
      style={{ width: visible ? "32px" : "0px", opacity: visible ? 1 : 0 }}
    >
      <div className="flex w-8 items-center">
        <div className="h-px flex-1 bg-muted-foreground/40" />
        <span className="text-xs leading-none text-muted-foreground/60">→</span>
      </div>
    </div>
  );
}

function StepCard({
  step,
  index,
  visible,
  active,
}: {
  step: HelpStep;
  index: number;
  visible: boolean;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all duration-300 ease-out",
        active && visible ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}
      style={{
        opacity: !visible ? 0 : active ? 1 : 0.65,
        transform: !visible
          ? "translateX(1rem)"
          : active
          ? "translateX(0) scale(1.05)"
          : "translateX(0) scale(1)",
        pointerEvents: !visible ? "none" : "auto",
      }}
    >
      {step.icon ? (
        <span className="text-base leading-none">{step.icon}</span>
      ) : (
        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] font-bold leading-none opacity-70">
          {index + 1}
        </span>
      )}
      <span className="whitespace-nowrap text-center text-xs font-medium leading-tight">
        {step.label}
      </span>
    </div>
  );
}

export function ContextualHelpModal({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  const content = matchHelpContent(pathname);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [arrowsVisible, setArrowsVisible] = useState<boolean[]>([]);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    if (!open) {
      setHeaderVisible(false);
      setVisibleSteps(0);
      setArrowsVisible([]);
      setCtaVisible(false);
      return;
    }

    const timers: number[] = [];
    timers.push(window.setTimeout(() => setHeaderVisible(true), 16));

    const { steps } = content;

    if (steps.length === 0) {
      timers.push(window.setTimeout(() => setCtaVisible(true), 300));
      return () => timers.forEach((t) => window.clearTimeout(t));
    }

    setArrowsVisible(new Array(steps.length - 1).fill(false));

    steps.forEach((_, index) => {
      const base = 700 + index * 850;

      if (index > 0) {
        timers.push(
          window.setTimeout(() => {
            setArrowsVisible((prev) => {
              const next = [...prev];
              next[index - 1] = true;
              return next;
            });
          }, base)
        );
      }

      timers.push(
        window.setTimeout(
          () => setVisibleSteps(index + 1),
          base + (index > 0 ? 200 : 0)
        )
      );
    });

    timers.push(
      window.setTimeout(
        () => setCtaVisible(true),
        700 + steps.length * 850 + 300
      )
    );

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [open, content]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const { steps } = content;
  const activeStep = visibleSteps - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Help: ${content.title}`}
    >
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl rounded-lg border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2
            className={cn(
              "text-sm font-semibold transition-all duration-300",
              headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            )}
          >
            {content.title}
          </h2>
          <Button variant="ghost" size="icon" aria-label="Close help" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-4 p-4">
          <p
            className={cn(
              "text-sm text-muted-foreground transition-all duration-200",
              headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            )}
            style={{ transitionDelay: "150ms" }}
          >
            {content.description}
          </p>
          {steps.length > 0 ? (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                How it works
              </p>
              <div className="flex flex-wrap items-start gap-y-3">
                {steps.map((step, index) => (
                  <div key={`step-${index}`} className="flex items-center">
                    {index > 0 ? (
                      <AnimatedArrow visible={arrowsVisible[index - 1] ?? false} />
                    ) : null}
                    <StepCard
                      step={step}
                      index={index}
                      visible={index < visibleSteps}
                      active={index === activeStep}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div
            className={cn(
              "flex items-center gap-2 pt-1 transition-all duration-300",
              ctaVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            {content.cta ? (
              <button
                type="button"
                className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                onClick={onClose}
              >
                {content.cta.label}
              </button>
            ) : null}
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none"
              onClick={onClose}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
