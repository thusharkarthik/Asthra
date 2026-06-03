export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type AssistantConversation = {
  id: string;
  title: string;
  messages: AssistantMessage[];
};
