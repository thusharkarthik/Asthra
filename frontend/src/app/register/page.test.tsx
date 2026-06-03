import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RegisterPage from "@/app/register/page";
import { useAuthStore } from "@/stores/auth-store";

const navigationMock = (
  globalThis as typeof globalThis & {
    __asthraNavigationMock: { pathname: string; push: ReturnType<typeof vi.fn>; replace: ReturnType<typeof vi.fn> };
  }
).__asthraNavigationMock;

describe("RegisterPage", () => {
  beforeEach(() => {
    navigationMock.replace.mockClear();
    useAuthStore.setState({ isAuthenticated: false, isLoading: false, error: null });
  });

  it("renders the register form", () => {
    render(<RegisterPage />);

    expect(screen.getByRole("heading", { name: "Create account" })).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });
});
