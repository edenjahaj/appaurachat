import { r as reactExports, W as jsxRuntimeExports } from "./server-U61-uJh3.js";
import { C as ConversationList } from "./ConversationList-BYTY9QYc.js";
import { c as createLucideIcon, u as useAuth, d as useRealtime, a as useNavigate, s as supabase, X, t as toast, h as Route } from "./router-CYx1i6QQ.js";
import { A as Avatar } from "./Avatar-CxBchUvZ.js";
import { S as Send, i as isToday, a as isYesterday, f as format, P as Pencil, T as Trash2, M as MessageReactions } from "./MessageReactions-C_O0YV01.js";
import { A as ArrowLeft } from "./arrow-left-D1Xbmolz.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./plus-7Bfs70-e.js";
import "./star-BsOXsYFc.js";
import "./formatDistanceToNowStrict-DBgh6Ve6.js";
import "./en-US-CqQV4g4D.js";
const __iconNode = [
  ["path", { d: "M16 5h6", key: "1vod17" }],
  ["path", { d: "M19 2v6", key: "4bpg5p" }],
  ["path", { d: "M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5", key: "1ue2ih" }],
  ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21", key: "1xmnt7" }],
  ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }]
];
const ImagePlus = createLucideIcon("image-plus", __iconNode);
function ChatThread({ conversationId }) {
  const { user, loading: authLoading } = useAuth();
  const { markRead, setActiveConversationId, isOnline } = useRealtime();
  const navigate = useNavigate();
  const [messages, setMessages] = reactExports.useState([]);
  const [members, setMembers] = reactExports.useState([]);
  const [convo, setConvo] = reactExports.useState(null);
  const [text, setText] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(true);
  const [typing, setTyping] = reactExports.useState({});
  const [pendingImage, setPendingImage] = reactExports.useState(null);
  const [uploading, setUploading] = reactExports.useState(false);
  const scrollRef = reactExports.useRef(null);
  const fileInputRef = reactExports.useRef(null);
  const channelRef = reactExports.useRef(null);
  const typingTimeoutRef = reactExports.useRef({});
  const pendingImagePreviewRef = reactExports.useRef(null);
  const isNearBottomRef = reactExports.useRef(true);
  const clearPendingImage = () => {
    if (pendingImagePreviewRef.current) {
      URL.revokeObjectURL(pendingImagePreviewRef.current);
      pendingImagePreviewRef.current = null;
    }
    setPendingImage(null);
  };
  reactExports.useEffect(() => {
    setActiveConversationId(conversationId);
    return () => setActiveConversationId(null);
  }, [conversationId, setActiveConversationId]);
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  };
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom <= 80;
  };
  reactExports.useEffect(() => {
    if (!user || !conversationId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data: c } = await supabase.from("conversations").select("is_group, name").eq("id", conversationId).maybeSingle();
      if (cancelled) return;
      setConvo(c);
      const { data: m } = await supabase.from("conversation_members").select("user_id").eq("conversation_id", conversationId);
      const ids = (m ?? []).map((r) => r.user_id);
      const { data: ps } = await supabase.from("profiles").select("id, display_name, username, avatar_url").in("id", ids);
      if (!cancelled) setMembers(ps ?? []);
      const { data: msgs } = await supabase.from("messages").select("id, conversation_id, sender_id, content, image_url, created_at").eq("conversation_id", conversationId).order("created_at", { ascending: true }).limit(200);
      if (!cancelled) {
        setMessages(msgs ?? []);
        setLoading(false);
        isNearBottomRef.current = true;
        scrollToBottom();
        markRead(conversationId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, user?.id]);
  reactExports.useEffect(() => {
    if (!user || !conversationId) return;
    const channel = supabase.channel(`conv:${conversationId}`, {
      config: { broadcast: { self: false }, presence: { key: user.id } }
    });
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        const newMsg = payload.new;
        setMessages((prev) => {
          const optIdx = prev.findIndex(
            (m) => m.pending && m.sender_id === newMsg.sender_id && m.content === newMsg.content
          );
          if (optIdx >= 0) {
            const next = [...prev];
            next[optIdx] = newMsg;
            return next;
          }
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (isNearBottomRef.current) scrollToBottom();
      }
    ).on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        const upd = payload.new;
        setMessages((prev) => prev.map((m) => m.id === upd.id ? { ...m, ...upd } : m));
      }
    ).on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        const del = payload.old;
        setMessages((prev) => prev.filter((m) => m.id !== del.id));
      }
    ).on("broadcast", { event: "typing" }, ({ payload }) => {
      const { userId, displayName, isTyping } = payload;
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
        }, 4e3);
      }
    }).subscribe();
    channelRef.current = channel;
    return () => {
      Object.values(typingTimeoutRef.current).forEach((t) => window.clearTimeout(t));
      typingTimeoutRef.current = {};
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, user?.id]);
  reactExports.useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom();
    }
  }, [messages]);
  reactExports.useEffect(() => {
    return () => {
      if (pendingImagePreviewRef.current) {
        URL.revokeObjectURL(pendingImagePreviewRef.current);
      }
    };
  }, []);
  const broadcastTyping = (isTyping) => {
    const ch = channelRef.current;
    if (!ch || !user) return;
    const me = members.find((m) => m.id === user.id);
    ch.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: user.id, displayName: me?.display_name ?? "Someone", isTyping }
    });
  };
  const lastTypingSentRef = reactExports.useRef(0);
  const onChange = (v) => {
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
    if (!content && !pendingImage || !user || !conversationId) return;
    let image_url = null;
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
    const optimistic = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: content || null,
      image_url,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      pending: true
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    clearPendingImage();
    broadcastTyping(false);
    const { error, data } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: user.id, content: content || null, image_url }).select().single();
    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error(error.message);
    } else if (data) {
      setMessages((prev) => prev.map((m) => m.id === tempId ? data : m));
    }
  };
  const onPickFile = (f) => {
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
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center text-sm text-muted-foreground", children: "Loading chat…" });
  }
  if (!user) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center text-sm text-muted-foreground", children: "Please sign in to view this chat." });
  }
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const others = members.filter((m) => m.id !== user.id);
  const title = convo?.is_group ? convo.name ?? "Group" : others[0]?.display_name ?? "Chat";
  const subtitle = convo?.is_group ? `${members.length} members` : others[0]?.username ? `@${others[0].username}` : "";
  const avatarSrc = convo?.is_group ? null : others[0]?.avatar_url ?? null;
  const typingNames = Object.values(typing);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full min-h-0 overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center gap-3 px-4 md:px-6 py-3 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate({ to: "/app" }), className: "md:hidden size-9 rounded-full grid place-items-center hover:bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: title, src: avatarSrc, size: 40 }),
        !convo?.is_group && others[0] && isOnline(others[0].id) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold truncate", children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground truncate", children: typingNames.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "typing…" }) : !convo?.is_group && others[0] && isOnline(others[0].id) ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-emerald-600", children: "Online" }) : subtitle })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        ref: scrollRef,
        onScroll: handleScroll,
        className: "flex-1 min-h-0 overflow-y-auto scroll-thin px-3 md:px-6 py-4 bg-[image:linear-gradient(180deg,var(--color-background),var(--color-secondary))]",
        style: { overflowAnchor: "none" },
        children: [
          loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground text-center py-8", children: "Loading messages…" }) : messages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground text-center py-12", children: "No messages yet. Say hi 👋" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(MessageGroup, { messages, currentUserId: user.id, memberMap, isGroup: !!convo?.is_group, setMessages }),
          typingNames.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-center mt-2 ml-2 animate-bubble-in", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-bubble-received px-4 py-3 flex gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "typing-dot" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "typing-dot" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "typing-dot" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
              typingNames.join(", "),
              " typing"
            ] })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border bg-card px-3 md:px-6 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]", children: [
      pendingImage && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 relative inline-block", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: pendingImage.preview, alt: "preview", className: "h-24 rounded-xl object-cover" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: clearPendingImage,
            className: "absolute -top-2 -right-2 size-6 rounded-full bg-foreground text-background grid place-items-center",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3.5" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "form",
        {
          onSubmit: (e) => {
            e.preventDefault();
            send();
          },
          className: "flex items-end gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                ref: fileInputRef,
                type: "file",
                accept: "image/*",
                className: "hidden",
                onChange: (e) => {
                  onPickFile(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => fileInputRef.current?.click(),
                className: "size-11 rounded-full bg-secondary text-foreground grid place-items-center hover:bg-accent transition shrink-0",
                title: "Attach photo",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ImagePlus, { className: "size-5" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                value: text,
                onChange: (e) => onChange(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                },
                rows: 1,
                placeholder: "Message",
                className: "flex-1 resize-none rounded-2xl bg-secondary px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-h-32"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "submit",
                disabled: !text.trim() && !pendingImage || uploading,
                className: "size-11 rounded-full bg-primary text-primary-foreground grid place-items-center disabled:opacity-40 hover:opacity-90 transition shrink-0",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "size-5" })
              }
            )
          ]
        }
      )
    ] })
  ] });
}
function MessageGroup({
  messages,
  currentUserId,
  memberMap,
  isGroup,
  setMessages
}) {
  const [editing, setEditing] = reactExports.useState(null);
  const saveEdit = async () => {
    if (!editing) return;
    const { id, text } = editing;
    setEditing(null);
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, content: text } : m));
    const { error } = await supabase.from("messages").update({ content: text, edited_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
  };
  const remove = async (id) => {
    if (!confirm("Delete this message?")) return;
    setMessages((prev) => prev.filter((m) => m.id !== id));
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) toast.error(error.message);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: messages.map((m, i) => {
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
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      showDate && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-[11px] text-muted-foreground my-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-3 py-1 rounded-full bg-secondary", children: dateLabel }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `group flex gap-2 items-end ${isMe ? "justify-end" : "justify-start"} ${sameAsPrev ? "mt-0.5" : "mt-2"}`, children: [
        !isMe && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 shrink-0", children: !sameAsNext && sender && /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: sender.display_name, src: sender.avatar_url, size: 28 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `max-w-[78%] md:max-w-[60%] flex flex-col ${isMe ? "items-end" : "items-start"}`, children: [
          isGroup && !isMe && !sameAsPrev && sender && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-muted-foreground mb-0.5 px-2", children: sender.display_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex items-center gap-1", children: [
            isMe && !isEditing && !m.pending && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "opacity-0 group-hover:opacity-100 transition flex gap-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setEditing({ id: m.id, text: m.content ?? "" }), className: "size-7 rounded-full hover:bg-secondary grid place-items-center", title: "Edit", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "size-3.5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => remove(m.id), className: "size-7 rounded-full hover:bg-destructive/10 hover:text-destructive grid place-items-center", title: "Delete", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5" }) })
            ] }),
            isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 px-3 py-2 rounded-2xl bg-secondary", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  autoFocus: true,
                  value: editing.text,
                  onChange: (e) => setEditing({ id: m.id, text: e.target.value }),
                  onKeyDown: (e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") setEditing(null);
                  },
                  className: "bg-transparent text-sm focus:outline-none min-w-[200px]"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: saveEdit, className: "text-xs font-bold text-primary", children: "Save" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setEditing(null), className: "text-xs text-muted-foreground", children: "Cancel" })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: `overflow-hidden text-[15px] leading-snug shadow-[var(--shadow-bubble)] animate-bubble-in whitespace-pre-wrap break-words ${isMe ? "bg-bubble-sent text-bubble-sent-foreground" : "bg-bubble-received text-bubble-received-foreground"} ${m.pending ? "opacity-70" : ""} ${m.image_url && !m.content ? "p-1" : "px-4 py-2.5"}`,
                style: {
                  borderRadius: isMe ? `20px 20px ${sameAsNext ? "6px" : "20px"} 20px` : `20px 20px 20px ${sameAsNext ? "6px" : "20px"}`
                },
                children: [
                  m.image_url && /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: m.image_url, target: "_blank", rel: "noreferrer", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: m.image_url, alt: "", className: "rounded-xl max-h-72 object-cover", loading: "lazy" }) }),
                  m.content && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: m.image_url ? "mt-2 px-3 pb-1" : "", children: m.content })
                ]
              }
            )
          ] }),
          !m.pending && !isEditing && !m.id.startsWith("temp-") && /* @__PURE__ */ jsxRuntimeExports.jsx(MessageReactions, { messageId: m.id, scope: "dm", align: isMe ? "right" : "left" }),
          !sameAsNext && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground mt-0.5 px-2", children: format(d, "h:mm a") })
        ] })
      ] })
    ] }, m.id);
  }) });
}
function ChatPage() {
  const {
    conversationId
  } = Route.useParams();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 min-w-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:flex w-[360px] border-r border-border flex-col", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ConversationList, { activeId: conversationId }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChatThread, { conversationId }) })
  ] });
}
export {
  ChatPage as component
};
