import { r as reactExports, W as jsxRuntimeExports } from "./server-U61-uJh3.js";
import { c as createLucideIcon, u as useAuth, L as Link, s as supabase } from "./router-CYx1i6QQ.js";
import { u as useLocation } from "./useLocation-Chz8CjD_.js";
import { A as ArrowLeft } from "./arrow-left-D1Xbmolz.js";
import { S as Sparkles } from "./sparkles-C84uWSkY.js";
import { G as GraduationCap } from "./graduation-cap-Dkf2mlZQ.js";
import { M as Megaphone, H as Hash } from "./megaphone-B00_iPIF.js";
const __iconNode$1 = [
  [
    "path",
    {
      d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20",
      key: "k3hazp"
    }
  ]
];
const Book = createLucideIcon("book", __iconNode$1);
const __iconNode = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M8 14s1.5 2 4 2 4-2 4-2", key: "1y1vjs" }],
  ["line", { x1: "9", x2: "9.01", y1: "9", y2: "9", key: "yxxnd0" }],
  ["line", { x1: "15", x2: "15.01", y1: "9", y2: "9", key: "1p4y9e" }]
];
const Smile = createLucideIcon("smile", __iconNode);
const ICONS = {
  hash: Hash,
  megaphone: Megaphone,
  book: Book,
  "graduation-cap": GraduationCap,
  smile: Smile,
  sparkles: Sparkles
};
function ChannelRail({ classId, className }) {
  const { user } = useAuth();
  const loc = useLocation();
  const [klass, setKlass] = reactExports.useState(null);
  const [channels, setChannels] = reactExports.useState([]);
  const [unread, setUnread] = reactExports.useState({});
  reactExports.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [{ data: c }, { data: chs }, { data: reads }] = await Promise.all([
        supabase.from("classes").select("name, join_code").eq("id", classId).maybeSingle(),
        supabase.from("channels").select("id, slug, name, icon, is_announcements, position").eq("class_id", classId).order("position"),
        user ? supabase.from("channel_reads").select("channel_id, last_read_at").eq("user_id", user.id) : Promise.resolve({ data: [] })
      ]);
      if (cancelled) return;
      setKlass(c);
      const list = chs ?? [];
      setChannels(list);
      const readMap = /* @__PURE__ */ new Map();
      (reads ?? []).forEach((r) => readMap.set(r.channel_id, r.last_read_at));
      const counts = {};
      await Promise.all(
        list.map(async (ch) => {
          const lr = readMap.get(ch.id) ?? "1970-01-01";
          const { count } = await supabase.from("channel_messages").select("id", { count: "exact", head: true }).eq("channel_id", ch.id).gt("created_at", lr).neq("sender_id", user?.id ?? "");
          counts[ch.id] = count ?? 0;
        })
      );
      if (!cancelled) setUnread(counts);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [classId, user?.id, loc.pathname]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: `w-[240px] border-r border-border bg-card flex flex-col shrink-0 ${className ?? ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-4 border-b border-border flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/app/cls", className: "size-8 rounded-full hover:bg-secondary grid place-items-center", title: "Back", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold truncate", children: klass?.name ?? "…" }),
        klass && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-mono tracking-widest text-muted-foreground", children: [
          "#",
          klass.join_code
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "flex-1 overflow-y-auto scroll-thin py-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-4 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground", children: "Channels" }),
      channels.map((ch) => {
        const Icon = ICONS[ch.icon ?? "hash"] ?? Hash;
        const active = loc.pathname === `/app/cls/${classId}/${ch.slug}`;
        const count = unread[ch.id] ?? 0;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/app/cls/$classId/$channelSlug",
            params: { classId, channelSlug: ch.slug },
            className: `mx-2 my-0.5 flex items-center gap-2 px-2.5 py-2 rounded-xl transition ${active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-4 shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `flex-1 truncate text-sm ${count > 0 ? "font-bold text-foreground" : "font-medium"}`, children: ch.name }),
              count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center", children: count > 99 ? "99+" : count })
            ]
          },
          ch.id
        );
      })
    ] })
  ] });
}
export {
  ChannelRail as C
};
