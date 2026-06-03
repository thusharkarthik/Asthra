import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders dashboard placeholder cards", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByText("Recent Work")).toBeInTheDocument();
    expect(screen.getByText("Recent Docs")).toBeInTheDocument();
    expect(screen.getByText("AI Suggestions")).toBeInTheDocument();
  });
});
