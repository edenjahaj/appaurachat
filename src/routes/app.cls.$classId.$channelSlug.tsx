import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ChannelView } from "@/components/classes/ChannelView";
import { AnnouncementFeed } from "@/components/classes/AnnouncementFeed";

export const Route = createFileRoute("/app/cls/$classId/$channelSlug")({
  component: ChannelPage,
});

interface ChannelMeta { id: string; name: string; is_announcements: boolean; }

function ChannelPage() {
  const { classId, channelSlug } = Route.useParams();
  const { user } = useAuth();
  const [meta, setMeta] = useState<ChannelMeta | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMeta(null); setNotFound(false);
    (async () => {
      const { data: ch } = await supabase
        .from("channels")
        .select("id, name, is_announcements")
        .eq("class_id", classId)
        .eq("slug", channelSlug)
        .maybeSingle();
      if (cancelled) return;
      if (!ch) { setNotFound(true); return; }
      setMeta(ch as ChannelMeta);
      if (user) {
        const { data: m } = await supabase
          .from("class_members")
          .select("role")
          .eq("class_id", classId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled) setIsAdmin(m?.role === "admin");
      }
    })();
    return () => { cancelled = true; };
  }, [classId, channelSlug, user?.id]);

  if (notFound) return <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Channel not found.</div>;
  if (!meta) return <div className="flex-1 grid place-items-center"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;

  return meta.is_announcements
    ? <AnnouncementFeed classId={classId} isAdmin={isAdmin} />
    : <ChannelView classId={classId} channelId={meta.id} channelName={meta.name} isAdmin={isAdmin} />;
}
