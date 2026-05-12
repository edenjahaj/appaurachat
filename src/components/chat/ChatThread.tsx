import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { Avatar } from "./Avatar";
import { Send, ArrowLeft, ImagePlus, X, Pencil, Trash2, MoreVertical, BellOff, Bell, Ban, Flag, ChevronDown } from "lucide-react";
import { MessageReactions } from "./MessageReactions";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { isMuted, isBlocked, toggleMute, toggleBlock } from "@/lib/moderation";
import { ReportDialog } from "./ReportDialog";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  pending?: boolean;
}

interface MemberProfile {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

export function ChatThread({ conversationId }: { conversationId: string }) {
  const { user, loading: authLoading } = useAuth();
  const { markRead, setActiveConversationId, isOnline } = useRealtime();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [convo, setConvo] = useState<{ is_group: boolean; name: string | null } | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState<Record<string, string>>({});
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<Record<string, number>>({});
  const pendingImagePreviewRef = useRef<string | null>(null);
  const isNearBottomRef = useRef(true);
  const oldestRef = useRef<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [muted, setMuted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const PAGE_SIZE = 40;

  const clearPendingImage = () => {
    if (pendingImagePreviewRef.current) {
      URL.revokeObjectURL(pendingImagePreviewRef.current);
      pendingImagePreviewRef.current = null;
    }
    setPendingImage(null);
  };

  // Track active conversation for notifications
  useEffect(() => {
    setActiveConversationId(conversationId);
    return () => setActiveConversationId(null);
  }, [conversationId, setActiveConversationId]);

  const scrollToBottom = (smooth = false) => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
      isNearBottomRef.current = true;
      setUnreadCount(0);
      setShowJump(false);
    });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distanceFromBottom <= 100;
    isNearBottomRef.current = near;
    setShowJump(!near);
    if (near) setUnreadCount(0);
    // Infinite scroll: load older when near top
    if (el.scrollTop < 80 && hasMore && !loadingMore) {
      void loadMore();
    }
  };

  const loadMore = async () => {
    if (!oldestRef.current || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    const prevTop = el?.scrollTop ?? 0;
    const { data } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, image_url, created_at")
      .eq("conversation_id", conversationId)
      .lt("created_at", oldestRef.current)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    const older = ((data ?? []) as Message[]).reverse();
    if (older.length === 0) {
      setHasMore(false);
    } else {
      oldestRef.current = older[0].created_at;
      setMessages((prev) => [...older, ...prev]);
      // Preserve scroll position after prepending
      requestAnimationFrame(() => {
        const e2 = scrollRef.current;
        if (!e2) return;
        e2.scrollTop = e2.scrollHeight - prevHeight + prevTop;
      });
      if (older.length < PAGE_SIZE) setHasMore(false);
    }
    setLoadingMore(false);
  };

  // Load conversation, members, and initial page of messages
  useEffect(() => {
    if (!user || !conversationId) return;
    let cancelled = false;
    setLoading(true);
    setHasMore(true);
    oldestRef.current = null;

    (async () => {
      const { data: c } = await supabase
        .from("conversations")
        .select("is_group, name")
        .eq("id", conversationId)
        .maybeSingle();
      if (cancelled) return;
      setConvo(c as { is_group: boolean; name: string | null } | null);

      const { data: m } = await supabase
        .from("conversation_members")
        .select("user_id")
        .eq("conversation_id", conversationId);
      const ids = (m ?? []).map((r) => r.user_id);
      const { data: ps } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", ids);
      if (!cancelled) setMembers((ps ?? []) as MemberProfile[]);

      // Load most recent page in DESC then reverse for chronological
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, image_url, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      const ordered = ((msgs ?? []) as Message[]).reverse();
      if (!cancelled) {
        setMessages(ordered);
        if (ordered.length > 0) oldestRef.current = ordered[0].created_at;
        if (ordered.length < PAGE_SIZE) setHasMore(false);
        setLoading(false);
        isNearBottomRef.current = true;
        scrollToBottom();
        markRead(conversationId);

        // Mute / block status
        setMuted(await isMuted(conversationId, user.id));
        const otherIds = ids.filter((id) => id !== user.id);
        if (otherIds.length === 1) setBlocked(await isBlocked(otherIds[0], user.id));
        else setBlocked(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, user?.id]);

  // Realtime: messages + typing
  useEffect(() => {
    if (!user || !conversationId) return;

    const channel = supabase.channel(`conv:${conversationId}`, {
      config: { broadcast: { self: false }, presence: { key: user.id } },
    });

    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // dedupe: if optimistic exists with same content+sender within 5s, replace
            const optIdx = prev.findIndex(
              (m) =>
                m.pending &&
                m.sender_id === newMsg.sender_id &&
                m.content === newMsg.content
            );
            if (optIdx >= 0) {
              const next = [...prev];
              next[optIdx] = newMsg;
              return next;
            }
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Auto-scroll only if near bottom or it's our own message; otherwise increment unread.
          if (isNearBottomRef.current || newMsg.sender_id === user.id) {
            scrollToBottom(true);
          } else {
            setUnreadCount((c) => c + 1);
            setShowJump(true);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const upd = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === upd.id ? { ...m, ...upd } : m)));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const del = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== del.id));
        }
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const { userId, displayName, isTyping } = payload as { userId: string; displayName: string; isTyping: boolean };
        if (userId === user.id) return;
        setTyping((prev) => {
          const next = { ...prev };
          if (isTyping) next[userId] = displayName;
          else delete next[userId];
          return next;
        });
        if (isTyping) {
          if (typingTimeoutRef.current[userId]) window.clearTimeout(typingTimeoutRef.current[userId]);
          typingTimeoutRef.current[userId] = window.setTimeout(() => {
            setTyping((prev) => {
              const n = { ...prev };
              delete n[userId];
              return n;
            });
          }, 4000);
        }
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      Object.values(typingTimeoutRef.current).forEach((t) => window.clearTimeout(t));
      typingTimeoutRef.current = {};
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, user?.id]);

  useEffect(() => {
    // Only auto-scroll for fresh sends (last is our pending). Realtime handles the rest.
    const last = messages[messages.length - 1];
    if (last?.pending && last.sender_id === user?.id) scrollToBottom();
  }, [messages, user?.id]);

  useEffect(() => {
    return () => {
      if (pendingImagePreviewRef.current) {
        URL.revokeObjectURL(pendingImagePreviewRef.current);
      }
    };
  }, []);

  const broadcastTyping = (isTyping: boolean) => {
    const ch = channelRef.current;
    if (!ch || !user) return;
    const me = members.find((m) => m.id === user.id);
    ch.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: user.id, displayName: me?.display_name ?? "Someone", isTyping },
    });
  };

  const lastTypingSentRef = useRef(0);
  const onChange = (v: string) => {
    setText(v);
    if (v.length === 0) {
      broadcastTyping(false);
      lastTypingSentRef.current = 0;
      return;
    }
    const now = Date.now();
    if (now - lastTypingSentRef.current > 1500) {
      broadcastTyping(true);
      lastTypingSentRef.current = now;
    }
  };

  const send = async () => {
    const content = text.trim();
    if ((!content && !pendingImage) || !user || !conversationId) return;

    let image_url: string | null = null;
    if (pendingImage) {
      setUploading(true);
      const ext = pendingImage.file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("chat-media").upload(path, pendingImage.file, { upsert: false, contentType: pendingImage.file.type });
      setUploading(false);
      if (upErr) {
        toast.error(upErr.message);
        return;
      }
      image_url = supabase.storage.from("chat-media").getPublicUrl(path).data.publicUrl;
    }

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: content || null,
      image_url,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    clearPendingImage();
    broadcastTyping(false);

    const { error, data } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: user.id, content: content || null, image_url })
      .select()
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error(error.message);
    } else if (data) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? (data as Message) : m)));
    }
  };

  const onPickFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please pick an image");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB");
      return;
    }
    if (pendingImagePreviewRef.current) {
      URL.revokeObjectURL(pendingImagePreviewRef.current);
    }
    const preview = URL.createObjectURL(f);
    pendingImagePreviewRef.current = preview;
    setPendingImage({ file: f, preview });
  };

  if (authLoading) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Loading chat…</div>;
  }

  if (!user) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Please sign in to view this chat.</div>;
  }

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const others = members.filter((m) => m.id !== user.id);
  const title = convo?.is_group ? convo.name ?? "Group" : others[0]?.display_name ?? "Chat";
  const subtitle = convo?.is_group
    ? `${members.length} members`
    : others[0]?.username
    ? `@${others[0].username}`
    : "";
  const avatarSrc = convo?.is_group ? null : others[0]?.avatar_url ?? null;
  const dmOther = !convo?.is_group ? others[0] : null;

  const onToggleMute = async () => {
    try { const v = await toggleMute(conversationId); setMuted(v); toast.success(v ? "Conversation muted" : "Unmuted"); }
    catch (e: any) { toast.error(e.message); }
    setMenuOpen(false);
  };
  const onToggleBlock = async () => {
    if (!dmOther) return;
    if (!blocked && !confirm(`Block ${dmOther.display_name}? They won't be able to reach you.`)) return;
    try { const v = await toggleBlock(dmOther.id); setBlocked(v); toast.success(v ? "User blocked" : "User unblocked"); }
    catch (e: any) { toast.error(e.message); }
    setMenuOpen(false);
  };

  const typingNames = Object.values(typing);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <button onClick={() => navigate({ to: "/app" })} className="md:hidden size-9 rounded-full grid place-items-center hover:bg-secondary">
          <ArrowLeft className="size-5" />
        </button>
        <div className="relative">
          <Avatar name={title} src={avatarSrc} size={40} />
          {!convo?.is_group && others[0] && isOnline(others[0].id) && (
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate flex items-center gap-1.5">
            {title}
            {muted && <BellOff className="size-3.5 text-muted-foreground" />}
            {blocked && <Ban className="size-3.5 text-destructive" />}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {typingNames.length > 0
              ? <span className="text-primary">typing…</span>
              : !convo?.is_group && others[0] && isOnline(others[0].id) ? <span className="text-emerald-600">Online</span> : subtitle}
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen((s) => !s)} className="size-9 rounded-full grid place-items-center hover:bg-secondary" aria-label="More">
            <MoreVertical className="size-5" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-11 z-30 w-56 rounded-2xl bg-card border border-border shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                <button onClick={onToggleMute} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary text-sm">
                  {muted ? <Bell className="size-4" /> : <BellOff className="size-4" />}
                  <span>{muted ? "Unmute conversation" : "Mute conversation"}</span>
                </button>
                {dmOther && (
                  <button onClick={onToggleBlock} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary text-sm text-destructive">
                    <Ban className="size-4" />
                    <span>{blocked ? "Unblock user" : "Block user"}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 min-h-0 overflow-y-auto scroll-thin scroll-smooth-y px-3 md:px-6 py-4 bg-[image:linear-gradient(180deg,var(--color-background),var(--color-secondary))]"
        style={{ overflowAnchor: "none" }}
      >
        {loadingMore && (
          <div className="text-center py-2 text-xs text-muted-foreground">Loading older messages…</div>
        )}
        {!hasMore && messages.length > 0 && (
          <div className="text-center py-2 text-[11px] text-muted-foreground">— Beginning of conversation —</div>
        )}
        {loading ? (
          <div className="text-sm text-muted-foreground text-center py-8">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-12">No messages yet. Say hi 👋</div>
        ) : (
          <MessageGroup messages={messages} currentUserId={user!.id} memberMap={memberMap} isGroup={!!convo?.is_group} setMessages={setMessages} onReport={(id) => setReportTarget(id)} />
        )}

        {typingNames.length > 0 && (
          <div className="flex gap-2 items-center mt-2 ml-2 animate-bubble-in">
            <div className="rounded-2xl bg-bubble-received px-4 py-3 flex gap-1">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
            <span className="text-xs text-muted-foreground">{typingNames.join(", ")} typing</span>
          </div>
        )}
      </div>

      {/* Jump-to-bottom button */}
      {showJump && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute right-4 bottom-24 md:bottom-28 z-10 size-11 rounded-full bg-primary text-primary-foreground shadow-lg grid place-items-center hover:opacity-90 transition animate-in fade-in zoom-in-95"
          aria-label="Jump to latest"
        >
          <ChevronDown className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold grid place-items-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {reportTarget && <ReportDialog messageId={reportTarget} scope="dm" onClose={() => setReportTarget(null)} />}

      {/* Composer */}
      <div className="border-t border-border bg-card px-3 md:px-6 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        {pendingImage && (
          <div className="mb-2 relative inline-block">
            <img src={pendingImage.preview} alt="preview" className="h-24 rounded-xl object-cover" />
            <button
              type="button"
              onClick={clearPendingImage}
              className="absolute -top-2 -right-2 size-6 rounded-full bg-foreground text-background grid place-items-center"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-end gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { onPickFile(e.target.files?.[0] ?? null); e.target.value = ""; }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="size-11 rounded-full bg-secondary text-foreground grid place-items-center hover:bg-accent transition shrink-0"
            title="Attach photo"
          >
            <ImagePlus className="size-5" />
          </button>
          <textarea
            value={text}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            rows={1}
            placeholder="Message"
            className="flex-1 resize-none rounded-2xl bg-secondary px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-h-32"
          />
          <button
            type="submit"
            disabled={(!text.trim() && !pendingImage) || uploading}
            className="size-11 rounded-full bg-primary text-primary-foreground grid place-items-center disabled:opacity-40 hover:opacity-90 transition shrink-0"
          >
            <Send className="size-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageGroup({
  messages,
  currentUserId,
  memberMap,
  isGroup,
  setMessages,
}: {
  messages: Message[];
  currentUserId: string;
  memberMap: Map<string, MemberProfile>;
  isGroup: boolean;
  setMessages: Dispatch<SetStateAction<Message[]>>;
}) {
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);

  const saveEdit = async () => {
    if (!editing) return;
    const { id, text } = editing;
    setEditing(null);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: text } : m)));
    const { error } = await supabase.from("messages").update({ content: text, edited_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    setMessages((prev) => prev.filter((m) => m.id !== id));
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) toast.error(error.message);
  };

  return (
    <div className="space-y-1">
      {messages.map((m, i) => {
        const isMe = m.sender_id === currentUserId;
        const prev = messages[i - 1];
        const next = messages[i + 1];
        const sameAsPrev = prev && prev.sender_id === m.sender_id;
        const sameAsNext = next && next.sender_id === m.sender_id;
        const sender = memberMap.get(m.sender_id);
        const isEditing = editing?.id === m.id;

        const showDate = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
        const d = new Date(m.created_at);
        const dateLabel = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMM d, yyyy");

        return (
          <div key={m.id}>
            {showDate && (
              <div className="text-center text-[11px] text-muted-foreground my-4">
                <span className="px-3 py-1 rounded-full bg-secondary">{dateLabel}</span>
              </div>
            )}
            <div className={`group flex gap-2 items-end ${isMe ? "justify-end" : "justify-start"} ${sameAsPrev ? "mt-0.5" : "mt-2"}`}>
              {!isMe && (
                <div className="w-8 shrink-0">
                  {!sameAsNext && sender && <Avatar name={sender.display_name} src={sender.avatar_url} size={28} />}
                </div>
              )}
              <div className={`max-w-[78%] md:max-w-[60%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {isGroup && !isMe && !sameAsPrev && sender && (
                  <span className="text-[11px] text-muted-foreground mb-0.5 px-2">{sender.display_name}</span>
                )}
                <div className="relative flex items-center gap-1">
                  {isMe && !isEditing && !m.pending && (
                    <div className="opacity-0 group-hover:opacity-100 transition flex gap-0.5">
                      <button onClick={() => setEditing({ id: m.id, text: m.content ?? "" })} className="size-7 rounded-full hover:bg-secondary grid place-items-center" title="Edit">
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => remove(m.id)} className="size-7 rounded-full hover:bg-destructive/10 hover:text-destructive grid place-items-center" title="Delete">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                  {isEditing ? (
                    <div className="flex gap-2 px-3 py-2 rounded-2xl bg-secondary">
                      <input
                        autoFocus
                        value={editing!.text}
                        onChange={(e) => setEditing({ id: m.id, text: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(null); }}
                        className="bg-transparent text-sm focus:outline-none min-w-[200px]"
                      />
                      <button onClick={saveEdit} className="text-xs font-bold text-primary">Save</button>
                      <button onClick={() => setEditing(null)} className="text-xs text-muted-foreground">Cancel</button>
                    </div>
                  ) : (
                    <div
                      className={`overflow-hidden text-[15px] leading-snug shadow-[var(--shadow-bubble)] animate-bubble-in whitespace-pre-wrap break-words ${
                        isMe ? "bg-bubble-sent text-bubble-sent-foreground" : "bg-bubble-received text-bubble-received-foreground"
                      } ${m.pending ? "opacity-70" : ""} ${m.image_url && !m.content ? "p-1" : "px-4 py-2.5"}`}
                      style={{
                        borderRadius: isMe
                          ? `20px 20px ${sameAsNext ? "6px" : "20px"} 20px`
                          : `20px 20px 20px ${sameAsNext ? "6px" : "20px"}`,
                      }}
                    >
                      {m.image_url && (
                        <a href={m.image_url} target="_blank" rel="noreferrer">
                          <img src={m.image_url} alt="" className="rounded-xl max-h-72 object-cover" loading="lazy" />
                        </a>
                      )}
                      {m.content && <div className={m.image_url ? "mt-2 px-3 pb-1" : ""}>{m.content}</div>}
                    </div>
                  )}
                </div>
                {!m.pending && !isEditing && !m.id.startsWith("temp-") && (
                  <MessageReactions messageId={m.id} scope="dm" align={isMe ? "right" : "left"} />
                )}
                {!sameAsNext && (
                  <span className="text-[10px] text-muted-foreground mt-0.5 px-2">{format(d, "h:mm a")}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

