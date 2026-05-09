import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { Avatar } from "./Avatar";
import { Plus, Search, Image as ImageIcon } from "lucide-react";
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
    const lastMessages: Record<string, { content: string; created_at: string; sender_id: string }> = {};
    await Promise.all(
      ids.map(async (cid) => {
        const { data } = await supabase
          .from("messages")
          .select("content, created_at, sender_id")
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

  const filtered = convos.filter((c) => {
    if (!q) return true;
    const title = c.is_group ? c.name ?? "" : c.members.find((m) => m.user_id !== user?.id)?.profile?.display_name ?? "";
    return title.toLowerCase().includes(q.toLowerCase());
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
            const lastText = last ? (last.sender_id === user?.id ? `You: ${last.content}` : last.content) : "Say hi 👋";
            const time = last ? formatDistanceToNowStrict(new Date(last.created_at), { addSuffix: false }) : "";
            const active = c.id === activeId;

            return (
              <Link
                key={c.id}
                to="/app/c/$conversationId"
                params={{ conversationId: c.id }}
                className={`flex gap-3 p-3 rounded-2xl mx-1 my-0.5 transition ${
                  active ? "bg-accent" : "hover:bg-secondary"
                }`}
              >
                <Avatar name={avatarName} src={avatarSrc} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold truncate">{title}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{lastText}</p>
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
