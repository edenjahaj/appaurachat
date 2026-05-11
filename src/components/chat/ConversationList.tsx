import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { useFavorites } from "@/lib/favorites-context";
import { Avatar } from "./Avatar";
import { Plus, Search, Image as ImageIcon, Star } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { CreateGroupDialog } from "./CreateGroupDialog";

interface ConvoRow {
  id: string;
  is_group: boolean;
  name: string | null;
  last_message_at: string;
  members: { user_id: string; profile: { display_name: string; username: string; avatar_url: string | null } | null }[];
  last_message: { content: string | null; image_url: string | null; created_at: string; sender_id: string } | null;
}

export function ConversationList({ activeId }: { activeId?: string }) {
  const { user } = useAuth();
  const { unread, isOnline } = useRealtime();
  const { isFavorite } = useFavorites();
  const [convos, setConvos] = useState<ConvoRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [showGroup, setShowGroup] = useState(false);

  const load = async () => {
    if (!user) return;
    // get conversation ids I'm in
    const { data: memberRows } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);
    const ids = (memberRows ?? []).map((r) => r.conversation_id);
    if (ids.length === 0) {
      setConvos([]);
      setLoading(false);
      return;
    }

    const { data: convData } = await supabase
      .from("conversations")
      .select("id, is_group, name, last_message_at")
      .in("id", ids)
      .order("last_message_at", { ascending: false });

    const { data: allMembers } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
      .in("conversation_id", ids);

    const otherUserIds = Array.from(new Set((allMembers ?? []).map((m) => m.user_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .in("id", otherUserIds);
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    // last message per conversation (one query)
    const lastMessages: Record<string, { content: string | null; image_url: string | null; created_at: string; sender_id: string }> = {};
    await Promise.all(
      ids.map(async (cid) => {
        const { data } = await supabase
          .from("messages")
          .select("content, image_url, created_at, sender_id")
          .eq("conversation_id", cid)
          .order("created_at", { ascending: false })
          .limit(1);
        if (data && data[0]) lastMessages[cid] = data[0];
      })
    );

    const rows: ConvoRow[] = (convData ?? []).map((c) => ({
      id: c.id,
      is_group: c.is_group,
      name: c.name,
      last_message_at: c.last_message_at,
      members: (allMembers ?? [])
        .filter((m) => m.conversation_id === c.id)
        .map((m) => ({ user_id: m.user_id, profile: (profileMap.get(m.user_id) as ConvoRow["members"][number]["profile"]) ?? null })),
      last_message: lastMessages[c.id] ?? null,
    }));
    setConvos(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  // realtime: any new message bumps the list
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("convo-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversation_members" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  const filtered = convos
    .filter((c) => {
      if (!q) return true;
      const title = c.is_group ? c.name ?? "" : c.members.find((m) => m.user_id !== user?.id)?.profile?.display_name ?? "";
      return title.toLowerCase().includes(q.toLowerCase());
    })
    .sort((a, b) => {
      const aFav = !a.is_group && isFavorite(a.members.find((m) => m.user_id !== user?.id)?.user_id ?? "") ? 1 : 0;
      const bFav = !b.is_group && isFavorite(b.members.find((m) => m.user_id !== user?.id)?.user_id ?? "") ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });

  return (
    <>
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Chats</h1>
        <button
          onClick={() => setShowGroup(true)}
          className="size-9 rounded-full bg-accent text-primary grid place-items-center hover:opacity-90 transition"
          title="New group"
        >
          <Plus className="size-5" />
        </button>
      </div>
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-2 pb-4">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
            <Link to="/app/people" className="inline-block mt-3 text-sm font-semibold text-primary hover:underline">
              Find people →
            </Link>
          </div>
        ) : (
          filtered.map((c) => {
            const others = c.members.filter((m) => m.user_id !== user?.id);
            const title = c.is_group ? c.name ?? "Group" : others[0]?.profile?.display_name ?? "Unknown";
            const avatarName = title;
            const avatarSrc = c.is_group ? null : others[0]?.profile?.avatar_url ?? null;
            const last = c.last_message;
            const lastPreview = last
              ? last.image_url
                ? "📷 Photo"
                : last.content ?? ""
              : "Say hi 👋";
            const lastText = last && last.sender_id === user?.id ? `You: ${lastPreview}` : lastPreview;
            const time = last ? formatDistanceToNowStrict(new Date(last.created_at), { addSuffix: false }) : "";
            const active = c.id === activeId;
            const count = unread[c.id] ?? 0;
            const otherId = others[0]?.user_id;
            const online = !c.is_group && otherId ? isOnline(otherId) : false;
            const fav = !c.is_group && otherId ? isFavorite(otherId) : false;

            return (
              <Link
                key={c.id}
                to="/app/c/$conversationId"
                params={{ conversationId: c.id }}
                className={`flex gap-3 p-3 rounded-2xl mx-1 my-0.5 transition ${
                  active ? "bg-accent" : fav ? "bg-amber-400/[0.06] hover:bg-amber-400/[0.12]" : "hover:bg-secondary"
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar name={avatarName} src={avatarSrc} size={48} />
                  {online && <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-card" />}
                  {fav && <span className="absolute -top-1 -right-1 size-4 rounded-full bg-amber-400 grid place-items-center ring-2 ring-card"><Star className="size-2.5 fill-white text-white" /></span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate ${count > 0 ? "font-bold" : "font-semibold"}`}>{title}</span>
                    <span className={`text-[10px] shrink-0 ${count > 0 ? "text-primary font-semibold" : "text-muted-foreground"}`}>{time}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${count > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {last?.image_url && <ImageIcon className="inline size-3.5 mr-1 -mt-0.5" />}
                      {lastText}
                    </p>
                    {count > 0 && (
                      <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold grid place-items-center">
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
      <CreateGroupDialog open={showGroup} onClose={() => setShowGroup(false)} onCreated={() => load()} />
    </>
  );
}
