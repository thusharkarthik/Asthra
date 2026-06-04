import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "md" | "icon";
};

export function Button({ className, variant = "default", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-primary px-3 text-primary-foreground hover:opacity-90",
        variant === "ghost" && "hover:bg-muted",
        variant === "outline" && "border bg-background hover:bg-muted",
        size === "sm" && "h-8 px-2",
        size === "md" && "h-9 px-3",
        size === "icon" && "h-9 w-9",
        className
      )}
      {...props}
    />
  );
}
