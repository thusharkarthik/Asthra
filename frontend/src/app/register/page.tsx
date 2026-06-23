"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AsthraLogo } from "@/components/brand/asthra-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";

const AUTH_LOGIN_TRANSITION_MS = 1850;
const AUTH_ROUTE_SWAP_DELAY_MS = 250;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const storeError = useAuthStore((state) => state.error);
  const setAuthTransition = useUIStore((state) => state.setAuthTransition);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isTransitioning) {
      router.replace("/");
    }
  }, [isAuthenticated, isTransitioning, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError("Email and password are required.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    try {
      setIsTransitioning(true);
      await register({
        email: email.trim(),
        password,
        full_name: fullName.trim() || null
      });
      setAuthTransition("login");
      await wait(AUTH_ROUTE_SWAP_DELAY_MS);
      router.replace("/");
      await wait(AUTH_LOGIN_TRANSITION_MS - AUTH_ROUTE_SWAP_DELAY_MS + 100);
      setAuthTransition(null);
    } catch {
      setIsTransitioning(false);
      setAuthTransition(null);
      setFormError(null);
    }
  };

  return (
    <section className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <AsthraLogo className="mb-3" markClassName="h-10 w-10 rounded-md" />
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Register with core-service through the API Gateway.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium">
          Full name
          <Input
            className="mt-1"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            aria-label="Full name"
          />
        </label>
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
            autoComplete="new-password"
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
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link className="font-medium text-primary hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </section>
  );
}
