import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ChannelRail } from "@/components/classes/ChannelRail";

export const Route = createFileRoute("/app/cls/$classId/")({
  component: ClassIndex,
});

function ClassIndex() {
  const { classId } = Route.useParams();
  return (
    <>
      <ChannelRail classId={classId} className="md:hidden" />
      <Navigate to="/app/cls/$classId/$channelSlug" params={{ classId, channelSlug: "general" }} replace />
    </>
  );
}
