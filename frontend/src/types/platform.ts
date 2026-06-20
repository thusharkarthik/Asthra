export type PlatformSource =
  | "core"
  | "flow"
  | "docs"
  | "discover"
  | "desk"
  | "pulse"
  | "dev"
  | "collab"
  | "automation"
  | "connect"
  | "guard"
  | "insights"
  | "media"
  | "ai";

export type PlatformEntityType =
  | "organization"
  | "workspace"
  | "project"
  | "work_item"
  | "docs_page"
  | "idea"
  | "ticket"
  | "incident"
  | "release"
  | "thread"
  | "workflow"
  | "dashboard"
  | "media_asset";

export type OperationalEntityType =
  | "flow_work_item"
  | "docs_page"
  | "discover_idea"
  | "desk_ticket"
  | "collab_thread"
  | "pulse_incident";

export type EntityReference = {
  source: PlatformSource;
  entity_type: PlatformEntityType | string;
  entity_id: string | number;
  title: string;
  href: string;
  description?: string;
};

export type CrossModuleLink = {
  id: string;
  source_type?: OperationalEntityType | string;
  source_id?: string | number;
  target_type?: OperationalEntityType | string;
  target_id?: string | number;
  relationship_type?: string;
  source?: EntityReference;
  target?: EntityReference;
  from: EntityReference;
  to: EntityReference;
  relation: string;
  created_by?: string | number | null;
  created_at?: string;
};

export type RelationshipCreate = {
  source_type: OperationalEntityType;
  source_id: string | number;
  target_type: OperationalEntityType;
  target_id: string | number;
  relationship_type: "relates_to" | "blocks" | "references" | "originates_from" | "documents" | "supports" | "duplicates";
  source_title?: string | null;
  target_title?: string | null;
  created_by?: string | number | null;
};

export type ActivityItem = {
  id: string;
  source: PlatformSource;
  actor: string;
  action: string;
  entity: EntityReference;
  timestamp: string;
};

export type NotificationItem = {
  id: string;
  type: "work_item_update" | "comment" | "mention" | "incident" | "approval" | "ai_assistant" | "invitation.pending" | string;
  title: string;
  message: string;
  href?: string;
  unread: boolean;
  created_at: string;
};

export type RecentItem = EntityReference & {
  viewed_at?: string;
  modified_at?: string;
};

export type FavoriteItem = EntityReference & {
  favorited_at: string;
};

export type WorkspaceDashboardSummary = {
  work: { label: string; value: string | number; href: string };
  docs: { label: string; value: string | number; href: string };
  discovery?: { label: string; value: string | number; href: string };
  desk?: { label: string; value: string | number; href: string };
  pulse?: { label: string; value: string | number; href: string };
  dev?: { label: string; value: string | number; href: string };
  incidents?: { label: string; value: string | number; href: string };
  engineering?: { label: string; value: string | number; href: string };
  ai: { label: string; value: string | number; href: string };
};
