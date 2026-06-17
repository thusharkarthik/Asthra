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
  limit?: number;
  offset?: number;
};
