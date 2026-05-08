import { createFileRoute } from "@tanstack/react-router";
import { StoriesPage } from "@/components/chat/StoriesPage";

export const Route = createFileRoute("/app/stories")({
  component: StoriesPage,
});
