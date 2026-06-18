"use client";

import type { FormEvent, ReactNode } from "react";
import { CreateDialog } from "@/components/modules/create-dialog";
import { Button } from "@/components/ui/button";

export function RequiredFieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-sm font-medium">
      {children} <span className="text-destructive">*</span>
    </span>
  );
}

export function FormField({
  label,
  required,
  helpText,
  error,
  children
}: {
  label: string;
  required?: boolean;
  helpText?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      {required ? <RequiredFieldLabel>{label}</RequiredFieldLabel> : <span className="text-sm font-medium">{label}</span>}
      {children}
      {helpText ? <span className="block text-xs text-muted-foreground">{helpText}</span> : null}
      {error ? <span className="block text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

export function FormActions({
  submitLabel,
  loadingLabel,
  isSubmitting,
  disabled,
  onCancel
}: {
  submitLabel: string;
  loadingLabel?: string;
  isSubmitting?: boolean;
  disabled?: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="sticky bottom-0 -mx-4 flex flex-wrap justify-end gap-2 border-t bg-card px-4 pb-1 pt-3">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button disabled={disabled || isSubmitting}>
        {isSubmitting ? (loadingLabel ?? "Saving...") : submitLabel}
      </Button>
    </div>
  );
}

export function EntityCreateDialog({
  title,
  open,
  onOpenChange,
  onSubmit,
  children,
  error,
  size = "default"
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  error?: string | null;
  size?: "default" | "wide";
}) {
  return (
    <CreateDialog title={title} open={open} onOpenChange={onOpenChange} size={size}>
      <form className="space-y-4" onSubmit={onSubmit}>
        {children}
        {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">{error}</p> : null}
      </form>
    </CreateDialog>
  );
}

export const EntityEditDialog = EntityCreateDialog;
