import { createFileRoute } from "@tanstack/react-router";
import { ConversationList } from "@/components/chat/ConversationList";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: AppHome,
});

function AppHome() {
  return (
    <div className="flex flex-1 min-w-0">
      <div className="w-full md:w-[360px] border-r border-border flex flex-col">
        <ConversationList />
      </div>
      <div className="hidden md:flex flex-1 items-center justify-center bg-[image:linear-gradient(180deg,var(--color-background),var(--color-secondary))]">
        <div className="text-center max-w-sm px-6">
          <div className="mx-auto size-20 rounded-3xl bg-[image:var(--gradient-aurora)] grid place-items-center mb-4 shadow-[var(--shadow-soft)]">
            <MessageCircle className="size-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Welcome to AURA</h2>
          <p className="text-muted-foreground mt-2">Select a conversation, find someone new, or share a story.</p>
        </div>
      </div>
    </div>
  );
}
