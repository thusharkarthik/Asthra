export type Alert = {
  id: number;
  workspace_id: number;
  title: string;
  description?: string | null;
  source?: string | null;
  severity: string;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type PulseIncident = {
  id: number;
  workspace_id: number;
  alert_id?: number | null;
  title: string;
  description?: string | null;
  severity: string;
  status: string;
  commander_id?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type PulseIncidentCreate = {
  workspace_id: number;
  alert_id?: number | null;
  title: string;
  description?: string | null;
  severity?: string;
  status?: string;
  commander_id?: number | null;
};

export type TimelineEvent = {
  id: number;
  incident_id: number;
  event_type: string;
  content: string;
  created_by_id?: number | null;
  created_at?: string;
};

export type OnCallSchedule = {
  id: number;
  workspace_id: number;
  name: string;
  timezone?: string | null;
  rotation_notes?: string | null;
};

export type EscalationPolicy = {
  id: number;
  workspace_id: number;
  name: string;
  description?: string | null;
  steps?: string | null;
};

export type StatusPage = {
  id: number;
  workspace_id: number;
  name: string;
  description?: string | null;
  is_public: boolean;
};

export type StatusPageComponent = {
  id: number;
  status_page_id: number;
  name: string;
  status: string;
  description?: string | null;
};

export type Postmortem = {
  id: number;
  incident_id: number;
  summary: string;
  root_cause?: string | null;
  action_items?: string | null;
};

export type IncidentAISummary = {
  incident_id: number;
  current_situation?: string | null;
  impact?: string | null;
  likely_cause?: string | null;
  timeline_summary?: string | null;
  next_actions?: string[];
  customer_facing_update_draft?: string | null;
  raw_response?: string | null;
};
