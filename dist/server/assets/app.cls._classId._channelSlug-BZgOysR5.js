import { r as reactExports, W as jsxRuntimeExports } from "./server-U61-uJh3.js";
import { c as createLucideIcon, u as useAuth, s as supabase, X, t as toast, j as Route } from "./router-CYx1i6QQ.js";
import { A as Avatar } from "./Avatar-CxBchUvZ.js";
import { f as format, M as MessageReactions, P as Pencil, T as Trash2, S as Send, i as isToday, a as isYesterday } from "./MessageReactions-C_O0YV01.js";
import { H as Hash, M as Megaphone } from "./megaphone-B00_iPIF.js";
import { S as Search, a as Star } from "./star-BsOXsYFc.js";
import { P as Plus } from "./plus-7Bfs70-e.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./en-US-CqQV4g4D.js";
const __iconNode$3 = [
  ["path", { d: "M12 17v5", key: "bb1du9" }],
  ["path", { d: "M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89", key: "znwnzq" }],
  ["path", { d: "m2 2 20 20", key: "1ooewy" }],
  [
    "path",
    {
      d: "M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11",
      key: "c9qhm2"
    }
  ]
];
const PinOff = createLucideIcon("pin-off", __iconNode$3);
const __iconNode$2 = [
  ["path", { d: "M12 17v5", key: "bb1du9" }],
  [
    "path",
    {
      d: "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z",
      key: "1nkz8b"
    }
  ]
];
const Pin = createLucideIcon("pin", __iconNode$2);
const __iconNode$1 = [
  ["path", { d: "M20 18v-2a4 4 0 0 0-4-4H4", key: "5vmcpk" }],
  ["path", { d: "m9 17-5-5 5-5", key: "nvlc11" }]
];
const Reply = createLucideIcon("reply", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
      key: "wmoenq"
    }
  ],
  ["path", { d: "M12 9v4", key: "juzpu7" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
];
const TriangleAlert = createLucideIcon("triangle-alert", __iconNode);
function dayLabel(d) {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}
function ChannelView({ classId, channelId, channelName, isAdmin }) {
  const { user } = useAuth();
  const [messages, setMessages] = reactExports.useState([]);
  const [profiles, setProfiles] = reactExports.useState(/* @__PURE__ */ new Map());
  const [text, setText] = reactExports.useState("");
  const [editing, setEditing] = reactExports.useState(null);
  const [replyTo, setReplyTo] = reactExports.useState(null);
  const [search, setSearch] = reactExports.useState("");
  const [showSearch, setShowSearch] = reactExports.useState(false);
  const [showPinned, setShowPinned] = reactExports.useState(false);
  const scrollRef = reactExports.useRef(null);
  const channelRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("channel_messages").select("id, channel_id, sender_id, content, edited_at, deleted_at, created_at, parent_id, pinned").eq("channel_id", channelId).order("created_at", { ascending: true }).limit(200);
      if (cancelled) return;
      const msgs = data ?? [];
      setMessages(msgs);
      const senderIds = Array.from(new Set(msgs.map((m) => m.sender_id)));
      if (senderIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", senderIds);
        if (!cancelled) setProfiles(new Map((profs ?? []).map((p) => [p.id, p])));
      }
      await supabase.rpc("mark_channel_read", { _channel_id: channelId });
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
    })();
    return () => {
      cancelled = true;
    };
  }, [channelId]);
  reactExports.useEffect(() => {
    const ch = supabase.channel(`channel:${channelId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "channel_messages", filter: `channel_id=eq.${channelId}` }, async (p) => {
      const m = p.new;
      setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
      if (!profiles.has(m.sender_id)) {
        const { data: prof } = await supabase.from("profiles").select("id, display_name, avatar_url").eq("id", m.sender_id).maybeSingle();
        if (prof) setProfiles((mp) => new Map(mp).set(prof.id, prof));
      }
      if (m.sender_id !== user?.id) {
        await supabase.rpc("mark_channel_read", { _channel_id: channelId });
      }
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }));
    }).on("postgres_changes", { event: "UPDATE", schema: "public", table: "channel_messages", filter: `channel_id=eq.${channelId}` }, (p) => {
      const m = p.new;
      setMessages((prev) => prev.map((x) => x.id === m.id ? m : x));
    }).on("postgres_changes", { event: "DELETE", schema: "public", table: "channel_messages", filter: `channel_id=eq.${channelId}` }, (p) => {
      const m = p.old;
      setMessages((prev) => prev.filter((x) => x.id !== m.id));
    }).subscribe();
    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
    };
  }, [channelId, user?.id]);
  const send = async () => {
    if (!user || !text.trim()) return;
    const content = text.trim();
    const parent_id = replyTo?.id ?? null;
    setText("");
    setReplyTo(null);
    const tempId = `tmp-${Date.now()}`;
    const optimistic = { id: tempId, channel_id: channelId, sender_id: user.id, content, edited_at: null, deleted_at: null, created_at: (/* @__PURE__ */ new Date()).toISOString(), parent_id, pinned: false, pending: true };
    setMessages((p) => [...p, optimistic]);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
    const { data, error } = await supabase.from("channel_messages").insert({ channel_id: channelId, sender_id: user.id, content, parent_id }).select().single();
    if (error) {
      toast.error(error.message);
      setMessages((p) => p.filter((m) => m.id !== tempId));
    } else {
      setMessages((p) => p.map((m) => m.id === tempId ? data : m));
    }
  };
  const togglePin = async (m) => {
    const { error } = await supabase.from("channel_messages").update({ pinned: !m.pinned }).eq("id", m.id);
    if (error) toast.error(error.message);
  };
  const saveEdit = async () => {
    if (!editing) return;
    const { id, text: t } = editing;
    setEditing(null);
    const { error } = await supabase.from("channel_messages").update({ content: t, edited_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
  };
  const remove = async (id) => {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("channel_messages").delete().eq("id", id);
    if (error) toast.error(error.message);
  };
  const filtered = reactExports.useMemo(() => {
    if (!search.trim()) return messages;
    const q = search.toLowerCase();
    return messages.filter((m) => (m.content ?? "").toLowerCase().includes(q));
  }, [messages, search]);
  const grouped = reactExports.useMemo(() => {
    const out = [];
    let cur = null;
    for (const m of filtered) {
      const d = new Date(m.created_at);
      const key = d.toDateString();
      if (!cur || cur.key !== key) {
        cur = { key, label: dayLabel(d), items: [] };
        out.push(cur);
      }
      cur.items.push(m);
    }
    return out;
  }, [filtered]);
  const messageMap = reactExports.useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const pinnedList = reactExports.useMemo(() => messages.filter((m) => m.pinned), [messages]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 flex flex-col bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "h-14 px-4 border-b border-border flex items-center gap-3 bg-card/60 backdrop-blur", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Hash, { className: "size-4 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-bold truncate", children: channelName }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
        pinnedList.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setShowPinned((s) => !s), className: "h-9 px-3 rounded-full hover:bg-secondary flex items-center gap-1.5 text-xs font-semibold", title: "Pinned", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Pin, { className: "size-3.5" }),
          " ",
          pinnedList.length
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowSearch((s) => !s), className: "size-9 rounded-full hover:bg-secondary grid place-items-center", title: "Search", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "size-4" }) })
      ] })
    ] }),
    showSearch && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-2 border-b border-border bg-card/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        autoFocus: true,
        value: search,
        onChange: (e) => setSearch(e.target.value),
        placeholder: `Search in #${channelName}…`,
        className: "w-full px-3 py-2 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      }
    ) }),
    showPinned && pinnedList.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-2 border-b border-border bg-amber-500/5 max-h-48 overflow-y-auto scroll-thin", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] uppercase font-bold text-muted-foreground mb-1.5 flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Pin, { className: "size-3" }),
        " Pinned"
      ] }),
      pinnedList.map((m) => {
        const prof = profiles.get(m.sender_id);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs py-1 border-b border-border/40 last:border-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold", children: [
            prof?.display_name ?? "Unknown",
            ": "
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: m.content })
        ] }, m.id);
      })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: scrollRef, className: "flex-1 overflow-y-auto scroll-thin px-4 py-3 space-y-1", children: [
      grouped.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-sm text-muted-foreground py-12", children: "No messages yet — say hi 👋" }),
      grouped.map((g) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "my-3 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-border" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: g.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-border" })
        ] }),
        g.items.map((m, i) => {
          const prev = g.items[i - 1];
          const sameAuthor = prev && prev.sender_id === m.sender_id && !m.parent_id && new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1e3;
          const prof = profiles.get(m.sender_id);
          const mine = m.sender_id === user?.id;
          const isEditing = editing?.id === m.id;
          const parent = m.parent_id ? messageMap.get(m.parent_id) : null;
          const parentProf = parent ? profiles.get(parent.sender_id) : null;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `group relative flex gap-3 px-2 py-1 rounded-lg hover:bg-secondary/40 ${sameAuthor ? "" : "mt-2"} ${m.pinned ? "border-l-2 border-amber-500/60 bg-amber-500/[0.03]" : ""} animate-bubble-in`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 shrink-0 pt-0.5", children: !sameAuthor && /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: prof?.display_name ?? "?", src: prof?.avatar_url, size: 32 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              !sameAuthor && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2 mb-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-sm", children: prof?.display_name ?? "Unknown" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground", children: format(new Date(m.created_at), "h:mm a") }),
                m.pinned && /* @__PURE__ */ jsxRuntimeExports.jsx(Pin, { className: "size-3 text-amber-500" })
              ] }),
              parent && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs mb-1 px-2 py-1 rounded-md bg-secondary/60 border-l-2 border-primary/60 max-w-md truncate", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-primary", children: parentProf?.display_name ?? "Unknown" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                  " · ",
                  parent.content
                ] })
              ] }),
              isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
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
                    className: "flex-1 px-3 py-1.5 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: saveEdit, className: "text-xs font-bold text-primary", children: "Save" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setEditing(null), className: "text-xs text-muted-foreground", children: "Cancel" })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-sm whitespace-pre-wrap break-words ${m.pending ? "opacity-60" : ""}`, children: [
                m.content,
                m.edited_at && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 text-[10px] text-muted-foreground", children: "(edited)" })
              ] }),
              !m.pending && !isEditing && /* @__PURE__ */ jsxRuntimeExports.jsx(MessageReactions, { messageId: m.id, scope: "channel" })
            ] }),
            !isEditing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-0 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5 bg-card border border-border rounded-full shadow-sm px-1 py-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setReplyTo(m), className: "size-7 rounded-full hover:bg-secondary grid place-items-center", title: "Reply", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Reply, { className: "size-3.5" }) }),
              isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => togglePin(m), className: "size-7 rounded-full hover:bg-secondary grid place-items-center", title: m.pinned ? "Unpin" : "Pin", children: m.pinned ? /* @__PURE__ */ jsxRuntimeExports.jsx(PinOff, { className: "size-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Pin, { className: "size-3.5" }) }),
              mine && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setEditing({ id: m.id, text: m.content ?? "" }), className: "size-7 rounded-full hover:bg-secondary grid place-items-center", title: "Edit", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "size-3.5" }) }),
              (mine || isAdmin) && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => remove(m.id), className: "size-7 rounded-full hover:bg-destructive/10 hover:text-destructive grid place-items-center", title: "Delete", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5" }) })
            ] })
          ] }, m.id);
        })
      ] }, g.key))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border p-3 bg-card/60 backdrop-blur", children: [
      replyTo && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 px-3 py-2 rounded-xl bg-secondary/60 flex items-start gap-2 text-xs border-l-2 border-primary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-semibold text-primary", children: [
            "Replying to ",
            profiles.get(replyTo.sender_id)?.display_name ?? "Unknown"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground truncate", children: replyTo.content })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setReplyTo(null), className: "size-6 rounded-full hover:bg-secondary grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3.5" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value: text,
            onChange: (e) => setText(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
              if (e.key === "Escape") setReplyTo(null);
            },
            placeholder: replyTo ? `Reply…` : `Message #${channelName}`,
            className: "flex-1 bg-transparent focus:outline-none text-sm py-1"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: send, disabled: !text.trim(), className: "size-9 rounded-full bg-primary text-primary-foreground grid place-items-center disabled:opacity-40 hover:opacity-90 transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "size-4" }) })
      ] })
    ] })
  ] });
}
function NewAnnouncementDialog({ open, onClose, classId, onCreated }) {
  const { user } = useAuth();
  const [title, setTitle] = reactExports.useState("");
  const [body, setBody] = reactExports.useState("");
  const [severity, setSeverity] = reactExports.useState("normal");
  const [pinned, setPinned] = reactExports.useState(false);
  const [busy, setBusy] = reactExports.useState(false);
  if (!open) return null;
  const submit = async () => {
    if (!user || !title.trim() || !body.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("announcements").insert({
      class_id: classId,
      author_id: user.id,
      title: title.trim(),
      body: body.trim(),
      severity,
      pinned
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Announcement posted");
    setTitle("");
    setBody("");
    setSeverity("normal");
    setPinned(false);
    onCreated();
    onClose();
  };
  const opts = [
    { v: "normal", label: "Normal", Icon: Megaphone, cls: "bg-secondary text-foreground" },
    { v: "important", label: "Important", Icon: Star, cls: "bg-primary/15 text-primary" },
    { v: "critical", label: "Critical", Icon: TriangleAlert, cls: "bg-destructive text-destructive-foreground" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-5", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold", children: "New announcement" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "size-8 rounded-full hover:bg-secondary grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          autoFocus: true,
          value: title,
          onChange: (e) => setTitle(e.target.value),
          placeholder: "Title",
          maxLength: 120,
          className: "w-full px-4 py-3 rounded-2xl bg-secondary focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          value: body,
          onChange: (e) => setBody(e.target.value),
          placeholder: "What do you want to announce?",
          maxLength: 2e3,
          rows: 5,
          className: "w-full px-4 py-3 rounded-2xl bg-secondary focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-muted-foreground mb-2", children: "Severity" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: opts.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setSeverity(o.v),
            className: `px-2 py-2 rounded-xl text-xs font-bold inline-flex flex-col items-center gap-1 border transition ${severity === o.v ? `${o.cls} border-transparent shadow` : "border-border bg-card text-muted-foreground hover:bg-secondary"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(o.Icon, { className: "size-4" }),
              o.label
            ]
          },
          o.v
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm cursor-pointer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: pinned, onChange: (e) => setPinned(e.target.checked), className: "rounded" }),
        "Pin to top"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: submit,
          disabled: busy || !title.trim() || !body.trim(),
          className: "w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50",
          children: busy ? "Posting…" : "Post announcement"
        }
      )
    ] })
  ] }) });
}
const STYLES = {
  normal: { ring: "border-border", chip: "bg-secondary text-muted-foreground", label: "Normal", Icon: Megaphone },
  important: { ring: "border-transparent [background:linear-gradient(var(--card),var(--card))_padding-box,var(--gradient-aurora)_border-box] border-2", chip: "bg-primary/15 text-primary", label: "Important", Icon: Star },
  critical: { ring: "border-destructive/50 bg-destructive/5", chip: "bg-destructive text-destructive-foreground", label: "Critical", Icon: TriangleAlert }
};
function AnnouncementFeed({ classId, isAdmin }) {
  const { user } = useAuth();
  const [items, setItems] = reactExports.useState([]);
  const [profiles, setProfiles] = reactExports.useState(/* @__PURE__ */ new Map());
  const [reads, setReads] = reactExports.useState(/* @__PURE__ */ new Set());
  const [open, setOpen] = reactExports.useState(false);
  const load = async () => {
    const { data } = await supabase.from("announcements").select("id, class_id, author_id, title, body, severity, pinned, created_at").eq("class_id", classId).order("pinned", { ascending: false }).order("created_at", { ascending: false });
    const list = data ?? [];
    setItems(list);
    const ids = Array.from(new Set(list.map((x) => x.author_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
      setProfiles(new Map((profs ?? []).map((p) => [p.id, p])));
    }
    if (user) {
      const { data: rd } = await supabase.from("announcement_reads").select("announcement_id").eq("user_id", user.id);
      setReads(new Set((rd ?? []).map((r) => r.announcement_id)));
    }
  };
  reactExports.useEffect(() => {
    load();
  }, [classId, user?.id]);
  reactExports.useEffect(() => {
    const ch = supabase.channel(`ann:${classId}`).on("postgres_changes", { event: "*", schema: "public", table: "announcements", filter: `class_id=eq.${classId}` }, () => load()).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [classId]);
  const markRead = async (id) => {
    if (reads.has(id)) return;
    setReads((s) => new Set(s).add(id));
    await supabase.rpc("mark_announcement_read", { _announcement_id: id });
  };
  const remove = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) toast.error(error.message);
  };
  const togglePin = async (a) => {
    const { error } = await supabase.from("announcements").update({ pinned: !a.pinned }).eq("id", a.id);
    if (error) toast.error(error.message);
  };
  const sorted = reactExports.useMemo(() => items, [items]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 flex flex-col bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "h-14 px-4 border-b border-border flex items-center gap-3 bg-card/60 backdrop-blur", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Megaphone, { className: "size-4 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-bold", children: "announcements" }),
      isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setOpen(true),
          className: "ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:opacity-90",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3.5" }),
            " New"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto scroll-thin p-4 space-y-3", children: sorted.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-3xl border border-dashed border-border p-10 text-center mt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-12 rounded-2xl bg-accent grid place-items-center text-primary mx-auto mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Megaphone, { className: "size-6" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "No announcements yet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: isAdmin ? "Post one to get started." : "Check back soon." })
    ] }) : sorted.map((a) => {
      const s = STYLES[a.severity];
      const prof = profiles.get(a.author_id);
      const unread = !reads.has(a.id);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "article",
        {
          onClick: () => markRead(a.id),
          className: `relative rounded-2xl border bg-card backdrop-blur p-4 transition hover:shadow-lg cursor-default ${s.ring}`,
          children: [
            unread && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute top-3 right-3 size-2.5 rounded-full bg-primary ring-2 ring-card" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${s.chip}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(s.Icon, { className: "size-3" }),
                " ",
                s.label
              ] }),
              a.pinned && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-amber-500", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Pin, { className: "size-3" }),
                " Pinned"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-extrabold leading-snug", children: a.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-foreground/90 whitespace-pre-wrap", children: a.body }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: "mt-3 flex items-center gap-2 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: prof?.display_name ?? "?", src: prof?.avatar_url, size: 20 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-foreground", children: prof?.display_name ?? "Unknown" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "·" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: format(new Date(a.created_at), "MMM d, h:mm a") }),
              isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-auto flex gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: (e) => {
                  e.stopPropagation();
                  togglePin(a);
                }, className: "size-7 rounded-md hover:bg-secondary grid place-items-center", title: a.pinned ? "Unpin" : "Pin", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pin, { className: `size-3.5 ${a.pinned ? "text-amber-500" : ""}` }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: (e) => {
                  e.stopPropagation();
                  remove(a.id);
                }, className: "size-7 rounded-md hover:bg-destructive/10 hover:text-destructive grid place-items-center", title: "Delete", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5" }) })
              ] })
            ] })
          ]
        },
        a.id
      );
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(NewAnnouncementDialog, { open, onClose: () => setOpen(false), classId, onCreated: load })
  ] });
}
function ChannelPage() {
  const {
    classId,
    channelSlug
  } = Route.useParams();
  const {
    user
  } = useAuth();
  const [meta, setMeta] = reactExports.useState(null);
  const [isAdmin, setIsAdmin] = reactExports.useState(false);
  const [notFound, setNotFound] = reactExports.useState(false);
  reactExports.useEffect(() => {
    let cancelled = false;
    setMeta(null);
    setNotFound(false);
    (async () => {
      const {
        data: ch
      } = await supabase.from("channels").select("id, name, is_announcements").eq("class_id", classId).eq("slug", channelSlug).maybeSingle();
      if (cancelled) return;
      if (!ch) {
        setNotFound(true);
        return;
      }
      setMeta(ch);
      if (user) {
        const {
          data: m
        } = await supabase.from("class_members").select("role").eq("class_id", classId).eq("user_id", user.id).maybeSingle();
        if (!cancelled) setIsAdmin(m?.role === "admin");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId, channelSlug, user?.id]);
  if (notFound) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 grid place-items-center text-sm text-muted-foreground", children: "Channel not found." });
  if (!meta) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" }) });
  return meta.is_announcements ? /* @__PURE__ */ jsxRuntimeExports.jsx(AnnouncementFeed, { classId, isAdmin }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChannelView, { classId, channelId: meta.id, channelName: meta.name, isAdmin });
}
export {
  ChannelPage as component
};
