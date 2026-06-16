export type WorkItem = {
  id: number;
  project_id: number;
  title: string;
  description?: string | null;
  type_id?: number | null;
  status_id?: number | null;
  priority_id?: number | null;
  assignee_id?: number | null;
  reporter_id?: number | null;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type WorkItemCreate = {
  project_id: number;
  title: string;
  description?: string | null;
  type_id?: number | null;
  status_id?: number | null;
  priority_id?: number | null;
  assignee_id?: number | null;
  reporter_id?: number | null;
  due_date?: string | null;
};

export type WorkItemUpdate = Partial<Omit<WorkItemCreate, "project_id" | "reporter_id">>;
export type WorkItemOperationalUpdate = WorkItemUpdate & {
  status_name?: string | null;
  priority_name?: string | null;
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
