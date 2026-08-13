import { useSimulationStore } from "@/lib/permission-simulator";
import { useToastStore } from "@/stores/toast-store";
import {
  MOCK_USERS,
  MOCK_ORGANIZATIONS,
  MOCK_WORKSPACES,
  MOCK_PROJECTS,
  MOCK_ORG_MEMBERS,
  MOCK_WORKSPACE_MEMBERS,
  MOCK_TEAMS,
  MOCK_TEAM_MEMBERS,
  MOCK_API_KEYS,
  MOCK_NOTIFICATIONS,
  MOCK_AUDIT_LOGS,
  MOCK_ORG_SETTINGS,
  MOCK_WS_SETTINGS,
  MOCK_ORG_HEALTH,
  MOCK_EFFECTIVE_PERMISSIONS,
} from "@/lib/god-mode-mock-responses";

const PREFIX = "/api/core/api/v1";

// These paths always pass through to the real API (God Mode infrastructure or auth).
// Passthrough prefixes match the path itself AND any sub-paths.
const PASSTHROUGH_PREFIXES = [
  `${PREFIX}/context/`,         // platform context polling
  `${PREFIX}/auth/`,            // auth endpoints
  `${PREFIX}/me/`,              // /me/permissions, /me/change-password, etc.
  `${PREFIX}/access-control/`,  // simulate, debug, inventory, registry sync
  `${PREFIX}/roles`,            // God Mode toolbar needs real roles for role switcher
  `${PREFIX}/role-templates`,
  `${PREFIX}/role-assignments`,
  `${PREFIX}/permissions`,      // permission management tools need real data
];

function shouldPassThrough(path: string): boolean {
  for (const prefix of PASSTHROUGH_PREFIXES) {
    if (path.startsWith(prefix)) return true;
  }
  return false;
}

// Converts a pattern with :param segments into a regex that matches a single path segment.
// Example: "/api/core/api/v1/organizations/:id/members" → matches "/api/core/api/v1/organizations/9001/members"
function matchesPattern(path: string, pattern: string): boolean {
  const regexStr = pattern.replace(/:[^/]+/g, "[^/]+");
  return new RegExp(`^${regexStr}$`).test(path);
}

type MockEntry = {
  pattern: string;
  response: (path: string) => unknown;
};

// Ordered most-specific first so :param patterns don't shadow static segments.
const MOCK_REGISTRY: MockEntry[] = [
  // Current user profile page
  { pattern: `${PREFIX}/me`, response: () => MOCK_USERS[0] },

  // Organizations (specific sub-paths before :id catch-all)
  { pattern: `${PREFIX}/organizations/:id/members/:userId`, response: () => MOCK_ORG_MEMBERS[0] },
  { pattern: `${PREFIX}/organizations/:id/health`, response: () => MOCK_ORG_HEALTH },
  { pattern: `${PREFIX}/organizations/:id/settings`, response: () => MOCK_ORG_SETTINGS },
  { pattern: `${PREFIX}/organizations/:id/members`, response: () => MOCK_ORG_MEMBERS },
  { pattern: `${PREFIX}/organizations/:id`, response: () => MOCK_ORGANIZATIONS[0] },
  { pattern: `${PREFIX}/organizations`, response: () => MOCK_ORGANIZATIONS },

  // Workspaces
  { pattern: `${PREFIX}/workspaces/:id/members/:userId`, response: () => MOCK_WORKSPACE_MEMBERS[0] },
  { pattern: `${PREFIX}/workspaces/:id/settings`, response: () => MOCK_WS_SETTINGS },
  { pattern: `${PREFIX}/workspaces/:id/members`, response: () => MOCK_WORKSPACE_MEMBERS },
  { pattern: `${PREFIX}/workspaces/:id`, response: () => MOCK_WORKSPACES[0] },
  { pattern: `${PREFIX}/workspaces`, response: () => MOCK_WORKSPACES },

  // Projects
  { pattern: `${PREFIX}/projects/:id/members/:membershipId`, response: () => ({}) },
  { pattern: `${PREFIX}/projects/:id/members`, response: () => [] },
  { pattern: `${PREFIX}/projects/:id`, response: () => MOCK_PROJECTS[0] },
  { pattern: `${PREFIX}/projects`, response: () => MOCK_PROJECTS },

  // Teams
  { pattern: `${PREFIX}/teams/:id/members/:userId`, response: () => MOCK_TEAM_MEMBERS[0] },
  { pattern: `${PREFIX}/teams/:id/members`, response: () => MOCK_TEAM_MEMBERS },
  { pattern: `${PREFIX}/teams/:id`, response: () => MOCK_TEAMS[0] },
  { pattern: `${PREFIX}/teams`, response: () => MOCK_TEAMS },

  // API keys
  { pattern: `${PREFIX}/api-keys/:id`, response: () => MOCK_API_KEYS[0] },
  { pattern: `${PREFIX}/api-keys`, response: () => MOCK_API_KEYS },

  // Invitations
  { pattern: `${PREFIX}/invitations/:id`, response: () => ({}) },
  { pattern: `${PREFIX}/invitations`, response: () => [] },

  // Notifications (specific sub-paths before :id catch-all)
  { pattern: `${PREFIX}/notifications/read-all`, response: () => ({ updated: 0 }) },
  { pattern: `${PREFIX}/notifications/:id/read`, response: () => MOCK_NOTIFICATIONS[0] },
  { pattern: `${PREFIX}/notifications/:id`, response: () => MOCK_NOTIFICATIONS[0] },
  { pattern: `${PREFIX}/notifications`, response: () => MOCK_NOTIFICATIONS },

  // Users
  { pattern: `${PREFIX}/users/:id/effective-permissions`, response: () => MOCK_EFFECTIVE_PERMISSIONS },
  { pattern: `${PREFIX}/users/:id/roles/:roleId`, response: () => ({}) },
  { pattern: `${PREFIX}/users/:id/roles`, response: () => [] },
  { pattern: `${PREFIX}/users/:id`, response: () => MOCK_USERS[0] },
  { pattern: `${PREFIX}/users`, response: () => MOCK_USERS },

  // Audit logs
  { pattern: `${PREFIX}/activity`, response: () => MOCK_AUDIT_LOGS },
];

export type InterceptResult =
  | { intercepted: false }
  | { intercepted: true; blocked: true }
  | { intercepted: true; blocked: false; data: unknown };

export function interceptGodModeRequest(
  path: string,
  method: string,
): InterceptResult {
  if (!useSimulationStore.getState().isGodModeReady) return { intercepted: false };

  const cleanPath = path.split("?")[0];

  if (shouldPassThrough(cleanPath)) return { intercepted: false };

  // Block all mutation methods — God Mode is read-only
  if (!["GET", "HEAD"].includes(method.toUpperCase())) {
    useToastStore.getState().addToast({
      id: "god-mode-write-blocked",
      type: "error",
      title: "God Mode: write blocked",
      message: "Modifications are disabled in God Mode. Deactivate to make changes.",
    });
    return { intercepted: true, blocked: true };
  }

  for (const entry of MOCK_REGISTRY) {
    if (matchesPattern(cleanPath, entry.pattern)) {
      return { intercepted: true, blocked: false, data: entry.response(cleanPath) };
    }
  }

  return { intercepted: false };
}
