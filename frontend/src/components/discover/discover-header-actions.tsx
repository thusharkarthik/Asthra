import Link from "next/link";
import { Bot, ClipboardPlus, Lightbulb, Map, MessageSquarePlus } from "lucide-react";

export function DiscoverHeaderActions({ onCreateIdea, onCreateFeatureRequest, onAddFeedback, onCreateRoadmapItem, onAiAnalyze }: {
  onCreateIdea?: () => void;
  onCreateFeatureRequest?: () => void;
  onAddFeedback?: () => void;
  onCreateRoadmapItem?: () => void;
  onAiAnalyze?: () => void;
}) {
  return (
    <>
      <button type="button" onClick={onCreateIdea} disabled={!onCreateIdea} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"><Lightbulb className="h-4 w-4" />Create Idea</button>
      <button type="button" onClick={onCreateFeatureRequest} disabled={!onCreateFeatureRequest} className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"><ClipboardPlus className="h-4 w-4" />Add Feature Request</button>
      <button type="button" onClick={onAddFeedback} disabled={!onAddFeedback} className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"><MessageSquarePlus className="h-4 w-4" />Add Feedback</button>
      <button type="button" onClick={onCreateRoadmapItem} disabled={!onCreateRoadmapItem} className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"><Map className="h-4 w-4" />Create Roadmap Item</button>
      {onAiAnalyze ? (
        <button type="button" onClick={onAiAnalyze} className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted"><Bot className="h-4 w-4" />AI Analyze Idea</button>
      ) : (
        <Link href="/discover/ideas" className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted"><Bot className="h-4 w-4" />AI Analyze Idea</Link>
      )}
    </>
  );
}
