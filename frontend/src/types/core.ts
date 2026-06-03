export type CoreUser = {
  id: number;
  email: string;
  full_name: string | null;
  avatar_url?: string | null;
  job_title?: string | null;
  timezone?: string | null;
  locale?: string | null;
  is_active: boolean;
  is_superuser?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type Organization = {
  id: number;
  name: string;
  description?: string | null;
  owner_id?: number;
};

export type WorkspaceRecord = {
  id: number;
  organization_id: number;
  name: string;
  description?: string | null;
};

export type ProjectRecord = {
  id: number;
  workspace_id: number;
  name: string;
  description?: string | null;
  status?: string;
};
