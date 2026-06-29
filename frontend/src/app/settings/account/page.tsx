"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, SettingsCard, SettingsDangerZone, SettingsLayout, SettingsSectionHeader } from "@/components/settings/settings-components";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { settingsApi } from "@/services/api/settings-api";

function passwordStrength(password: string): { label: string; color: string; width: string } {
  if (password.length === 0) return { label: "", color: "", width: "0%" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: "Weak", color: "bg-destructive", width: "25%" };
  if (score <= 2) return { label: "Fair", color: "bg-amber-500", width: "50%" };
  if (score <= 3) return { label: "Good", color: "bg-yellow-400", width: "70%" };
  return { label: "Strong", color: "bg-emerald-500", width: "100%" };
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function AccountSettingsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const addToast = useToastStore((state) => state.addToast);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateConfirmText, setDeactivateConfirmText] = useState("");
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const strength = passwordStrength(newPassword);

  const changePasswordMutation = useMutation({
    mutationFn: (payload: { current_password: string; new_password: string }) =>
      settingsApi.changePassword(accessToken ?? "", payload),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      addToast({ type: "success", title: "Password changed", message: "Your password has been updated successfully." });
    },
    onError: (error) => {
      setPasswordError(error instanceof Error ? error.message : "Unable to change password.");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => settingsApi.deactivateMyAccount(accessToken ?? ""),
    onSuccess: () => {
      addToast({ type: "success", title: "Account deactivated", message: "Your account has been deactivated." });
      logout();
    },
    onError: (error) => {
      setDeactivateError(error instanceof Error ? error.message : "Unable to deactivate account.");
    },
  });

  function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError(null);
    if (!currentPassword) { setPasswordError("Current password is required."); return; }
    if (!newPassword) { setPasswordError("New password is required."); return; }
    if (newPassword.length < 8) { setPasswordError("New password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match."); return; }
    changePasswordMutation.mutate({ current_password: currentPassword, new_password: newPassword });
  }

  function handleDeactivate() {
    if (deactivateConfirmText !== "DEACTIVATE") {
      setDeactivateError('Please type "DEACTIVATE" to confirm.');
      return;
    }
    setDeactivateError(null);
    deactivateMutation.mutate();
  }

  return (
    <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Account" }]} backHref="/settings" backLabel="Back to Settings">
      <SettingsSectionHeader title="Account" description="Manage your account security and status." />

      <SettingsCard title="Account Information">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{currentUser?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Full Name</dt>
            <dd className="font-medium">{currentUser?.full_name || <span className="text-muted-foreground">Not set</span>}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Account Status</dt>
            <dd>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${currentUser?.is_active !== false ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                {currentUser?.is_active !== false ? "Active" : "Inactive"}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Member Since</dt>
            <dd className="font-medium">{formatDate(currentUser?.created_at)}</dd>
          </div>
          {currentUser?.is_superuser ? (
            <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd><span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Superuser</span></dd>
            </div>
          ) : null}
        </dl>
      </SettingsCard>

      <SettingsCard title="Change Password">
        <form onSubmit={handleChangePassword} className="space-y-4" autoComplete="off">
          <FormField label="Current Password" required>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Your current password"
              autoComplete="current-password"
            />
          </FormField>
          <FormField label="New Password" required>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            {newPassword.length > 0 ? (
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: strength.width }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">Strength: {strength.label}</span>
              </div>
            ) : null}
          </FormField>
          <FormField label="Confirm New Password" required>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your new password"
              autoComplete="new-password"
            />
            {confirmPassword.length > 0 && newPassword !== confirmPassword ? (
              <span className="block text-xs text-destructive mt-1">Passwords do not match.</span>
            ) : null}
          </FormField>
          {passwordError ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{passwordError}</p>
          ) : null}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={changePasswordMutation.isPending || newPassword !== confirmPassword}
            >
              {changePasswordMutation.isPending ? "Changing…" : "Change Password"}
            </Button>
          </div>
        </form>
      </SettingsCard>

      <SettingsDangerZone
        description="Deactivating your account will immediately revoke your access to Asthra. You will be logged out and cannot log back in. A platform admin can reactivate your account."
        actions={
          <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => { setDeactivateOpen(true); setDeactivateConfirmText(""); setDeactivateError(null); }}>
            Deactivate Account
          </Button>
        }
      />

      {deactivateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-destructive">Deactivate Your Account</h2>
            <p className="text-sm text-muted-foreground">
              This will immediately revoke your access to Asthra. You will be logged out and cannot sign back in until a platform admin reactivates your account.
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Type <span className="font-mono font-bold">DEACTIVATE</span> to confirm
              </label>
              <Input
                value={deactivateConfirmText}
                onChange={(e) => setDeactivateConfirmText(e.target.value)}
                placeholder="DEACTIVATE"
                className="font-mono"
              />
            </div>
            {deactivateError ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{deactivateError}</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeactivateOpen(false)} disabled={deactivateMutation.isPending}>
                Cancel
              </Button>
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={handleDeactivate}
                disabled={deactivateMutation.isPending || deactivateConfirmText !== "DEACTIVATE"}
              >
                {deactivateMutation.isPending ? "Deactivating…" : "Deactivate Account"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </SettingsLayout>
  );
}
