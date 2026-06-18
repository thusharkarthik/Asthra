"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlowBreadcrumbs } from "@/components/flow/flow-breadcrumbs";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { PageHeader } from "@/components/layout/page-header";
import { DetailPanel } from "@/components/modules/detail-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { CustomFieldDefinition, CustomFieldType } from "@/types/flow";

const FIELD_TYPES: CustomFieldType[] = ["text", "number", "select", "date", "checkbox"];

export default function FlowCustomFieldsSettingsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("text");
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editRequired, setEditRequired] = useState(false);
  const [editOptions, setEditOptions] = useState("");

  const fieldsQuery = useQuery({
    queryKey: ["flow", "custom-fields", selectedProjectId],
    queryFn: () => flowApi.listCustomFieldDefinitions(accessToken ?? "", { project_id: selectedProjectId }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const fields = fieldsQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: () => flowApi.createCustomFieldDefinition(accessToken ?? "", {
      project_id: selectedProjectId ?? 0,
      name: name.trim(),
      field_type: fieldType,
      required,
      options: fieldType === "select" ? parseOptions(options) : null
    }),
    onSuccess: () => {
      setName("");
      setFieldType("text");
      setRequired(false);
      setOptions("");
      addToast({ type: "success", title: "Custom field created" });
      queryClient.invalidateQueries({ queryKey: ["flow", "custom-fields"] });
    },
    onError: (error) => addToast({ type: "error", title: "Custom field create failed", message: error instanceof Error ? error.message : "Unable to create custom field." })
  });
  const updateMutation = useMutation({
    mutationFn: (field: CustomFieldDefinition) => flowApi.updateCustomFieldDefinition(accessToken ?? "", field.id, {
      name: editName.trim(),
      required: editRequired,
      options: field.field_type === "select" ? parseOptions(editOptions) : null
    }),
    onSuccess: () => {
      setEditingId(null);
      addToast({ type: "success", title: "Custom field updated" });
      queryClient.invalidateQueries({ queryKey: ["flow", "custom-fields"] });
    },
    onError: (error) => addToast({ type: "error", title: "Custom field update failed", message: error instanceof Error ? error.message : "Unable to update custom field." })
  });
  const deleteMutation = useMutation({
    mutationFn: (fieldId: number) => flowApi.deleteCustomFieldDefinition(accessToken ?? "", fieldId),
    onSuccess: () => {
      addToast({ type: "success", title: "Custom field deleted" });
      queryClient.invalidateQueries({ queryKey: ["flow", "custom-fields"] });
    },
    onError: (error) => addToast({ type: "error", title: "Custom field delete failed", message: error instanceof Error ? error.message : "Unable to delete custom field." })
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim()) createMutation.mutate();
  };

  const startEdit = (field: CustomFieldDefinition) => {
    setEditingId(field.id);
    setEditName(field.name);
    setEditRequired(field.required);
    setEditOptions((field.options ?? []).join(", "));
  };

  return (
    <>
      <PageHeader title="Flow Custom Fields" description="Define project-specific fields that appear on work items." breadcrumbs={<FlowBreadcrumbs items={[{ label: "Settings", href: "/flow/settings/workflows" }, { label: "Custom Fields" }]} />} />
      <FlowSubnav />
      {!selectedProjectId ? (
        <DetailPanel title="Select a project"><p className="text-sm text-muted-foreground">Choose a project before configuring custom fields.</p></DetailPanel>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <DetailPanel title="Project Fields">
            <div className="space-y-3">
              {fieldsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading custom fields...</p> : null}
              {fields.length === 0 && !fieldsQuery.isLoading ? <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No custom fields yet. Create one to capture project-specific data.</p> : null}
              {fields.map((field) => (
                <div key={field.id} className="rounded-md border p-3">
                  {editingId === field.id ? (
                    <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); if (editName.trim()) updateMutation.mutate(field); }}>
                      <Input aria-label={`Edit ${field.name} name`} value={editName} onChange={(event) => setEditName(event.target.value)} />
                      {field.field_type === "select" ? <Input aria-label={`Edit ${field.name} options`} value={editOptions} onChange={(event) => setEditOptions(event.target.value)} /> : null}
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={editRequired} onChange={(event) => setEditRequired(event.target.checked)} />
                        Required
                      </label>
                      <div className="flex gap-2">
                        <Button size="sm" disabled={updateMutation.isPending}>Save</Button>
                        <Button size="sm" type="button" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{field.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{field.field_type} · {field.required ? "required" : "optional"}</div>
                        {field.options?.length ? <div className="mt-2 text-xs text-muted-foreground">Options: {field.options.join(", ")}</div> : null}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(field)}>Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => { if (window.confirm(`Delete custom field "${field.name}"?`)) deleteMutation.mutate(field.id); }}>Delete</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DetailPanel>
          <DetailPanel title="Create Field">
            <form className="space-y-2" onSubmit={handleCreate}>
              <Input aria-label="Custom field name" placeholder="Field name" value={name} onChange={(event) => setName(event.target.value)} />
              <Select aria-label="Custom field type" value={fieldType} onChange={(event) => setFieldType(event.target.value as CustomFieldType)}>
                {FIELD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </Select>
              {fieldType === "select" ? <Input aria-label="Custom field options" placeholder="Options, comma separated" value={options} onChange={(event) => setOptions(event.target.value)} /> : null}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} />
                Required
              </label>
              <Button className="w-full" disabled={!name.trim() || (fieldType === "select" && parseOptions(options).length === 0) || createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create Field"}</Button>
            </form>
          </DetailPanel>
        </div>
      )}
    </>
  );
}

function parseOptions(value: string) {
  return value.split(",").map((option) => option.trim()).filter(Boolean);
}
