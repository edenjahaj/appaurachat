import { W as jsxRuntimeExports, r as reactExports, a1 as Outlet } from "./server-U61-uJh3.js";
import { c as createLucideIcon, u as useAuth, d as useRealtime, L as Link, X, a as useNavigate } from "./router-CYx1i6QQ.js";
import { u as useLocation } from "./useLocation-Chz8CjD_.js";
import { A as Avatar } from "./Avatar-CxBchUvZ.js";
import { M as MessageCircle } from "./message-circle-C2SfUIBS.js";
import { G as GraduationCap } from "./graduation-cap-Dkf2mlZQ.js";
import { U as Users } from "./users-BbnFoWHR.js";
import { S as Sparkles } from "./sparkles-C84uWSkY.js";
import { L as LogOut } from "./log-out-tubGK6IY.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode = [
  [
    "path",
    {
      d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
      key: "1i5ecw"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
];
const Settings = createLucideIcon("settings", __iconNode);
function Sidebar() {
  const { profile, signOut } = useAuth();
  const { totalUnread } = useRealtime();
  const loc = useLocation();
  const isActive = (p) => loc.pathname === p || loc.pathname.startsWith(p + "/");
  const items = [
    { to: "/app", icon: MessageCircle, label: "Chats", match: "/app" },
    { to: "/app/cls", icon: GraduationCap, label: "Classes", match: "/app/cls" },
    { to: "/app/people", icon: Users, label: "People", match: "/app/people" },
    { to: "/app/stories", icon: Sparkles, label: "Stories", match: "/app/stories" },
    { to: "/app/settings", icon: Settings, label: "Settings", match: "/app/settings" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "w-[80px] border-r border-border bg-card flex flex-col items-center py-4 gap-1 shrink-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/app", className: "size-11 rounded-2xl bg-[image:var(--gradient-aurora)] grid place-items-center text-white font-bold mb-2", children: "A" }),
    items.map((it) => {
      const active = it.match === "/app" ? loc.pathname === "/app" || loc.pathname.startsWith("/app/c/") : isActive(it.match);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: it.to,
          className: `size-12 rounded-2xl grid place-items-center transition relative ${active ? "bg-accent text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`,
          title: it.label,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(it.icon, { className: "size-5" }),
            it.label === "Chats" && totalUnread > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center ring-2 ring-card", children: totalUnread > 99 ? "99+" : totalUnread }),
            active && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary" })
          ]
        },
        it.to
      );
    }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-auto flex flex-col items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: signOut,
          className: "size-11 rounded-2xl grid place-items-center text-muted-foreground hover:bg-secondary hover:text-destructive transition",
          title: "Sign out",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "size-5" })
        }
      ),
      profile && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/app/profile", title: "Profile", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: profile.display_name, src: profile.avatar_url, size: 40 }) })
    ] })
  ] });
}
function MobileBottomNav() {
  const loc = useLocation();
  const { totalUnread } = useRealtime();
  const items = [
    { to: "/app", icon: MessageCircle, label: "Chats", badge: totalUnread, match: (p) => p === "/app" || p.startsWith("/app/c/") },
    { to: "/app/cls", icon: GraduationCap, label: "Classes", match: (p) => p.startsWith("/app/cls") },
    { to: "/app/people", icon: Users, label: "People", match: (p) => p.startsWith("/app/people") },
    { to: "/app/stories", icon: Sparkles, label: "Stories", match: (p) => p.startsWith("/app/stories") },
    { to: "/app/settings", icon: Settings, label: "Settings", match: (p) => p.startsWith("/app/settings") || p.startsWith("/app/profile") }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "md:hidden fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur border-t border-border pb-[max(env(safe-area-inset-bottom),0.25rem)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "flex items-stretch justify-around", children: items.map((it) => {
    const active = it.match(loc.pathname);
    return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: it.to, className: `relative flex flex-col items-center gap-0.5 py-2 transition ${active ? "text-primary" : "text-muted-foreground"}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(it.icon, { className: "size-5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-semibold", children: it.label }),
      "badge" in it && it.badge && it.badge > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute top-1 right-[28%] min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold grid place-items-center", children: it.badge > 99 ? "99+" : it.badge }) : null
    ] }) }, it.to);
  }) }) });
}
const KEY = "aura.update.v2";
const NOTES = [
  "Light & dark themes with auto mode",
  "Settings hub + editable profile",
  "Pin best friends to the top",
  "Mobile bottom navigation",
  "Emoji reactions, replies & pinned messages"
];
function UpdateAnnouncement() {
  const [open, setOpen] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);
  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setOpen(false);
  };
  if (!open) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm p-4 animate-in fade-in", onClick: dismiss, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      onClick: (e) => e.stopPropagation(),
      className: "relative w-full max-w-sm rounded-3xl bg-card border border-border shadow-2xl p-6 animate-in zoom-in-95",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: dismiss, className: "absolute top-3 right-3 size-8 rounded-full hover:bg-secondary grid place-items-center", "aria-label": "Close", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-14 rounded-2xl bg-[image:var(--gradient-aurora)] grid place-items-center mb-3 shadow-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-7 text-white" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-bold uppercase tracking-wider text-primary mb-1", children: "What's new · v2.0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-extrabold mb-3", children: "AURA just got better" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2 mb-5", children: NOTES.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-2 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary mt-0.5", children: "✦" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: n })
        ] }, n)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: dismiss, className: "w-full rounded-2xl bg-primary text-primary-foreground py-3 font-semibold hover:opacity-90 transition", children: "Let's go" })
      ]
    }
  ) });
}
function AppLayout() {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  reactExports.useEffect(() => {
    if (!loading && !user) navigate({
      to: "/auth"
    });
  }, [user, loading, navigate]);
  if (loading || !user) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-[100dvh] w-screen flex bg-background overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:flex", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sidebar, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 min-w-0 flex flex-col pb-[60px] md:pb-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MobileBottomNav, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(UpdateAnnouncement, {})
  ] });
}
export {
  AppLayout as component
};
