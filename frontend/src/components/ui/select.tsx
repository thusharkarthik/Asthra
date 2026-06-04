import * as React from "react";
import { cn } from "@/lib/utils";

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary/30",
        props.className
      )}
    />
  );
}
