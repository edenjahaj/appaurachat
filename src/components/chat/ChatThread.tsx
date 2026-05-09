import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { Avatar } from "./Avatar";
import { Send, ArrowLeft, ImagePlus, X } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

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
  const { user } = useAuth();
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

  // Track active conversation for notifications
  useEffect(() => {
    setActiveConversationId(conversationId);
    return () => setActiveConversationId(null);
  }, [conversationId, setActiveConversationId]);

  const scrollToBottom = (smooth = true) => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    });
  };

  // Load conversation, members, and messages
  useEffect(() => {
    if (!user || !conversationId) return;
    let cancelled = false;
    setLoading(true);

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

      const { data: msgs } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, image_url, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!cancelled) {
        setMessages((msgs ?? []) as Message[]);
        setLoading(false);
        scrollToBottom(false);
        markRead(conversationId);
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
          scrollToBottom();
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
    const now = Date.now();
    if (v.length > 0 && now - lastTypingSentRef.current > 1500) {
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
      if (upErr) { toast.error(upErr.message); return; }
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
    setPendingImage(null);
    scrollToBottom();
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
    if (!f.type.startsWith("image/")) { toast.error("Please pick an image"); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setPendingImage({ file: f, preview: URL.createObjectURL(f) });
  };

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const others = members.filter((m) => m.id !== user?.id);
  const title = convo?.is_group ? convo.name ?? "Group" : others[0]?.display_name ?? "Chat";
  const subtitle = convo?.is_group
    ? `${members.length} members`
    : others[0]?.username
    ? `@${others[0].username}`
    : "";
  const avatarSrc = convo?.is_group ? null : others[0]?.avatar_url ?? null;

  const typingNames = Object.values(typing);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-border bg-card">
        <button onClick={() => navigate({ to: "/app" })} className="md:hidden size-9 rounded-full grid place-items-center hover:bg-secondary">
          <ArrowLeft className="size-5" />
        </button>
        <Avatar name={title} src={avatarSrc} size={40} />
        <div className="min-w-0">
          <div className="font-semibold truncate">{title}</div>
          <div className="text-xs text-muted-foreground truncate">
            {typingNames.length > 0 ? <span className="text-primary">typing…</span> : subtitle}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin px-3 md:px-6 py-4 bg-[image:linear-gradient(180deg,var(--color-background),var(--color-secondary))]">
        {loading ? (
          <div className="text-sm text-muted-foreground text-center py-8">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-12">No messages yet. Say hi 👋</div>
        ) : (
          <MessageGroup messages={messages} currentUserId={user!.id} memberMap={memberMap} isGroup={!!convo?.is_group} />
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

      {/* Composer */}
      <div className="border-t border-border bg-card px-3 md:px-6 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={text}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Message"
            className="flex-1 resize-none rounded-2xl bg-secondary px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-h-32"
          />
          <button
            type="submit"
            disabled={!text.trim()}
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
}: {
  messages: Message[];
  currentUserId: string;
  memberMap: Map<string, MemberProfile>;
  isGroup: boolean;
}) {
  return (
    <div className="space-y-1">
      {messages.map((m, i) => {
        const isMe = m.sender_id === currentUserId;
        const prev = messages[i - 1];
        const next = messages[i + 1];
        const sameAsPrev = prev && prev.sender_id === m.sender_id;
        const sameAsNext = next && next.sender_id === m.sender_id;
        const sender = memberMap.get(m.sender_id);

        // Date separator
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
            <div className={`flex gap-2 items-end ${isMe ? "justify-end" : "justify-start"} ${sameAsPrev ? "mt-0.5" : "mt-2"}`}>
              {!isMe && (
                <div className="w-8 shrink-0">
                  {!sameAsNext && sender && <Avatar name={sender.display_name} src={sender.avatar_url} size={28} />}
                </div>
              )}
              <div className={`max-w-[78%] md:max-w-[60%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {isGroup && !isMe && !sameAsPrev && sender && (
                  <span className="text-[11px] text-muted-foreground mb-0.5 px-2">{sender.display_name}</span>
                )}
                <div
                  className={`px-4 py-2.5 text-[15px] leading-snug shadow-[var(--shadow-bubble)] animate-bubble-in whitespace-pre-wrap break-words ${
                    isMe ? "bg-bubble-sent text-bubble-sent-foreground" : "bg-bubble-received text-bubble-received-foreground"
                  } ${m.pending ? "opacity-70" : ""}`}
                  style={{
                    borderRadius: isMe
                      ? `20px 20px ${sameAsNext ? "6px" : "20px"} 20px`
                      : `20px 20px 20px ${sameAsNext ? "6px" : "20px"}`,
                  }}
                >
                  {m.content}
                </div>
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
