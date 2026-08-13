export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  sources?: AssistantSource[];
};

export type AssistantConversation = {
  id: string;
  title: string;
  messages: AssistantMessage[];
};

export type AssistantSession = {
  id: number | string;
  workspace_id?: number | null;
  title?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AssistantSource = {
  title?: string | null;
  source_type?: string | null;
  entity_id?: string | number | null;
  snippet?: string | null;
  score?: number | null;
};

export type AssistantChatRequest = {
  workspace_id: number;
  session_id?: number | string | null;
  message: string;
};

export type AssistantChatResponse = {
  answer: string;
  session_id?: number | string | null;
  message_id?: number | string | null;
  sources?: AssistantSource[];
  context_metadata?: Record<string, unknown> | null;
  tool_usage?: unknown[];
};

export type WorkspaceSearchRequest = {
  workspace_id: number;
  query: string;
  top_k?: number;
};

export type WorkspaceSearchResult = {
  id?: string | number;
  title: string;
  source_type: "docs_page" | "work_item" | "idea" | "support_ticket" | "incident" | "release" | "discussion_thread" | string;
  snippet?: string | null;
  chunk?: string | null;
  score?: number | null;
  entity_id?: string | number | null;
};

export type WorkspaceSearchResponse = {
  results: WorkspaceSearchResult[];
  query?: string;
  workspace_id?: number;
  metadata?: Record<string, unknown> | null;
};
