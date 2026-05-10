import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Hash, Megaphone, Book, GraduationCap, Smile, Sparkles, ArrowLeft } from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  hash: Hash, megaphone: Megaphone, book: Book, "graduation-cap": GraduationCap, smile: Smile, sparkles: Sparkles,
};

interface Channel {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  is_announcements: boolean;
  position: number;
}

export function ChannelRail({ classId, className }: { classId: string; className?: string }) {
  const { user } = useAuth();
  const loc = useLocation();
  const [klass, setKlass] = useState<{ name: string; join_code: string } | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [unread, setUnread] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [{ data: c }, { data: chs }, { data: reads }] = await Promise.all([
        supabase.from("classes").select("name, join_code").eq("id", classId).maybeSingle(),
        supabase.from("channels").select("id, slug, name, icon, is_announcements, position").eq("class_id", classId).order("position"),
        user ? supabase.from("channel_reads").select("channel_id, last_read_at").eq("user_id", user.id) : Promise.resolve({ data: [] as { channel_id: string; last_read_at: string }[] }),
      ]);
      if (cancelled) return;
      setKlass(c as { name: string; join_code: string } | null);
      const list = (chs ?? []) as Channel[];
      setChannels(list);

      // Unread per channel
      const readMap = new Map<string, string>();
      (reads ?? []).forEach((r) => readMap.set(r.channel_id, r.last_read_at));
      const counts: Record<string, number> = {};
      await Promise.all(
        list.map(async (ch) => {
          const lr = readMap.get(ch.id) ?? "1970-01-01";
          const { count } = await supabase
            .from("channel_messages")
            .select("id", { count: "exact", head: true })
            .eq("channel_id", ch.id)
            .gt("created_at", lr)
            .neq("sender_id", user?.id ?? "");
          counts[ch.id] = count ?? 0;
        })
      );
      if (!cancelled) setUnread(counts);
    };
    load();
    return () => { cancelled = true; };
  }, [classId, user?.id, loc.pathname]);

  return (
    <aside className={`w-[240px] border-r border-border bg-card flex flex-col shrink-0 ${className ?? ""}`}>
      <div className="px-4 py-4 border-b border-border flex items-center gap-2">
        <Link to="/app/cls" className="size-8 rounded-full hover:bg-secondary grid place-items-center" title="Back">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0">
          <p className="font-bold truncate">{klass?.name ?? "…"}</p>
          {klass && <p className="text-[10px] font-mono tracking-widest text-muted-foreground">#{klass.join_code}</p>}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto scroll-thin py-2">
        <p className="px-4 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Channels</p>
        {channels.map((ch) => {
          const Icon = ICONS[ch.icon ?? "hash"] ?? Hash;
          const active = loc.pathname === `/app/cls/${classId}/${ch.slug}`;
          const count = unread[ch.id] ?? 0;
          return (
            <Link
              key={ch.id}
              to="/app/cls/$classId/$channelSlug"
              params={{ classId, channelSlug: ch.slug }}
              className={`mx-2 my-0.5 flex items-center gap-2 px-2.5 py-2 rounded-xl transition ${
                active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className={`flex-1 truncate text-sm ${count > 0 ? "font-bold text-foreground" : "font-medium"}`}>{ch.name}</span>
              {count > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
