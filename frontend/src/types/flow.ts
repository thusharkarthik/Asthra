export type WorkItem = {
  id: number;
  project_id: number;
  parent_id?: number | null;
  item_level?: FlowItemLevel;
  title: string;
  description?: string | null;
  type_id?: number | null;
  status_id?: number | null;
  priority_id?: number | null;
  sprint_id?: number | null;
  assignee_id?: number | null;
  reporter_id?: number | null;
  due_date?: string | null;
  effort_score?: number | null;
  effort_size?: string | null;
  business_value?: string | null;
  risk_level?: string | null;
  complexity?: string | null;
  acceptance_criteria?: string | null;
  definition_of_done?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type WorkItemCreate = {
  project_id: number;
  parent_id?: number | null;
  item_level?: FlowItemLevel;
  title: string;
  description?: string | null;
  type_id?: number | null;
  status_id?: number | null;
  priority_id?: number | null;
  sprint_id?: number | null;
  assignee_id?: number | null;
  reporter_id?: number | null;
  due_date?: string | null;
  effort_score?: number | null;
  effort_size?: string | null;
  business_value?: string | null;
  risk_level?: string | null;
  complexity?: string | null;
  acceptance_criteria?: string | null;
  definition_of_done?: string | null;
  status_name?: string | null;
  priority_name?: string | null;
};

export type WorkItemUpdate = Partial<Omit<WorkItemCreate, "project_id" | "reporter_id">>;
export type WorkItemOperationalUpdate = WorkItemUpdate & {
  status_name?: string | null;
  priority_name?: string | null;
};

export type FlowItemLevel = "initiative" | "feature" | "work_item" | "subtask";
export type WorkItemRelationType = "blocks" | "blocked_by" | "related_to" | "duplicate_of";

export type WorkItemHierarchyNode = {
  id: number;
  project_id: number;
  parent_id?: number | null;
  item_level: FlowItemLevel;
  title: string;
  status_id?: number | null;
  priority_id?: number | null;
  children: WorkItemHierarchyNode[];
};

export type ProjectHierarchy = {
  project_id: number;
  items: WorkItemHierarchyNode[];
};

export type WorkItemRelation = {
  id: number;
  source_work_item_id: number;
  target_work_item_id: number;
  relation_type: WorkItemRelationType;
  description?: string | null;
  created_by_id?: number | null;
  target_title?: string | null;
  target_status_id?: number | null;
  target_priority_id?: number | null;
  created_at?: string;
};

export type WorkItemRelationCreate = {
  target_work_item_id: number;
  relation_type: WorkItemRelationType;
  description?: string | null;
  created_by_id?: number | null;
};

export type LinkedEntityType = "work_item" | "doc_page" | "discover_idea" | "desk_ticket" | "pulse_incident" | "dev_release";

export type LinkedEntity = {
  id: number;
  work_item_id: number;
  entity_type: LinkedEntityType;
  entity_id: string;
  entity_title: string;
  entity_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type LinkedEntityCreate = {
  entity_type: LinkedEntityType;
  entity_id: string;
  entity_title: string;
  entity_url?: string | null;
};

export type WorkItemAttachment = {
  id: number;
  work_item_id: number;
  uploaded_by_id?: number | null;
  file_name: string;
  file_url: string;
  file_type?: string | null;
  file_size?: number | null;
  uploaded_at?: string | null;
  created_at?: string;
  is_active?: boolean;
};

export type WorkItemAttachmentCreate = {
  file_name: string;
  file_url: string;
  file_type?: string | null;
  file_size?: number | null;
  uploaded_by_id?: number | null;
};

export type WorkflowCategory = "backlog" | "active" | "review" | "completed";

export type WorkflowStatus = {
  id: number;
  workflow_id?: number | null;
  name: string;
  key: string;
  category: WorkflowCategory;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type WorkflowTransition = {
  id: number;
  workflow_id: number;
  from_status_id: number;
  to_status_id: number;
  from_status_name?: string | null;
  to_status_name?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Workflow = {
  id: number;
  project_id?: number | null;
  workspace_id?: number | null;
  name: string;
  description?: string | null;
  is_default: boolean;
  statuses: WorkflowStatus[];
  transitions: WorkflowTransition[];
  created_at?: string;
  updated_at?: string;
};

export type WorkflowCreate = {
  project_id?: number | null;
  workspace_id?: number | null;
  name: string;
  description?: string | null;
  is_default?: boolean;
};

export type WorkflowUpdate = Partial<WorkflowCreate>;

export type WorkflowStatusCreate = {
  name: string;
  key?: string | null;
  category: WorkflowCategory;
  sort_order?: number;
};

export type WorkflowTransitionCreate = {
  from_status_id: number;
  to_status_id: number;
};

export type Board = {
  id: number;
  project_id?: number | null;
  workspace_id?: number | null;
  name: string;
  description?: string | null;
};

export type BoardColumn = {
  id: number;
  board_id: number;
  name: string;
  status_id?: number | null;
  sort_order?: number | null;
};

export type WorkItemComment = {
  id: number;
  work_item_id: number;
  user_id?: number | null;
  content: string;
  created_at?: string;
};

export type WorkItemFilters = {
  project_id?: number | null;
  status_id?: number | null;
  assignee_id?: number | null;
  priority_id?: number | null;
  sprint_id?: number | null;
  limit?: number;
  offset?: number;
};

export type SprintStatus = "planned" | "active" | "completed" | "cancelled";

export type Sprint = {
  id: number;
  project_id: number;
  name: string;
  goal?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status: SprintStatus;
  planned_work_count: number;
  completed_work_count: number;
  total_effort: number;
  created_at?: string;
  updated_at?: string;
};

export type SprintCreate = {
  project_id: number;
  name: string;
  goal?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: SprintStatus;
};

export type SprintUpdate = Partial<Omit<SprintCreate, "project_id">>;
