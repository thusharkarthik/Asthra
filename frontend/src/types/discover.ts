export type Idea = {
  id: number;
  workspace_id: number;
  project_id?: number | null;
  title: string;
  description: string;
  problem_statement?: string | null;
  problem?: string | null;
  target_users?: string | null;
  target_user?: string | null;
  business_value?: string | null;
  impact_score?: number | null;
  confidence_score?: number | null;
  effort_score?: number | null;
  status: string;
  docs_page_id?: number | null;
  flow_epic_id?: number | null;
  created_by_id: number;
  created_at?: string;
  updated_at?: string;
};

export type IdeaCreate = {
  workspace_id: number;
  project_id?: number | null;
  title: string;
  description: string;
  problem_statement?: string | null;
  problem?: string | null;
  target_users?: string | null;
  target_user?: string | null;
  business_value?: string | null;
  impact_score?: number | null;
  confidence_score?: number | null;
  effort_score?: number | null;
  status?: string;
  created_by_id: number;
};

export type FeatureRequest = {
  id: number;
  idea_id?: number | null;
  workspace_id: number;
  title: string;
  description: string;
  source?: string | null;
  requested_by?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type Feedback = {
  id: number;
  workspace_id: number;
  idea_id?: number | null;
  feature_request_id?: number | null;
  source: string;
  author?: string | null;
  content: string;
  sentiment?: string | null;
  created_at?: string;
};

export type MVPPlan = {
  id: number;
  idea_id: number;
  scope: string;
  assumptions?: string | null;
  risks?: string | null;
  success_metrics?: string | null;
};

export type RoadmapItem = {
  id: number;
  workspace_id: number;
  idea_id?: number | null;
  title: string;
  description?: string | null;
  target_quarter?: string | null;
  status: string;
  sort_order?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type IdeaAIAnalysis = {
  idea_id: number;
  summary?: string | null;
  feasibility?: string | null;
  risks?: string | null;
  mvp_suggestion?: string | null;
  next_steps?: string | null;
  raw_response?: string | null;
};

export type LifecycleRelationship = {
  id: number;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relationship_type: string;
  title?: string | null;
  label?: string | null;
  metadata_json?: string | null;
  created_at?: string;
};

export type LifecycleRelationshipCreate = {
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relationship_type: string;
  title?: string | null;
  label?: string | null;
  metadata_json?: string | null;
};

export type LifecycleGraph = {
  idea_id: string;
  relationships: LifecycleRelationship[];
  documents: LifecycleRelationship[];
  work_items: LifecycleRelationship[];
  roadmap_items: LifecycleRelationship[];
  sprints: LifecycleRelationship[];
  releases: LifecycleRelationship[];
};

export type DiscoverDocLink = {
  id: number;
  source_type: string;
  source_id: number;
  docs_page_id: number;
  title: string;
  status?: string | null;
  created_at?: string;
};

export type DiscoverFlowLink = {
  id: number;
  idea_id: number;
  flow_work_item_id: number;
  flow_item_type: string;
  title: string;
  status?: string | null;
  created_at?: string;
};

export type IdeaExecutionLinks = {
  idea_id: number;
  documents: DiscoverDocLink[];
  flow_work: DiscoverFlowLink[];
};

export type DeliveryPipeline = {
  ideas: Array<Record<string, unknown>>;
  specifications: Array<Record<string, unknown>>;
  epics: Array<Record<string, unknown>>;
  stories: Array<Record<string, unknown>>;
  tasks: Array<Record<string, unknown>>;
  completed: Array<Record<string, unknown>>;
  counts: Record<string, number>;
};

export type FeatureRequestCreate = {
  idea_id?: number | null;
  workspace_id: number;
  title: string;
  description: string;
  source?: string | null;
  requested_by?: string | null;
  status?: string;
};

export type FeedbackCreate = {
  workspace_id: number;
  idea_id?: number | null;
  feature_request_id?: number | null;
  source: string;
  author?: string | null;
  content: string;
  sentiment?: string | null;
};
