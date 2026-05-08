import { createFileRoute } from "@tanstack/react-router";
import { PeopleList } from "@/components/chat/PeopleList";

export const Route = createFileRoute("/app/people")({
  component: () => (
    <div className="flex flex-1 min-w-0">
      <div className="w-full md:max-w-2xl mx-auto p-6 overflow-y-auto scroll-thin">
        <PeopleList />
      </div>
    </div>
  ),
});
