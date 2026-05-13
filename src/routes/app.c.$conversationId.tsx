import { createFileRoute } from "@tanstack/react-router";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatThread } from "@/components/chat/ChatThread";

export const Route = createFileRoute("/app/c/$conversationId")({
  component: ChatPage,
});

function ChatPage() {
  const { conversationId } = Route.useParams();
  return (
    <div className="flex flex-1 min-w-0 min-h-0 overflow-hidden">
      <div className="hidden md:flex w-[360px] border-r border-border flex-col">
        <ConversationList activeId={conversationId} />
      </div>
      <div className="flex-1 min-w-0 min-h-0 flex">
        <ChatThread conversationId={conversationId} />
      </div>
    </div>
  );
}
