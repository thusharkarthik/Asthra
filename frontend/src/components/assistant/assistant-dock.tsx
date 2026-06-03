"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAssistantStore } from "@/stores/assistant-store";

export function AssistantDock() {
  const { conversations, activeConversationId } = useAssistantStore();
  const conversation = conversations.find((item) => item.id === activeConversationId) ?? conversations[0];

  return (
    <aside className="hidden w-80 shrink-0 border-l bg-card xl:flex xl:flex-col" aria-label="AI assistant">
      <div className="border-b p-4">
        <div className="text-sm font-semibold">Asthra Assistant</div>
        <div className="text-xs text-muted-foreground">Workspace context shell</div>
      </div>
      <div className="border-b p-3">
        {conversations.map((item) => (
          <div key={item.id} className="rounded-md bg-muted px-3 py-2 text-sm font-medium">
            {item.title}
          </div>
        ))}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {conversation.messages.map((message) => (
          <div key={message.id} className="rounded-md border bg-background p-3 text-sm">
            <div className="mb-1 text-xs uppercase text-muted-foreground">{message.role}</div>
            {message.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t p-3">
        <Input placeholder="Ask about this workspace" />
        <Button size="icon" aria-label="Send assistant message">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  );
}
