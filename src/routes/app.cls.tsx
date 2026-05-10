import { createFileRoute } from "@tanstack/react-router";
import { ClassesIndex } from "@/components/classes/ClassesIndex";

export const Route = createFileRoute("/app/cls")({
  component: () => (
    <div className="flex-1 min-h-0 overflow-y-auto scroll-thin">
      <ClassesIndex />
    </div>
  ),
});
