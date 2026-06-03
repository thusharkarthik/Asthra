import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "@/app/login/page";
import { useAuthStore } from "@/stores/auth-store";

const navigationMock = (
  globalThis as typeof globalThis & {
    __asthraNavigationMock: { pathname: string; push: ReturnType<typeof vi.fn>; replace: ReturnType<typeof vi.fn> };
  }
).__asthraNavigationMock;

describe("LoginPage", () => {
  beforeEach(() => {
    navigationMock.replace.mockClear();
    useAuthStore.setState({ isAuthenticated: false, isLoading: false, error: null });
  });

  it("renders the login form", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });
});
