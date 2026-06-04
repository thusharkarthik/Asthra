import { create } from "zustand";
import type { AssistantConversation, AssistantMessage, AssistantSession } from "@/types/assistant";

type AssistantState = {
  conversations: AssistantConversation[];
  sessions: AssistantSession[];
  activeConversationId: string | null;
  activeSessionId: string | number | null;
  error: string | null;
  setSessions: (sessions: AssistantSession[]) => void;
  setActiveSession: (sessionId: string | number | null) => void;
  setConversationMessages: (sessionId: string | number, messages: AssistantMessage[]) => void;
  addMessage: (message: AssistantMessage) => void;
  setError: (error: string | null) => void;
  resetAssistant: () => void;
};

export const useAssistantStore = create<AssistantState>((set) => ({
  activeConversationId: null,
  activeSessionId: null,
  sessions: [],
  conversations: [],
  error: null,
  setSessions: (sessions) =>
    set((state) => {
      const activeSessionId = state.activeSessionId ?? sessions[0]?.id ?? null;
      const localMessages = state.conversations.find((conversation) => conversation.id === "local")?.messages ?? [];
      const nextConversations = sessions.map((session) => {
        const existing = state.conversations.find((conversation) => conversation.id === String(session.id));
        return (
          existing ?? {
            id: String(session.id),
            title: session.title ?? "Workspace assistant",
            messages: localMessages
          }
        );
      });
      return {
        sessions,
        activeSessionId,
        activeConversationId: activeSessionId ? String(activeSessionId) : null,
        conversations: nextConversations.length > 0 ? nextConversations : state.conversations
      };
    }),
  setActiveSession: (sessionId) =>
    set({
      activeSessionId: sessionId,
      activeConversationId: sessionId ? String(sessionId) : null
    }),
  setConversationMessages: (sessionId, messages) =>
    set((state) => ({
      conversations: state.conversations.some((conversation) => conversation.id === String(sessionId))
        ? state.conversations.map((conversation) =>
            conversation.id === String(sessionId) ? { ...conversation, messages } : conversation
          )
        : [
            ...state.conversations,
            {
              id: String(sessionId),
              title: "Workspace assistant",
              messages
            }
          ]
    })),
  addMessage: (message) =>
    set((state) => ({
      conversations:
        state.activeConversationId === null
          ? [
              {
                id: "local",
                title: "Workspace assistant",
                messages: [message]
              }
            ]
          : state.conversations.some((conversation) => conversation.id === state.activeConversationId)
            ? state.conversations.map((conversation) =>
                conversation.id === state.activeConversationId
                  ? { ...conversation, messages: [...conversation.messages, message] }
                  : conversation
              )
            : [
                ...state.conversations,
                {
                  id: state.activeConversationId,
                  title: "Workspace assistant",
                  messages: [message]
                }
              ]
    })),
  setError: (error) => set({ error }),
  resetAssistant: () =>
    set({
      sessions: [],
      conversations: [],
      activeConversationId: null,
      activeSessionId: null,
      error: null
    })
}));
