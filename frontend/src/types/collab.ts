export type Thread = { id: number; workspace_id: number; project_id?: number | null; entity_type?: string | null; entity_id?: number | null; title: string; status: string; created_by_id: number };
export type ThreadMessage = { id: number; thread_id: number; author_id?: number | null; content: string; created_at?: string; updated_at?: string };
export type Mention = { id: number; workspace_id: number; mentioned_user_id: number; actor_user_id?: number | null; entity_type: string; entity_id: number };
export type Reaction = { id: number; workspace_id: number; user_id: number; entity_type: string; entity_id: number; emoji: string };
export type Announcement = { id: number; workspace_id: number; title: string; content: string; status: string; created_by_id: number };
export type ActivityStreamItem = { id: number; workspace_id: number; project_id?: number | null; actor_user_id?: number | null; entity_type: string; entity_id?: number | null; action: string; description?: string | null; created_at?: string };
export type TeamUpdate = { id: number; workspace_id: number; team_id?: number | null; title: string; content: string; status: string; created_by_id: number };
