export type Workspace = {
  id: string;
  name: string;
};

export type Project = {
  id: string;
  name: string;
  workspaceId: string;
};
