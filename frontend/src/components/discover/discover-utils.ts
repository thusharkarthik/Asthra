import type { Idea, RoadmapItem } from "@/types/discover";

export const DISCOVER_IDEA_STATUSES = ["captured", "reviewing", "validating", "approved", "rejected", "converted_to_work"];
export const DISCOVER_REQUEST_STATUSES = ["new", "reviewing", "accepted", "declined", "planned"];
export const DISCOVER_SENTIMENTS = ["positive", "neutral", "negative"];

export function discoverDate(value?: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function isValidatedIdea(idea: Idea) {
  return ["approved", "converted_to_work"].includes(idea.status);
}

export function isHighImpactIdea(idea: Idea) {
  const text = `${idea.title} ${idea.description} ${idea.problem_statement ?? ""} ${idea.business_value ?? ""}`.toLowerCase();
  return (idea.impact_score ?? 0) >= 8 || idea.status === "approved" || idea.status === "converted_to_work" || text.includes("revenue") || text.includes("customer") || text.includes("retention");
}

export function needsValidation(idea: Idea) {
  return ["captured", "reviewing", "validating"].includes(idea.status);
}

export function roadmapBucket(item: RoadmapItem) {
  const status = item.status.toLowerCase();
  if (status.includes("progress") || status.includes("now")) return "Now";
  if (status.includes("planned") || item.target_quarter) return "Next";
  return "Later";
}
