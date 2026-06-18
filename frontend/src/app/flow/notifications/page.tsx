"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { FlowBreadcrumbs } from "@/components/flow/flow-breadcrumbs";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { PageHeader } from "@/components/layout/page-header";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EmptyModuleState, ErrorState, PageLoading } from "@/components/layout/ui-states";
import { Button } from "@/components/ui/button";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { FlowNotification } from "@/types/flow";

export default function FlowNotificationsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["flow", "notifications", selectedProjectId],
    queryFn: () => flowApi.listNotifications(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: (notificationId: number) => flowApi.markNotificationRead(accessToken ?? "", notificationId),
    onSuccess: () => {
      addToast({ type: "success", title: "Notification marked read" });
      invalidateNotifications(queryClient, selectedProjectId);
    },
    onError: (error) => addToast({ type: "error", title: "Unable to mark read", message: error instanceof Error ? error.message : "Notification update failed." })
  });
  const markAllReadMutation = useMutation({
    mutationFn: () => flowApi.markAllNotificationsRead(accessToken ?? "", { project_id: selectedProjectId }),
    onSuccess: () => {
      addToast({ type: "success", title: "All Flow notifications marked read" });
      invalidateNotifications(queryClient, selectedProjectId);
    },
    onError: (error) => addToast({ type: "error", title: "Unable to mark all read", message: error instanceof Error ? error.message : "Notification update failed." })
  });
  const deleteMutation = useMutation({
    mutationFn: (notificationId: number) => flowApi.deleteNotification(accessToken ?? "", notificationId),
    onSuccess: () => {
      addToast({ type: "success", title: "Notification deleted" });
      invalidateNotifications(queryClient, selectedProjectId);
    },
    onError: (error) => addToast({ type: "error", title: "Unable to delete notification", message: error instanceof Error ? error.message : "Notification delete failed." })
  });

  if (!selectedProjectId) {
    return (
      <>
        <PageHeader title="Flow Notifications" description="Track work item updates that need attention." breadcrumbs={<FlowBreadcrumbs items={[{ label: "Notifications" }]} />} />
        <FlowSubnav />
        <EmptyModuleState title="Select a project" description="Flow notifications are scoped to the selected project." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Flow Notifications"
        description="Assignment, comment, status, priority, and due date updates for Flow work."
        breadcrumbs={<FlowBreadcrumbs items={[{ label: "Notifications" }]} />}
        actions={<Button variant="outline" disabled={unreadCount === 0 || markAllReadMutation.isPending} onClick={() => markAllReadMutation.mutate()}><CheckCheck className="mr-2 h-4 w-4" />Mark all read</Button>}
      />
      <FlowSubnav />
      <DetailPanel title={`Notifications${unreadCount ? ` · ${unreadCount} unread` : ""}`}>
        {notificationsQuery.isLoading ? <PageLoading label="Loading Flow notifications..." /> : null}
        {notificationsQuery.isError ? <ErrorState title="Notifications failed to load" description="Try refreshing the page." onRetry={() => notificationsQuery.refetch()} /> : null}
        {!notificationsQuery.isLoading && !notificationsQuery.isError && notifications.length === 0 ? (
          <EmptyModuleState title="No Flow notifications yet" description="Updates to assignments, comments, status, priority, or due dates will appear here." />
        ) : null}
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onMarkRead={() => markReadMutation.mutate(notification.id)}
              onDelete={() => deleteMutation.mutate(notification.id)}
              isMutating={markReadMutation.isPending || deleteMutation.isPending}
            />
          ))}
        </div>
      </DetailPanel>
    </>
  );
}

function NotificationRow({ notification, onMarkRead, onDelete, isMutating }: { notification: FlowNotification; onMarkRead: () => void; onDelete: () => void; isMutating: boolean }) {
  return (
    <div className={`rounded-md border p-3 ${notification.is_read ? "bg-background" : "bg-muted/50"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">{notification.title}</h3>
            {!notification.is_read ? <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">Unread</span> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{notification.notification_type.replaceAll("_", " ")}</span>
            <span>{new Date(notification.created_at).toLocaleString()}</span>
            {notification.work_item_id ? <Link className="text-primary hover:underline" href={`/flow/work-items/${notification.work_item_id}`}>Open work item</Link> : null}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {!notification.is_read ? <Button size="sm" variant="outline" disabled={isMutating} onClick={onMarkRead}>Mark read</Button> : null}
          <Button size="sm" variant="outline" disabled={isMutating} onClick={onDelete}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
        </div>
      </div>
    </div>
  );
}

function invalidateNotifications(queryClient: QueryClient, selectedProjectId: number | null) {
  queryClient.invalidateQueries({ queryKey: ["flow", "notifications"] });
  queryClient.invalidateQueries({ queryKey: ["flow", "notifications", "unread-count", selectedProjectId] });
}
