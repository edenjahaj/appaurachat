import { r as reactExports, W as jsxRuntimeExports } from "./server-U61-uJh3.js";
import { c as createLucideIcon, u as useAuth, s as supabase, X, t as toast, d as useRealtime, f as useFavorites, L as Link } from "./router-CYx1i6QQ.js";
import { A as Avatar } from "./Avatar-CxBchUvZ.js";
import { P as Plus } from "./plus-7Bfs70-e.js";
import { S as Search, a as Star } from "./star-BsOXsYFc.js";
import { f as formatDistanceToNowStrict } from "./formatDistanceToNowStrict-DBgh6Ve6.js";
const __iconNode = [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2", key: "1m3agn" }],
  ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }],
  ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21", key: "1xmnt7" }]
];
const Image = createLucideIcon("image", __iconNode);
function CreateGroupDialog({ open, onClose, onCreated }) {
  const { user } = useAuth();
  const [name, setName] = reactExports.useState("");
  const [people, setPeople] = reactExports.useState([]);
  const [selected, setSelected] = reactExports.useState(/* @__PURE__ */ new Set());
  const [submitting, setSubmitting] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!open || !user) return;
    setName("");
    setSelected(/* @__PURE__ */ new Set());
    (async () => {
      const { data } = await supabase.from("profiles").select("id, display_name, username, avatar_url").neq("id", user.id).order("display_name");
      setPeople(data ?? []);
    })();
  }, [open, user?.id]);
  if (!open) return null;
  const submit = async () => {
    if (!name.trim()) return toast.error("Give the group a name");
    if (selected.size === 0) return toast.error("Add at least one person");
    setSubmitting(true);
    const { error } = await supabase.rpc("create_group", { _name: name.trim(), _member_ids: Array.from(selected) });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Group created");
    onCreated();
    onClose();
  };
  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-black/40 p-4", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[80vh]", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-5 border-b border-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-bold text-lg", children: "New group" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "size-8 rounded-full grid place-items-center hover:bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5 space-y-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "Group name", className: "w-full rounded-xl bg-secondary px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring", maxLength: 40 }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto scroll-thin px-3 pb-3", children: people.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => toggle(p.id), className: `w-full flex items-center gap-3 p-2 rounded-2xl transition ${selected.has(p.id) ? "bg-accent" : "hover:bg-secondary"}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: p.display_name, src: p.avatar_url, size: 40 }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 text-left min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium truncate", children: p.display_name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground truncate", children: [
          "@",
          p.username
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `size-5 rounded-full border-2 ${selected.has(p.id) ? "bg-primary border-primary" : "border-border"}` })
    ] }, p.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5 border-t border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: submit, disabled: submitting, className: "w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 disabled:opacity-50 hover:opacity-90", children: "Create group" }) })
  ] }) });
}
function ConversationList({ activeId }) {
  const { user } = useAuth();
  const { unread, isOnline } = useRealtime();
  const { isFavorite } = useFavorites();
  const [convos, setConvos] = reactExports.useState([]);
  const [q, setQ] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(true);
  const [showGroup, setShowGroup] = reactExports.useState(false);
  const load = async () => {
    if (!user) return;
    const { data: memberRows } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", user.id);
    const ids = (memberRows ?? []).map((r) => r.conversation_id);
    if (ids.length === 0) {
      setConvos([]);
      setLoading(false);
      return;
    }
    const { data: convData } = await supabase.from("conversations").select("id, is_group, name, last_message_at").in("id", ids).order("last_message_at", { ascending: false });
    const { data: allMembers } = await supabase.from("conversation_members").select("conversation_id, user_id").in("conversation_id", ids);
    const otherUserIds = Array.from(new Set((allMembers ?? []).map((m) => m.user_id)));
    const { data: profiles } = await supabase.from("profiles").select("id, display_name, username, avatar_url").in("id", otherUserIds);
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const lastMessages = {};
    await Promise.all(
      ids.map(async (cid) => {
        const { data } = await supabase.from("messages").select("content, image_url, created_at, sender_id").eq("conversation_id", cid).order("created_at", { ascending: false }).limit(1);
        if (data && data[0]) lastMessages[cid] = data[0];
      })
    );
    const rows = (convData ?? []).map((c) => ({
      id: c.id,
      is_group: c.is_group,
      name: c.name,
      last_message_at: c.last_message_at,
      members: (allMembers ?? []).filter((m) => m.conversation_id === c.id).map((m) => ({ user_id: m.user_id, profile: profileMap.get(m.user_id) ?? null })),
      last_message: lastMessages[c.id] ?? null
    }));
    setConvos(rows);
    setLoading(false);
  };
  reactExports.useEffect(() => {
    load();
  }, [user?.id]);
  reactExports.useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("convo-list").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => load()).on("postgres_changes", { event: "INSERT", schema: "public", table: "conversation_members" }, () => load()).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id]);
  const filtered = convos.filter((c) => {
    if (!q) return true;
    const title = c.is_group ? c.name ?? "" : c.members.find((m) => m.user_id !== user?.id)?.profile?.display_name ?? "";
    return title.toLowerCase().includes(q.toLowerCase());
  }).sort((a, b) => {
    const aFav = !a.is_group && isFavorite(a.members.find((m) => m.user_id !== user?.id)?.user_id ?? "") ? 1 : 0;
    const bFav = !b.is_group && isFavorite(b.members.find((m) => m.user_id !== user?.id)?.user_id ?? "") ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pt-5 pb-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-extrabold", children: "Chats" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setShowGroup(true),
          className: "size-9 rounded-full bg-accent text-primary grid place-items-center hover:opacity-90 transition",
          title: "New group",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-5" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          value: q,
          onChange: (e) => setQ(e.target.value),
          placeholder: "Search",
          className: "w-full pl-9 pr-3 py-2.5 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto scroll-thin px-2 pb-4", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 text-sm text-muted-foreground", children: "Loading…" }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No conversations yet." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/app/people", className: "inline-block mt-3 text-sm font-semibold text-primary hover:underline", children: "Find people →" })
    ] }) : filtered.map((c) => {
      const others = c.members.filter((m) => m.user_id !== user?.id);
      const title = c.is_group ? c.name ?? "Group" : others[0]?.profile?.display_name ?? "Unknown";
      const avatarName = title;
      const avatarSrc = c.is_group ? null : others[0]?.profile?.avatar_url ?? null;
      const last = c.last_message;
      const lastPreview = last ? last.image_url ? "📷 Photo" : last.content ?? "" : "Say hi 👋";
      const lastText = last && last.sender_id === user?.id ? `You: ${lastPreview}` : lastPreview;
      const time = last ? formatDistanceToNowStrict(new Date(last.created_at), { addSuffix: false }) : "";
      const active = c.id === activeId;
      const count = unread[c.id] ?? 0;
      const otherId = others[0]?.user_id;
      const online = !c.is_group && otherId ? isOnline(otherId) : false;
      const fav = !c.is_group && otherId ? isFavorite(otherId) : false;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: "/app/c/$conversationId",
          params: { conversationId: c.id },
          className: `flex gap-3 p-3 rounded-2xl mx-1 my-0.5 transition ${active ? "bg-accent" : fav ? "bg-amber-400/[0.06] hover:bg-amber-400/[0.12]" : "hover:bg-secondary"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative shrink-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: avatarName, src: avatarSrc, size: 48 }),
              online && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-card" }),
              fav && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1 -right-1 size-4 rounded-full bg-amber-400 grid place-items-center ring-2 ring-card", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "size-2.5 fill-white text-white" }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `truncate ${count > 0 ? "font-bold" : "font-semibold"}`, children: title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-[10px] shrink-0 ${count > 0 ? "text-primary font-semibold" : "text-muted-foreground"}`, children: time })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-sm truncate ${count > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`, children: [
                  last?.image_url && /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "inline size-3.5 mr-1 -mt-0.5" }),
                  lastText
                ] }),
                count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold grid place-items-center", children: count > 99 ? "99+" : count })
              ] })
            ] })
          ]
        },
        c.id
      );
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CreateGroupDialog, { open: showGroup, onClose: () => setShowGroup(false), onCreated: () => load() })
  ] });
}
export {
  ConversationList as C
};
