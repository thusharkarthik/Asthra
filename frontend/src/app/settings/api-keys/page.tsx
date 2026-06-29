"use client";

import { type FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Plus, ShieldOff } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { settingsApi } from "@/services/api/settings-api";
import type { ApiKeyRecord } from "@/types/core";
import {
  SettingsLayout,
  SettingsSectionHeader,
  SettingsCreateDialog,
  FormField,
  FormActions,
} from "@/components/settings/settings-components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyModuleState, ErrorState } from "@/components/layout/ui-states";

const SELECT_CLASS =
  "w-full h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30";

const EXPIRY_OPTIONS = [
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
  { value: "", label: "Never" },
];

const SCOPE_OPTIONS = [
  { value: "read", label: "Read — GET requests only" },
  { value: "write", label: "Write — GET, POST, PATCH" },
  { value: "admin", label: "Admin — Full access" },
];

function computeExpiresAt(expiryDays: string): string | null {
  if (!expiryDays) return null;
  const d = new Date();
  d.setDate(d.getDate() + parseInt(expiryDays, 10));
  return d.toISOString();
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRelativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86_400_000);
  if (diffDays < 0) return `Expired ${Math.abs(diffDays)}d ago`;
  if (diffDays === 0) return "Expires today";
  if (diffDays === 1) return "Expires tomorrow";
  if (diffDays < 30) return `Expires in ${diffDays}d`;
  return formatDate(dateStr);
}

function getKeyStatus(record: ApiKeyRecord): "active" | "expired" | "revoked" {
  if (!record.is_active) return "revoked";
  if (record.expires_at && new Date(record.expires_at) < new Date()) return "expired";
  return "active";
}

function StatusBadge({ record }: { record: ApiKeyRecord }) {
  const status = getKeyStatus(record);
  const styles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    expired: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    revoked: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };
  const labels: Record<string, string> = { active: "Active", expired: "Expired", revoked: "Revoked" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function ApiKeysSettingsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyRecord | null>(null);

  const keysQuery = useQuery({
    queryKey: ["settings", "api-keys"],
    queryFn: () => settingsApi.listApiKeys(accessToken ?? ""),
    enabled: Boolean(accessToken),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof settingsApi.createApiKey>[1]) =>
      settingsApi.createApiKey(accessToken ?? "", payload),
    onSuccess: (response) => {
      setCreateOpen(false);
      setRevealedKey(response.api_key ?? null);
      setKeyCopied(false);
      queryClient.invalidateQueries({ queryKey: ["settings", "api-keys"] });
    },
    onError: () => {
      addToast({ type: "error", title: "Create failed", message: "Could not create API key." });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (keyId: number) => settingsApi.revokeApiKey(accessToken ?? "", keyId),
    onSuccess: () => {
      setRevokeTarget(null);
      queryClient.invalidateQueries({ queryKey: ["settings", "api-keys"] });
      addToast({ type: "success", title: "Key revoked", message: "The API key has been revoked." });
    },
    onError: () => {
      addToast({ type: "error", title: "Revoke failed", message: "Could not revoke the API key." });
    },
  });

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const scope = (form.elements.namedItem("scope") as HTMLSelectElement).value;
    const expiryDays = (form.elements.namedItem("expiry") as HTMLSelectElement).value;
    if (!name) return;
    createMutation.mutate({ name, scopes: [scope], expires_at: computeExpiresAt(expiryDays) });
  }

  async function handleCopy() {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setKeyCopied(true);
    } catch {
      setKeyCopied(true);
    }
  }

  const keys = keysQuery.data ?? [];
  const breadcrumbs = [{ label: "Settings", href: "/settings" }, { label: "API Keys" }];

  return (
    <SettingsLayout breadcrumbs={breadcrumbs} backHref="/settings" backLabel="Back to Settings">
      <SettingsSectionHeader
        title="API Keys"
        description="Create and manage personal API keys for programmatic access to Asthra."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create API Key
          </Button>
        }
      />

      {keysQuery.isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading API keys…</div>
      ) : keysQuery.isError ? (
        <ErrorState title="Failed to load API keys" description="Check the API gateway and core-service are running." />
      ) : keys.length === 0 ? (
        <EmptyModuleState
          title="No API keys yet"
          description="Create your first API key to access Asthra programmatically."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Prefix</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Scope</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Created</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Expires</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Last Used</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5 font-medium">{k.name}</td>
                  <td className="px-3 py-2.5">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{k.key_prefix}…</code>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {(k.scopes ?? []).join(", ") || "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                    {formatDate(k.created_at)}
                  </td>
                  <td
                    className="whitespace-nowrap px-3 py-2.5 text-muted-foreground"
                    title={k.expires_at ? new Date(k.expires_at).toLocaleString() : undefined}
                  >
                    {formatRelativeDate(k.expires_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                    {k.last_used_at ? formatDate(k.last_used_at) : "Never"}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge record={k} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {getKeyStatus(k) === "active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setRevokeTarget(k)}
                      >
                        <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
                        Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create API Key dialog */}
      <SettingsCreateDialog
        title="Create API Key"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        error={createMutation.isError ? "Failed to create API key. Please try again." : null}
      >
        <FormField label="Name" required>
          <Input name="name" placeholder="e.g. CI/CD pipeline key" autoFocus />
        </FormField>
        <FormField label="Scope" required>
          <select name="scope" defaultValue="read" className={SELECT_CLASS}>
            {SCOPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Expiry">
          <select name="expiry" defaultValue="90" className={SELECT_CLASS}>
            {EXPIRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FormField>
        <FormActions
          submitLabel="Create API Key"
          isSubmitting={createMutation.isPending}
          onCancel={() => setCreateOpen(false)}
        />
      </SettingsCreateDialog>

      {/* Key reveal modal */}
      {revealedKey && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Your API Key"
        >
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-lg border bg-card shadow-lg">
            <div className="shrink-0 border-b p-4">
              <h2 className="text-sm font-semibold">Your API Key</h2>
            </div>
            <div className="space-y-4 p-4">
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-400">
                <span className="shrink-0">⚠️</span>
                <span>Copy this key now. You won&apos;t be able to see it again after closing.</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded-md bg-muted px-3 py-2 text-sm font-mono">
                  {revealedKey}
                </code>
                <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
                  {keyCopied ? (
                    <Check className="mr-1.5 h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="mr-1.5 h-4 w-4" />
                  )}
                  {keyCopied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={keyCopied}
                  onChange={(e) => setKeyCopied(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                I have saved this key in a safe place
              </label>
            </div>
            <div className="shrink-0 border-t p-4 flex justify-end">
              <Button
                onClick={() => {
                  setRevealedKey(null);
                  setKeyCopied(false);
                }}
                disabled={!keyCopied}
              >
                I&apos;ve copied my key — Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke confirmation dialog */}
      {revokeTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Revoke API Key"
        >
          <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-lg border bg-card shadow-lg">
            <div className="shrink-0 border-b p-4">
              <h2 className="text-sm font-semibold">Revoke API Key</h2>
            </div>
            <div className="space-y-2 p-4">
              <p className="text-sm">
                Revoke <span className="font-medium">{revokeTarget.name}</span>?
              </p>
              <p className="text-sm text-muted-foreground">
                This will immediately invalidate the key. Any integrations using it will stop working.
              </p>
            </div>
            <div className="shrink-0 border-t p-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRevokeTarget(null)}
                disabled={revokeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="bg-destructive text-destructive-foreground hover:opacity-90"
                onClick={() => revokeMutation.mutate(revokeTarget.id)}
                disabled={revokeMutation.isPending}
              >
                {revokeMutation.isPending ? "Revoking…" : "Revoke Key"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </SettingsLayout>
  );
}
