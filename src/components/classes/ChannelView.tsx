import { useEffect, useRef, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/chat/Avatar";
import { Send, Hash, Search, Trash2, Pencil, Reply, Pin, X, PinOff } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { MessageReactions } from "@/components/chat/MessageReactions";

interface Msg {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  parent_id: string | null;
  pinned: boolean;
  pending?: boolean;
}
interface Profile { id: string; display_name: string; avatar_url: string | null; }

function dayLabel(d: Date) {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

export function ChannelView({ classId, channelId, channelName, isAdmin }: { classId: string; channelId: string; channelName: string; isAdmin: boolean }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load messages + profiles
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("channel_messages")
        .select("id, channel_id, sender_id, content, edited_at, deleted_at, created_at, parent_id, pinned")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (cancelled) return;
      const msgs = (data ?? []) as Msg[];
      setMessages(msgs);
      const senderIds = Array.from(new Set(msgs.map((m) => m.sender_id)));
      if (senderIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", senderIds);
        if (!cancelled) setProfiles(new Map((profs ?? []).map((p) => [p.id, p as Profile])));
      }
      // mark read
      await supabase.rpc("mark_channel_read", { _channel_id: channelId });
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
    })();
    return () => { cancelled = true; };
  }, [channelId]);

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel(`channel:${channelId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "channel_messages", filter: `channel_id=eq.${channelId}` }, async (p) => {
        const m = p.new as Msg;
        setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
        if (!profiles.has(m.sender_id)) {
          const { data: prof } = await supabase.from("profiles").select("id, display_name, avatar_url").eq("id", m.sender_id).maybeSingle();
          if (prof) setProfiles((mp) => new Map(mp).set(prof.id, prof as Profile));
        }
        if (m.sender_id !== user?.id) {
          await supabase.rpc("mark_channel_read", { _channel_id: channelId });
        }
        requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "channel_messages", filter: `channel_id=eq.${channelId}` }, (p) => {
        const m = p.new as Msg;
        setMessages((prev) => prev.map((x) => x.id === m.id ? m : x));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "channel_messages", filter: `channel_id=eq.${channelId}` }, (p) => {
        const m = p.old as { id: string };
        setMessages((prev) => prev.filter((x) => x.id !== m.id));
      })
      .subscribe();
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [channelId, user?.id]);

  const send = async () => {
    if (!user || !text.trim()) return;
    const content = text.trim();
    const parent_id = replyTo?.id ?? null;
    setText("");
    setReplyTo(null);
    const tempId = `tmp-${Date.now()}`;
    const optimistic: Msg = { id: tempId, channel_id: channelId, sender_id: user.id, content, edited_at: null, deleted_at: null, created_at: new Date().toISOString(), parent_id, pinned: false, pending: true };
    setMessages((p) => [...p, optimistic]);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
    const { data, error } = await supabase.from("channel_messages").insert({ channel_id: channelId, sender_id: user.id, content, parent_id }).select().single();
    if (error) {
      toast.error(error.message);
      setMessages((p) => p.filter((m) => m.id !== tempId));
    } else {
      setMessages((p) => p.map((m) => m.id === tempId ? (data as Msg) : m));
    }
  };

  const togglePin = async (m: Msg) => {
    const { error } = await supabase.from("channel_messages").update({ pinned: !m.pinned }).eq("id", m.id);
    if (error) toast.error(error.message);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { id, text: t } = editing;
    setEditing(null);
    const { error } = await supabase.from("channel_messages").update({ content: t, edited_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("channel_messages").delete().eq("id", id);
    if (error) toast.error(error.message);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return messages;
    const q = search.toLowerCase();
    return messages.filter((m) => (m.content ?? "").toLowerCase().includes(q));
  }, [messages, search]);

  // Group by day
  const grouped = useMemo(() => {
    const out: Array<{ key: string; label: string; items: Msg[] }> = [];
    let cur: { key: string; label: string; items: Msg[] } | null = null;
    for (const m of filtered) {
      const d = new Date(m.created_at);
      const key = d.toDateString();
      if (!cur || cur.key !== key) { cur = { key, label: dayLabel(d), items: [] }; out.push(cur); }
      cur.items.push(m);
    }
    return out;
  }, [filtered]);

  const messageMap = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const pinnedList = useMemo(() => messages.filter((m) => m.pinned), [messages]);

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-background">
      <header className="h-14 px-4 border-b border-border flex items-center gap-3 bg-card/60 backdrop-blur">
        <Hash className="size-4 text-muted-foreground" />
        <h2 className="font-bold truncate">{channelName}</h2>
        <div className="ml-auto flex items-center gap-2">
          {pinnedList.length > 0 && (
            <button onClick={() => setShowPinned((s) => !s)} className="h-9 px-3 rounded-full hover:bg-secondary flex items-center gap-1.5 text-xs font-semibold" title="Pinned">
              <Pin className="size-3.5" /> {pinnedList.length}
            </button>
          )}
          <button onClick={() => setShowSearch((s) => !s)} className="size-9 rounded-full hover:bg-secondary grid place-items-center" title="Search">
            <Search className="size-4" />
          </button>
        </div>
      </header>

      {showSearch && (
        <div className="px-4 py-2 border-b border-border bg-card/40">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search in #${channelName}…`}
            className="w-full px-3 py-2 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      {showPinned && pinnedList.length > 0 && (
        <div className="px-4 py-2 border-b border-border bg-amber-500/5 max-h-48 overflow-y-auto scroll-thin">
          <div className="text-[11px] uppercase font-bold text-muted-foreground mb-1.5 flex items-center gap-1"><Pin className="size-3" /> Pinned</div>
          {pinnedList.map((m) => {
            const prof = profiles.get(m.sender_id);
            return (
              <div key={m.id} className="text-xs py-1 border-b border-border/40 last:border-0">
                <span className="font-semibold">{prof?.display_name ?? "Unknown"}: </span>
                <span className="text-muted-foreground">{m.content}</span>
              </div>
            );
          })}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin px-4 py-3 space-y-1">
        {grouped.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12">
            No messages yet — say hi 👋
          </div>
        )}
        {grouped.map((g) => (
          <div key={g.key}>
            <div className="my-3 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <div className="flex-1 h-px bg-border" /><span className="font-bold">{g.label}</span><div className="flex-1 h-px bg-border" />
            </div>
            {g.items.map((m, i) => {
              const prev = g.items[i - 1];
              const sameAuthor = prev && prev.sender_id === m.sender_id && !m.parent_id && new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1000;
              const prof = profiles.get(m.sender_id);
              const mine = m.sender_id === user?.id;
              const isEditing = editing?.id === m.id;
              const parent = m.parent_id ? messageMap.get(m.parent_id) : null;
              const parentProf = parent ? profiles.get(parent.sender_id) : null;
              return (
                <div key={m.id} className={`group relative flex gap-3 px-2 py-1 rounded-lg hover:bg-secondary/40 ${sameAuthor ? "" : "mt-2"} ${m.pinned ? "border-l-2 border-amber-500/60 bg-amber-500/[0.03]" : ""} animate-bubble-in`}>
                  <div className="w-9 shrink-0 pt-0.5">
                    {!sameAuthor && <Avatar name={prof?.display_name ?? "?"} src={prof?.avatar_url} size={32} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    {!sameAuthor && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-semibold text-sm">{prof?.display_name ?? "Unknown"}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(m.created_at), "h:mm a")}</span>
                        {m.pinned && <Pin className="size-3 text-amber-500" />}
                      </div>
                    )}
                    {parent && (
                      <div className="text-xs mb-1 px-2 py-1 rounded-md bg-secondary/60 border-l-2 border-primary/60 max-w-md truncate">
                        <span className="font-semibold text-primary">{parentProf?.display_name ?? "Unknown"}</span>
                        <span className="text-muted-foreground"> · {parent.content}</span>
                      </div>
                    )}
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          value={editing!.text}
                          onChange={(e) => setEditing({ id: m.id, text: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(null); }}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button onClick={saveEdit} className="text-xs font-bold text-primary">Save</button>
                        <button onClick={() => setEditing(null)} className="text-xs text-muted-foreground">Cancel</button>
                      </div>
                    ) : (
                      <p className={`text-sm whitespace-pre-wrap break-words ${m.pending ? "opacity-60" : ""}`}>
                        {m.content}
                        {m.edited_at && <span className="ml-1 text-[10px] text-muted-foreground">(edited)</span>}
                      </p>
                    )}
                    {!m.pending && !isEditing && <MessageReactions messageId={m.id} scope="channel" />}
                  </div>
                  {!isEditing && (
                    <div className="absolute top-0 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5 bg-card border border-border rounded-full shadow-sm px-1 py-0.5">
                      <button onClick={() => setReplyTo(m)} className="size-7 rounded-full hover:bg-secondary grid place-items-center" title="Reply">
                        <Reply className="size-3.5" />
                      </button>
                      {isAdmin && (
                        <button onClick={() => togglePin(m)} className="size-7 rounded-full hover:bg-secondary grid place-items-center" title={m.pinned ? "Unpin" : "Pin"}>
                          {m.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                        </button>
                      )}
                      {mine && (
                        <button onClick={() => setEditing({ id: m.id, text: m.content ?? "" })} className="size-7 rounded-full hover:bg-secondary grid place-items-center" title="Edit">
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                      {(mine || isAdmin) && (
                        <button onClick={() => remove(m.id)} className="size-7 rounded-full hover:bg-destructive/10 hover:text-destructive grid place-items-center" title="Delete">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="border-t border-border p-3 bg-card/60 backdrop-blur">
        {replyTo && (
          <div className="mb-2 px-3 py-2 rounded-xl bg-secondary/60 flex items-start gap-2 text-xs border-l-2 border-primary">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-primary">Replying to {profiles.get(replyTo.sender_id)?.display_name ?? "Unknown"}</div>
              <div className="text-muted-foreground truncate">{replyTo.content}</div>
            </div>
            <button onClick={() => setReplyTo(null)} className="size-6 rounded-full hover:bg-secondary grid place-items-center"><X className="size-3.5" /></button>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } if (e.key === "Escape") setReplyTo(null); }}
            placeholder={replyTo ? `Reply…` : `Message #${channelName}`}
            className="flex-1 bg-transparent focus:outline-none text-sm py-1"
          />
          <button onClick={send} disabled={!text.trim()} className="size-9 rounded-full bg-primary text-primary-foreground grid place-items-center disabled:opacity-40 hover:opacity-90 transition">
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

