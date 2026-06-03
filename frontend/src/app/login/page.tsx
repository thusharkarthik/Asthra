"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const storeError = useAuthStore((state) => state.error);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError("Email and password are required.");
      return;
    }

    try {
      await login({ email: email.trim(), password });
      router.replace("/");
    } catch {
      setFormError(null);
    }
  };

  return (
    <section className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          A
        </div>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Use your Asthra account to continue.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium">
          Email
          <Input
            className="mt-1"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-label="Email"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <Input
            className="mt-1"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-label="Password"
          />
        </label>
        {(formError || storeError) && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError ?? storeError}
          </div>
        )}
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        New to Asthra?{" "}
        <Link className="font-medium text-primary hover:underline" href="/register">
          Create an account
        </Link>
      </p>
    </section>
  );
}
