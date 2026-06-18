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
  release_id?: number | null;
  assignee_id?: number | null;
  reporter_id?: number | null;
  due_date?: string | null;
  effort_score?: number | null;
  effort_size?: string | null;
  original_estimate_minutes?: number | null;
  remaining_estimate_minutes?: number | null;
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
  release_id?: number | null;
  assignee_id?: number | null;
  reporter_id?: number | null;
  due_date?: string | null;
  effort_score?: number | null;
  effort_size?: string | null;
  original_estimate_minutes?: number | null;
  remaining_estimate_minutes?: number | null;
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

export type WorkLog = {
  id: number;
  work_item_id: number;
  user_id?: number | null;
  description?: string | null;
  time_spent_minutes: number;
  logged_at: string;
  created_at: string;
};

export type WorkLogCreate = {
  user_id?: number | null;
  description?: string | null;
  time_spent_minutes: number;
  logged_at?: string | null;
};

export type WorkItemFilters = {
  project_id?: number | null;
  status_id?: number | null;
  assignee_id?: number | null;
  priority_id?: number | null;
  sprint_id?: number | null;
  release_id?: number | null;
  limit?: number;
  offset?: number;
};

export type WorkItemSearchFilters = {
  project_id?: number | null;
  text?: string | null;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  assignee_id?: number | null;
  reporter_id?: number | null;
  effort_size?: string | null;
  business_value?: string | null;
  risk_level?: string | null;
  complexity?: string | null;
  sprint_id?: number | null;
  release_id?: number | null;
  parent_id?: number | null;
  item_level?: FlowItemLevel | null;
  created_after?: string | null;
  created_before?: string | null;
  updated_after?: string | null;
  updated_before?: string | null;
  due_before?: string | null;
  due_after?: string | null;
  sort_by?: "created_at" | "updated_at" | "priority" | "due_date";
  sort_direction?: "asc" | "desc";
  page?: number;
  page_size?: number;
};

export type WorkItemSearchResponse = {
  items: WorkItem[];
  total: number;
  page: number;
  page_size: number;
};

export type SavedView = {
  id: number;
  workspace_id?: number | null;
  project_id: number;
  name: string;
  description?: string | null;
  filters: WorkItemSearchFilters;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type SavedViewCreate = {
  workspace_id?: number | null;
  project_id: number;
  name: string;
  description?: string | null;
  filters: WorkItemSearchFilters;
  is_default?: boolean;
};

export type SavedViewUpdate = Partial<SavedViewCreate>;

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

export type ReleaseStatus = "planned" | "active" | "released" | "cancelled";

export type Release = {
  id: number;
  project_id: number;
  name: string;
  version: string;
  description?: string | null;
  target_date?: string | null;
  actual_release_date?: string | null;
  status: ReleaseStatus;
  work_item_count: number;
  completed_work_count: number;
  completion_percentage: number;
  created_at?: string;
  updated_at?: string;
};

export type ReleaseCreate = {
  project_id: number;
  name: string;
  version: string;
  description?: string | null;
  target_date?: string | null;
  actual_release_date?: string | null;
  status?: ReleaseStatus;
};

export type ReleaseUpdate = Partial<Omit<ReleaseCreate, "project_id">>;

export type TeamCapacity = {
  id: number;
  project_id: number;
  user_id?: number | null;
  team_id?: number | null;
  sprint_id?: number | null;
  capacity_minutes: number;
  notes?: string | null;
};

export type TeamCapacityCreate = {
  project_id: number;
  user_id?: number | null;
  team_id?: number | null;
  sprint_id?: number | null;
  capacity_minutes: number;
  notes?: string | null;
};

export type TeamCapacityUpdate = Partial<Omit<TeamCapacityCreate, "project_id">>;

export type CustomFieldType = "text" | "number" | "select" | "date" | "checkbox";

export type CustomFieldDefinition = {
  id: number;
  project_id: number;
  name: string;
  field_type: CustomFieldType;
  required: boolean;
  options?: string[] | null;
  created_at?: string;
};

export type CustomFieldDefinitionCreate = {
  project_id: number;
  name: string;
  field_type: CustomFieldType;
  required?: boolean;
  options?: string[] | null;
};

export type CustomFieldDefinitionUpdate = Partial<Omit<CustomFieldDefinitionCreate, "project_id">>;

export type CustomFieldValue = {
  id: number;
  work_item_id: number;
  custom_field_id: number;
  value?: string | null;
};

export type CustomFieldValueUpsert = {
  custom_field_id: number;
  value?: string | number | boolean | null;
};

export type FlowNotification = {
  id: number;
  workspace_id?: number | null;
  project_id?: number | null;
  user_id?: number | null;
  work_item_id?: number | null;
  notification_type: "work_item_assigned" | "comment_added" | "status_changed" | "priority_changed" | "due_date_updated" | string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type FlowAuditEvent = {
  id: number;
  workspace_id?: number | null;
  project_id?: number | null;
  work_item_id?: number | null;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id?: number | null;
  actor_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

export type FlowAutomationTrigger = "work_item_created" | "status_changed" | "priority_changed" | "assignee_changed" | "comment_added";
export type FlowAutomationAction = "create_notification" | "add_comment" | "update_priority" | "update_status" | "assign_user";

export type FlowAutomationRule = {
  id: number;
  workspace_id?: number | null;
  project_id: number;
  name: string;
  description?: string | null;
  trigger_type: FlowAutomationTrigger;
  condition_config?: Record<string, unknown> | null;
  action_config?: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type FlowAutomationRuleCreate = {
  workspace_id?: number | null;
  project_id: number;
  name: string;
  description?: string | null;
  trigger_type: FlowAutomationTrigger;
  condition_config?: Record<string, unknown> | null;
  action_config?: Record<string, unknown> | null;
  is_active?: boolean;
};

export type FlowAutomationRuleUpdate = Partial<Omit<FlowAutomationRuleCreate, "project_id">> & {
  project_id?: number | null;
};

export type FlowAutomationRuleTestResult = {
  rule_id: number;
  matched: boolean;
  executed: boolean;
  message: string;
};
