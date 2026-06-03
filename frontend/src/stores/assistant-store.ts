import { create } from "zustand";
import type { AssistantConversation, AssistantMessage } from "@/types/assistant";

type AssistantState = {
  conversations: AssistantConversation[];
  activeConversationId: string;
  addMessage: (message: AssistantMessage) => void;
};

export const useAssistantStore = create<AssistantState>((set) => ({
  activeConversationId: "c_1",
  conversations: [
    {
      id: "c_1",
      title: "Workspace briefing",
      messages: [
        { id: "m_1", role: "assistant", content: "I can help summarize workspace context when integration is enabled." }
      ]
    }
  ],
  addMessage: (message) =>
    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation.id === state.activeConversationId
          ? { ...conversation, messages: [...conversation.messages, message] }
          : conversation
      )
    }))
}));
