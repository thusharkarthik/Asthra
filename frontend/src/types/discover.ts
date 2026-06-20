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
