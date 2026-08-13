import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { EntityDangerZone, EntityDetailLayout, EntityLinksPanel, EntityMetadataPanel } from "@/components/modules/entity-detail-layout";
import { EntityCreateDialog, FormActions, FormField } from "@/components/modules/entity-form";
import { PlatformSetupGuide } from "@/components/platform/platform-setup-guide";
import { ToastViewport } from "@/components/platform/toast-viewport";
import { Input } from "@/components/ui/input";
import { useToastStore } from "@/stores/toast-store";

describe("product usability components", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("renders setup guide with create organization action", () => {
    render(<PlatformSetupGuide moduleName="Flow" hasOrganization={false} hasWorkspace={false} hasProject={false} requiresProject />);

    expect(screen.getByRole("heading", { name: /create an organization/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create Organization" })).toHaveAttribute("href", "/settings/workspace");
  });

  it("renders create dialog field validation structure", () => {
    const submit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());

    render(
      <EntityCreateDialog title="Create demo" open onOpenChange={vi.fn()} onSubmit={submit}>
        <FormField label="Name" required error="Required">
          <Input aria-label="Name" />
        </FormField>
        <FormActions submitLabel="Create" onCancel={vi.fn()} disabled />
      </EntityCreateDialog>
    );

    expect(screen.getByRole("dialog", { name: "Create demo" })).toBeInTheDocument();
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  it("renders shared detail layout panels", () => {
    render(
      <EntityDetailLayout
        header={<h1>Demo entity</h1>}
        overview={<section>Overview content</section>}
        metadata={<EntityMetadataPanel>Owner User 1</EntityMetadataPanel>}
        links={<EntityLinksPanel labels={["Linked Docs"]} />}
        dangerZone={<EntityDangerZone />}
      />
    );

    expect(screen.getByText("Demo entity")).toBeInTheDocument();
    expect(screen.getByText("Owner User 1")).toBeInTheDocument();
    expect(screen.getByText("Linked Docs")).toBeInTheDocument();
    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
  });

  it("renders toast feedback and dismisses it", () => {
    useToastStore.getState().addToast({ id: "toast-test", type: "success", title: "Created", message: "Entity saved." });

    render(<ToastViewport />);

    expect(screen.getByText("Created")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss toast" }));
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
