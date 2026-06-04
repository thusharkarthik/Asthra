import type { Idea, RoadmapItem } from "@/types/discover";

export const DISCOVER_IDEA_STATUSES = ["new", "validating", "validated", "prioritized", "planned", "archived"];
export const DISCOVER_REQUEST_STATUSES = ["new", "reviewing", "accepted", "declined", "planned"];
export const DISCOVER_SENTIMENTS = ["positive", "neutral", "negative"];

export function discoverDate(value?: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function isValidatedIdea(idea: Idea) {
  return ["validated", "prioritized", "planned"].includes(idea.status);
}

export function isHighImpactIdea(idea: Idea) {
  const text = `${idea.title} ${idea.description} ${idea.problem_statement ?? ""}`.toLowerCase();
  return idea.status === "prioritized" || idea.status === "planned" || text.includes("revenue") || text.includes("customer") || text.includes("retention");
}

export function needsValidation(idea: Idea) {
  return ["new", "validating"].includes(idea.status);
}

export function roadmapBucket(item: RoadmapItem) {
  const status = item.status.toLowerCase();
  if (status.includes("progress") || status.includes("now")) return "Now";
  if (status.includes("planned") || item.target_quarter) return "Next";
  return "Later";
}
