import { PlatformSetupGuide } from "@/components/platform/platform-setup-guide";

type FlowSetupStateProps = {
  hasOrganization: boolean;
  hasWorkspace: boolean;
  hasProject: boolean;
};

export function FlowSetupState({ hasOrganization, hasWorkspace, hasProject }: FlowSetupStateProps) {
  return <PlatformSetupGuide moduleName="Flow" hasOrganization={hasOrganization} hasWorkspace={hasWorkspace} hasProject={hasProject} requiresProject />;
}
