export type Ticket = {
  id: number;
  workspace_id: number;
  project_id?: number | null;
  queue_id?: number | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  requester_id?: number | null;
  assignee_id?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type TicketCreate = {
  workspace_id: number;
  project_id?: number | null;
  queue_id?: number | null;
  title: string;
  description: string;
  status?: string;
  priority?: string;
  requester_id?: number | null;
  assignee_id?: number | null;
};

export type Queue = {
  id: number;
  workspace_id: number;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SLA = {
  id: number;
  workspace_id: number;
  name: string;
  description?: string | null;
  response_time_minutes: number;
  resolution_time_minutes: number;
  priority: string;
  created_at?: string;
  updated_at?: string;
};

export type Approval = {
  id: number;
  ticket_id: number;
  approver_id?: number | null;
  status: string;
  note?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type DeskIncident = {
  id: number;
  workspace_id: number;
  ticket_id?: number | null;
  title: string;
  description: string;
  severity: string;
  status: string;
};

export type ChangeRequest = {
  id: number;
  workspace_id: number;
  ticket_id?: number | null;
  title: string;
  description: string;
  risk_level: string;
  status: string;
  requested_by_id?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type TicketComment = {
  id: number;
  ticket_id: number;
  author_id?: number | null;
  content: string;
  created_at?: string;
};

export type TicketAIClassification = {
  ticket_id: number;
  category?: string | null;
  priority_suggestion?: string | null;
  severity_suggestion?: string | null;
  routing_suggestion?: string | null;
  possible_duplicate_hints?: string | null;
  recommended_next_action?: string | null;
  raw_response?: string | null;
};

export type QueueCreate = {
  workspace_id: number;
  name: string;
  description?: string | null;
};

export type SLACreate = {
  workspace_id: number;
  name: string;
  description?: string | null;
  response_time_minutes?: number;
  resolution_time_minutes?: number;
  priority?: string;
};

export type ChangeRequestCreate = {
  workspace_id: number;
  ticket_id?: number | null;
  title: string;
  description: string;
  risk_level?: string;
  status?: string;
  requested_by_id?: number | null;
};
