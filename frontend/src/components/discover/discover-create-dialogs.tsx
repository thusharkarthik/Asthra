"use client";

import { FormEvent, TextareaHTMLAttributes, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateDialog } from "@/components/modules/create-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DISCOVER_IDEA_STATUSES, DISCOVER_REQUEST_STATUSES, DISCOVER_SENTIMENTS } from "@/components/discover/discover-utils";
import { discoverApi } from "@/services/api/discover-api";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

function DialogTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className="min-h-24 w-full rounded-md border bg-background p-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30" />;
}

export function CreateIdeaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [businessValue, setBusinessValue] = useState("");
  const [impactScore, setImpactScore] = useState("");
  const [confidenceScore, setConfidenceScore] = useState("");
  const [effortScore, setEffortScore] = useState("");
  const [status, setStatus] = useState("captured");

  const createMutation = useMutation({
    mutationFn: () =>
      discoverApi.createIdea(accessToken ?? "", {
        workspace_id: selectedWorkspaceId ?? 0,
        project_id: selectedProjectId,
        title,
        description,
        problem_statement: problemStatement || null,
        target_users: targetUsers || null,
        business_value: businessValue || null,
        impact_score: impactScore ? Number(impactScore) : null,
        confidence_score: confidenceScore ? Number(confidenceScore) : null,
        effort_score: effortScore ? Number(effortScore) : null,
        status,
        created_by_id: currentUser?.id ?? 1
      }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setProblemStatement("");
      setTargetUsers("");
      setBusinessValue("");
      setImpactScore("");
      setConfidenceScore("");
      setEffortScore("");
      setStatus("captured");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["discover"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.discover.dashboardSummary(selectedWorkspaceId) });
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWorkspaceId || !title.trim() || !description.trim()) return;
    createMutation.mutate();
  };

  return (
    <CreateDialog title="Create idea" open={open} onOpenChange={onOpenChange}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input aria-label="Idea title" placeholder="Idea title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <DialogTextarea aria-label="Idea description" placeholder="Describe the opportunity" value={description} onChange={(event) => setDescription(event.target.value)} />
        <DialogTextarea aria-label="Problem statement" placeholder="Problem statement" value={problemStatement} onChange={(event) => setProblemStatement(event.target.value)} />
        <Input aria-label="Target users" placeholder="Target users" value={targetUsers} onChange={(event) => setTargetUsers(event.target.value)} />
        <DialogTextarea aria-label="Business value" placeholder="Business value" value={businessValue} onChange={(event) => setBusinessValue(event.target.value)} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Input aria-label="Impact score" type="number" min="0" max="10" placeholder="Impact" value={impactScore} onChange={(event) => setImpactScore(event.target.value)} />
          <Input aria-label="Confidence score" type="number" min="0" max="10" placeholder="Confidence" value={confidenceScore} onChange={(event) => setConfidenceScore(event.target.value)} />
          <Input aria-label="Effort score" type="number" min="0" max="10" placeholder="Effort" value={effortScore} onChange={(event) => setEffortScore(event.target.value)} />
        </div>
        <Select aria-label="Idea status" value={status} onChange={(event) => setStatus(event.target.value)}>
          {DISCOVER_IDEA_STATUSES.map((option) => <option key={option} value={option}>{option.replace("_", " ")}</option>)}
        </Select>
        <Button disabled={createMutation.isPending || !selectedWorkspaceId || !title.trim() || !description.trim()}>
          {createMutation.isPending ? "Creating..." : "Create idea"}
        </Button>
        {createMutation.isError ? <p className="text-sm text-destructive">{createMutation.error.message}</p> : null}
      </form>
    </CreateDialog>
  );
}

export function CreateFeatureRequestDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("customer");
  const [requestedBy, setRequestedBy] = useState("");
  const [status, setStatus] = useState("new");

  const createMutation = useMutation({
    mutationFn: () =>
      discoverApi.createFeatureRequest(accessToken ?? "", {
        workspace_id: selectedWorkspaceId ?? 0,
        title,
        description,
        source,
        requested_by: requestedBy || null,
        status
      }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setSource("customer");
      setRequestedBy("");
      setStatus("new");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["discover"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.discover.dashboardSummary(selectedWorkspaceId) });
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWorkspaceId || !title.trim() || !description.trim()) return;
    createMutation.mutate();
  };

  return (
    <CreateDialog title="Add feature request" open={open} onOpenChange={onOpenChange}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input aria-label="Feature request title" placeholder="Feature request title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <DialogTextarea aria-label="Feature request description" placeholder="What was requested?" value={description} onChange={(event) => setDescription(event.target.value)} />
        <Input aria-label="Feature request source" placeholder="Source" value={source} onChange={(event) => setSource(event.target.value)} />
        <Input aria-label="Requested by" placeholder="Requested by" value={requestedBy} onChange={(event) => setRequestedBy(event.target.value)} />
        <Select aria-label="Feature request status" value={status} onChange={(event) => setStatus(event.target.value)}>
          {DISCOVER_REQUEST_STATUSES.map((option) => <option key={option} value={option}>{option.replace("_", " ")}</option>)}
        </Select>
        <Button disabled={createMutation.isPending || !selectedWorkspaceId || !title.trim() || !description.trim()}>
          {createMutation.isPending ? "Adding..." : "Add request"}
        </Button>
        {createMutation.isError ? <p className="text-sm text-destructive">{createMutation.error.message}</p> : null}
      </form>
    </CreateDialog>
  );
}

export function CreateFeedbackDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [source, setSource] = useState("interview");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [sentiment, setSentiment] = useState("neutral");

  const createMutation = useMutation({
    mutationFn: () =>
      discoverApi.createFeedback(accessToken ?? "", {
        workspace_id: selectedWorkspaceId ?? 0,
        source,
        author: author || null,
        content,
        sentiment
      }),
    onSuccess: () => {
      setSource("interview");
      setAuthor("");
      setContent("");
      setSentiment("neutral");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["discover"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.discover.dashboardSummary(selectedWorkspaceId) });
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWorkspaceId || !content.trim()) return;
    createMutation.mutate();
  };

  return (
    <CreateDialog title="Add feedback" open={open} onOpenChange={onOpenChange}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input aria-label="Feedback source" placeholder="Source" value={source} onChange={(event) => setSource(event.target.value)} />
        <Input aria-label="Feedback author" placeholder="Author" value={author} onChange={(event) => setAuthor(event.target.value)} />
        <DialogTextarea aria-label="Feedback content" placeholder="Capture customer or stakeholder feedback" value={content} onChange={(event) => setContent(event.target.value)} />
        <Select aria-label="Feedback sentiment" value={sentiment} onChange={(event) => setSentiment(event.target.value)}>
          {DISCOVER_SENTIMENTS.map((option) => <option key={option} value={option}>{option}</option>)}
        </Select>
        <Button disabled={createMutation.isPending || !selectedWorkspaceId || !content.trim()}>
          {createMutation.isPending ? "Adding..." : "Add feedback"}
        </Button>
        {createMutation.isError ? <p className="text-sm text-destructive">{createMutation.error.message}</p> : null}
      </form>
    </CreateDialog>
  );
}

export function CreateRoadmapItemDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetQuarter, setTargetQuarter] = useState("");
  const [status, setStatus] = useState("planned");

  const createMutation = useMutation({
    mutationFn: () =>
      discoverApi.createRoadmapItem(accessToken ?? "", {
        workspace_id: selectedWorkspaceId ?? 0,
        title,
        description: description || null,
        target_quarter: targetQuarter || null,
        status
      }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setTargetQuarter("");
      setStatus("planned");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["discover"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.discover.dashboardSummary(selectedWorkspaceId) });
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWorkspaceId || !title.trim()) return;
    createMutation.mutate();
  };

  return (
    <CreateDialog title="Create roadmap item" open={open} onOpenChange={onOpenChange}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input aria-label="Roadmap item title" placeholder="Roadmap item title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <DialogTextarea aria-label="Roadmap item description" placeholder="What outcome will this deliver?" value={description} onChange={(event) => setDescription(event.target.value)} />
        <Input aria-label="Target quarter" placeholder="Target quarter, for example Q3" value={targetQuarter} onChange={(event) => setTargetQuarter(event.target.value)} />
        <Select aria-label="Roadmap status" value={status} onChange={(event) => setStatus(event.target.value)}>
          {["planned", "in_progress", "shipped", "later"].map((option) => <option key={option} value={option}>{option.replace("_", " ")}</option>)}
        </Select>
        <Button disabled={createMutation.isPending || !selectedWorkspaceId || !title.trim()}>
          {createMutation.isPending ? "Creating..." : "Create roadmap item"}
        </Button>
        {createMutation.isError ? <p className="text-sm text-destructive">{createMutation.error.message}</p> : null}
      </form>
    </CreateDialog>
  );
}
