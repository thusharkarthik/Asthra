"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Bot, RefreshCw, Send, Trash2, User } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyModuleState, SectionLoading } from "@/components/layout/ui-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { assistantApi } from "@/services/api/assistant-api";
import { useAssistantStore } from "@/stores/assistant-store";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function AssistantDock() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const isAssistantOpen = useUIStore((state) => state.isAssistantOpen);
  const setAssistantOpen = useUIStore((state) => state.setAssistantOpen);
  const {
    conversations,
    activeConversationId,
    activeSessionId,
    error,
    setSessions,
    setActiveSession,
    setConversationMessages,
    addMessage,
    setError,
    resetAssistant
  } = useAssistantStore();
  const [message, setMessage] = useState("");
  const [lastMessage, setLastMessage] = useState("");

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
    setLastMessage(content);
    chatMutation.mutate(content);
  };

  const retryLastMessage = () => {
    if (lastMessage && !chatMutation.isPending) {
      setError(null);
      chatMutation.mutate(lastMessage);
    }
  };

  if (!isAssistantOpen) {
    return (
      <Button
        className="fixed bottom-28 right-4 z-40 h-12 w-12 rounded-full shadow-lg md:bottom-24"
        size="icon"
        aria-label="Open assistant"
        onClick={() => setAssistantOpen(true)}
      >
        <Bot className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <>
      <Button
        className="fixed bottom-28 right-4 z-40 h-12 w-12 rounded-full shadow-lg md:bottom-24"
        size="icon"
        aria-label="Close assistant"
        onClick={() => setAssistantOpen(false)}
      >
        <Bot className="h-5 w-5" />
      </Button>
      <aside className="fixed bottom-44 right-4 top-20 z-40 flex w-[min(420px,calc(100vw-2rem))] flex-col rounded-lg border bg-card shadow-xl md:bottom-40" aria-label="AI assistant">
      <div className="flex items-start justify-between gap-3 border-b p-4">
        <div>
          <div className="text-sm font-semibold">Asthra Assistant</div>
          <div className="text-xs text-muted-foreground">Workspace-aware, read-only assistant</div>
        </div>
        <div className="flex gap-1">
        <Button size="icon" variant="ghost" aria-label="Clear assistant conversation" onClick={() => { resetAssistant(); setMessage(""); setLastMessage(""); }}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Close assistant drawer" onClick={() => setAssistantOpen(false)}>
          x
        </Button>
        </div>
      </div>
      <div className="border-b p-3">
        {!selectedWorkspaceId ? (
          <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">Select a workspace to start.</div>
        ) : sessionsQuery.isLoading ? (
          <SectionLoading label="Loading assistant sessions..." />
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
          <EmptyModuleState title="Select a workspace" description="Assistant context is scoped to the selected workspace." />
        ) : conversation.messages.length === 0 ? (
          <EmptyModuleState title="Ask Asthra anything about this workspace" description="Try questions about docs, tickets, incidents, releases, or project status. Sources appear when memory returns them." />
        ) : (
          conversation.messages.map((item) => (
            <div key={item.id} className={item.role === "user" ? "ml-6 rounded-md border bg-muted p-3 text-sm" : "mr-6 rounded-md border bg-background p-3 text-sm"}>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                {item.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                {item.role}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{item.content}</div>
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
          <div className="mr-6 rounded-md border bg-background p-3 text-sm text-muted-foreground">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase"><Bot className="h-3.5 w-3.5" />assistant</div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-primary" /><span className="h-2 w-2 animate-pulse rounded-full bg-primary delay-75" /><span className="h-2 w-2 animate-pulse rounded-full bg-primary delay-150" />Asthra is thinking...</div>
          </div>
        ) : null}
        {error ? (
          <div className="space-y-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <div>{error}</div>
            <Button size="sm" variant="outline" onClick={retryLastMessage} disabled={!lastMessage || chatMutation.isPending}>
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        ) : null}
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
    </>
  );
}
