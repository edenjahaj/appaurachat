import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UnreadMap { [conversationId: string]: number }

interface RealtimeCtx {
  unread: UnreadMap;
  totalUnread: number;
  onlineUsers: Set<string>;
  isOnline: (userId: string) => boolean;
  markRead: (conversationId: string) => Promise<void>;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
}

const Ctx = createContext<RealtimeCtx | undefined>(undefined);

// small base64 ping sound (short blip)
const PING = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhJBQAAACAACkgKAAEAAAA0gAAACAAAJaWlAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState<UnreadMap>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const activeRef = useRef<string | null>(null);
  const memberConvos = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { activeRef.current = activeConversationId; }, [activeConversationId]);

  // Initial unread load
  const loadUnread = useCallback(async () => {
    if (!user) return;
    const { data: members } = await supabase
      .from("conversation_members")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);
    if (!members) return;
    const ids = members.map((m) => m.conversation_id);
    memberConvos.current = new Set(ids);
    if (ids.length === 0) { setUnread({}); return; }

    const counts: UnreadMap = {};
    await Promise.all(members.map(async (m) => {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", m.conversation_id)
        .gt("created_at", m.last_read_at)
        .neq("sender_id", user.id);
      counts[m.conversation_id] = count ?? 0;
    }));
    setUnread(counts);
  }, [user?.id]);

  useEffect(() => { loadUnread(); }, [loadUnread]);

  // Realtime: messages for any conversation user belongs to
  useEffect(() => {
    if (!user) return;
    let channel: RealtimeChannel | null = null;

    const setup = async () => {
      channel = supabase
        .channel(`user-feed:${user.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
          const msg = payload.new as { id: string; conversation_id: string; sender_id: string; content: string | null; image_url: string | null };
          if (!memberConvos.current.has(msg.conversation_id)) {
            // maybe newly added — refresh membership
            await loadUnread();
            if (!memberConvos.current.has(msg.conversation_id)) return;
          }
          if (msg.sender_id === user.id) return;
          if (activeRef.current === msg.conversation_id) {
            // auto-read
            await supabase.rpc("mark_conversation_read", { _conversation_id: msg.conversation_id });
            return;
          }
          setUnread((u) => ({ ...u, [msg.conversation_id]: (u[msg.conversation_id] ?? 0) + 1 }));
          // sound
          try { audioRef.current?.play().catch(() => {}); } catch {}
          // toast — fetch sender name
          const { data: prof } = await supabase.from("profiles").select("display_name").eq("id", msg.sender_id).maybeSingle();
          const preview = msg.image_url ? "📷 Photo" : (msg.content ?? "").slice(0, 80);
          toast(prof?.display_name ?? "New message", { description: preview });
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversation_members", filter: `user_id=eq.${user.id}` }, () => {
          loadUnread();
        })
        .subscribe();
    };
    setup();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [user?.id, loadUnread]);

  // Online presence
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("presence:online", { config: { presence: { key: user.id } } });
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState();
      setOnlineUsers(new Set(Object.keys(state)));
    }).subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ online_at: new Date().toISOString() });
      }
    });
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const markRead = useCallback(async (conversationId: string) => {
    if (!user) return;
    await supabase.rpc("mark_conversation_read", { _conversation_id: conversationId });
    setUnread((u) => ({ ...u, [conversationId]: 0 }));
  }, [user?.id]);

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  return (
    <Ctx.Provider value={{
      unread, totalUnread, onlineUsers,
      isOnline: (id) => onlineUsers.has(id),
      markRead, activeConversationId, setActiveConversationId,
    }}>
      <audio ref={audioRef} src={PING} preload="auto" />
      {children}
    </Ctx.Provider>
  );
}

export function useRealtime() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRealtime outside RealtimeProvider");
  return c;
}
