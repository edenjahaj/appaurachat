import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ChannelRail } from "@/components/classes/ChannelRail";

export const Route = createFileRoute("/app/cls/$classId")({
  component: ClassLayout,
});

function ClassLayout() {
  const { classId } = Route.useParams();
  return (
    <div className="flex flex-1 min-w-0">
      <ChannelRail classId={classId} className="hidden md:flex" />
      <div className="flex-1 min-w-0 flex">
        <Outlet />
      </div>
    </div>
  );
}
