import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AsthraShell } from "@/layouts/asthra-shell";

describe("AsthraShell", () => {
  it("renders shell regions and child content", () => {
    render(
      <AsthraShell>
        <div>Test content</div>
      </AsthraShell>
    );

    expect(screen.getByText("Asthra")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /primary navigation/i })).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
    expect(screen.getByLabelText(/ai assistant/i)).toBeInTheDocument();
  });
});
