export type Space = {
  id: number;
  workspace_id: number;
  project_id?: number | null;
  name: string;
  description?: string | null;
  created_by_id?: number | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Page = {
  id: number;
  space_id: number;
  parent_page_id?: number | null;
  title: string;
  content: string;
  status?: string;
  created_by_id?: number | null;
  updated_by_id?: number | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PageComment = {
  id: number;
  page_id: number;
  user_id?: number | null;
  content: string;
  created_at?: string;
};

export type SpaceCreate = {
  workspace_id: number;
  project_id?: number | null;
  name: string;
  description?: string | null;
  created_by_id: number;
};

export type PageCreate = {
  space_id: number;
  parent_page_id?: number | null;
  title: string;
  content: string;
  status?: string;
  created_by_id: number;
};

export type PageUpdate = Partial<Pick<PageCreate, "title" | "content" | "status" | "parent_page_id">> & {
  updated_by_id?: number | null;
};

export type PageVersion = {
  id: number;
  page_id: number;
  version_number: number;
  title: string;
  content: string;
  created_by_id: number;
  created_at: string;
};

export type PageFilters = {
  space_id?: number | null;
  status?: string | null;
  created_by_id?: number | null;
  parent_page_id?: number | null;
  limit?: number;
  offset?: number;
};
