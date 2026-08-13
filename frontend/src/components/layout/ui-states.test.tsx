import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModulePageShell } from "@/components/layout/module-page-shell";
import { EmptyModuleState, ErrorState, RetryButton, TableSkeleton } from "@/components/layout/ui-states";

describe("shared UI states", () => {
  it("renders empty module state", () => {
    render(<EmptyModuleState title="No records" description="Create the first item to get started." />);
    expect(screen.getByText("No records")).toBeInTheDocument();
    expect(screen.getByText("Create the first item to get started.")).toBeInTheDocument();
  });

  it("renders error state and retry action", () => {
    const onRetry = vi.fn();
    render(<ErrorState title="API failed" description="Try again later." onRetry={onRetry} />);
    expect(screen.getByText("API failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("renders retry button", () => {
    render(<RetryButton />);
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("renders table skeleton", () => {
    render(<TableSkeleton rows={2} />);
    expect(screen.getByLabelText("Loading table")).toBeInTheDocument();
  });

  it("renders module page shell summary and content", () => {
    render(
      <ModulePageShell title="Demo Module" description="Consistent module layout" summary={[{ title: "Items", value: 3 }]}>
        <div>Main content area</div>
      </ModulePageShell>
    );

    expect(screen.getByRole("heading", { name: "Demo Module" })).toBeInTheDocument();
    expect(screen.getByText("Items")).toBeInTheDocument();
    expect(screen.getByText("Main content area")).toBeInTheDocument();
  });
});
