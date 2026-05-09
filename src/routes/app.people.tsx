import { createFileRoute } from "@tanstack/react-router";
import { PeopleList } from "@/components/chat/PeopleList";

export const Route = createFileRoute("/app/people")({
  component: () => (
    <div className="flex-1 min-h-0 overflow-y-auto scroll-thin overscroll-contain">
      <div className="w-full md:max-w-2xl mx-auto p-6">
        <PeopleList />
      </div>
    </div>
  ),
});
