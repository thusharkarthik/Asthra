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
  from: EntityReference;
  to: EntityReference;
  relation: string;
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
