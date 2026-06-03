"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { assistantApi } from "@/services/api/assistant-api";
import { useAssistantStore } from "@/stores/assistant-store";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function AssistantDock() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const {
    conversations,
    activeConversationId,
    activeSessionId,
    error,
    setSessions,
    setActiveSession,
    setConversationMessages,
    addMessage,
    setError
  } = useAssistantStore();
  const [message, setMessage] = useState("");

  const sessionsQuery = useQuery({
    queryKey: ["assistant", "sessions", selectedWorkspaceId],
    queryFn: () => assistantApi.listSessions(accessToken ?? "", selectedWorkspaceId),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });

  useEffect(() => {
    if (sessionsQuery.data) {
      setSessions(sessionsQuery.data);
    }
  }, [sessionsQuery.data, setSessions]);

  const conversation = useMemo(() => {
    return (
      conversations.find((item) => item.id === activeConversationId) ??
      conversations[0] ?? {
        id: "local",
        title: "Workspace assistant",
        messages: []
      }
    );
  }, [activeConversationId, conversations]);

  const messagesQuery = useQuery({
    queryKey: ["assistant", "messages", activeSessionId],
    queryFn: () => assistantApi.listMessages(accessToken ?? "", activeSessionId ?? ""),
    enabled: Boolean(accessToken) && Boolean(activeSessionId) && activeSessionId !== "local",
    retry: 1
  });

  useEffect(() => {
    if (activeSessionId && messagesQuery.data && conversation.messages.length === 0) {
      setConversationMessages(activeSessionId, messagesQuery.data);
    }
  }, [activeSessionId, conversation.messages.length, messagesQuery.data, setConversationMessages]);

  const chatMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!accessToken || !selectedWorkspaceId) {
        throw new Error("Select a workspace before asking Asthra.");
      }

      let sessionId = activeSessionId;
      if (!sessionId) {
        const session = await assistantApi.createSession(accessToken, selectedWorkspaceId);
        sessionId = session.id;
        setSessions([session]);
        setActiveSession(session.id);
      }

      return assistantApi.chat(accessToken, {
        workspace_id: selectedWorkspaceId,
        session_id: sessionId,
        message: content
      });
    },
    onMutate: (content) => {
      setError(null);
      if (!activeConversationId) {
        setActiveSession("local");
      }
      addMessage({
        id: `local-user-${Date.now()}`,
        role: "user",
        content
      });
    },
    onSuccess: (response) => {
      if (response.session_id) {
        setActiveSession(response.session_id);
      }
      addMessage({
        id: String(response.message_id ?? `local-assistant-${Date.now()}`),
        role: "assistant",
        content: response.answer,
        sources: response.sources
      });
      setMessage("");
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Assistant request failed.");
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = message.trim();
    if (!content || chatMutation.isPending) {
      return;
    }
    chatMutation.mutate(content);
  };

  return (
    <aside className="hidden w-80 shrink-0 border-l bg-card xl:flex xl:flex-col" aria-label="AI assistant">
      <div className="border-b p-4">
        <div className="text-sm font-semibold">Asthra Assistant</div>
        <div className="text-xs text-muted-foreground">Workspace-aware assistant</div>
      </div>
      <div className="border-b p-3">
        {!selectedWorkspaceId ? (
          <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">Select a workspace to start.</div>
        ) : sessionsQuery.isLoading ? (
          <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">Loading sessions...</div>
        ) : conversations.length === 0 ? (
          <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">New assistant session</div>
        ) : (
          conversations.map((item) => (
            <button
              key={item.id}
              className="mb-2 w-full rounded-md bg-muted px-3 py-2 text-left text-sm font-medium hover:bg-muted/70"
              onClick={() => setActiveSession(item.id)}
            >
              {item.title}
            </button>
          ))
        )}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {!selectedWorkspaceId ? (
          <div className="rounded-md border bg-background p-3 text-sm text-muted-foreground">
            Select a workspace to ask questions across docs, work, ideas, tickets, incidents, releases, and discussions.
          </div>
        ) : conversation.messages.length === 0 ? (
          <div className="rounded-md border bg-background p-3 text-sm text-muted-foreground">
            Ask about this workspace. Sources will appear when memory returns them.
          </div>
        ) : (
          conversation.messages.map((item) => (
            <div key={item.id} className="rounded-md border bg-background p-3 text-sm">
              <div className="mb-1 text-xs uppercase text-muted-foreground">{item.role}</div>
              <div className="whitespace-pre-wrap">{item.content}</div>
              {item.sources && item.sources.length > 0 ? (
                <div className="mt-3 space-y-1 border-t pt-2">
                  <div className="text-xs font-medium text-muted-foreground">Sources</div>
                  {item.sources.map((source, index) => (
                    <div key={`${source.title ?? "source"}-${index}`} className="text-xs text-muted-foreground">
                      {source.title ?? "Untitled source"} {source.source_type ? `(${source.source_type})` : ""}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        )}
        {chatMutation.isPending ? (
          <div className="rounded-md border bg-muted p-3 text-sm text-muted-foreground">Asthra is thinking...</div>
        ) : null}
        {error ? <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
      </div>
      <form className="flex gap-2 border-t p-3" onSubmit={handleSubmit}>
        <Input
          placeholder={selectedWorkspaceId ? "Ask about this workspace" : "Select a workspace first"}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={!selectedWorkspaceId || chatMutation.isPending}
        />
        <Button size="icon" aria-label="Send assistant message" disabled={!selectedWorkspaceId || chatMutation.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </aside>
  );
}
