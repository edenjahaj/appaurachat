import { W as jsxRuntimeExports } from "./server-U61-uJh3.js";
import { c as createLucideIcon, u as useAuth, N as Navigate, L as Link } from "./router-CYx1i6QQ.js";
import { S as Sparkles } from "./sparkles-C84uWSkY.js";
import { U as Users } from "./users-BbnFoWHR.js";
import { M as MessageCircle } from "./message-circle-C2SfUIBS.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode = [
  [
    "path",
    {
      d: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
      key: "1xq2db"
    }
  ]
];
const Zap = createLucideIcon("zap", __iconNode);
function Landing() {
  const {
    user,
    loading
  } = useAuth();
  if (loading) return null;
  if (user) return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/app" });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between px-6 py-5 max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-9 rounded-2xl bg-[image:var(--gradient-aurora)] grid place-items-center text-white font-bold", children: "A" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl font-bold aura-brand", children: "AURA" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", className: "rounded-full px-4 py-2 text-sm font-medium hover:bg-secondary transition", children: "Sign in" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", search: {
          mode: "signup"
        }, className: "rounded-full px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90", children: "Get started" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "max-w-6xl mx-auto px-6 pt-16 pb-24", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center max-w-3xl mx-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-3.5" }),
          " Real-time. Beautiful. Yours."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-5xl md:text-7xl font-extrabold tracking-tight", children: [
          "Chat that feels ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "aura-brand", children: "alive." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-lg text-muted-foreground", children: "Message friends instantly, create groups, share 24-hour stories. Built for speed, designed to feel premium." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex justify-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", search: {
            mode: "signup"
          }, className: "rounded-full px-6 py-3 font-semibold bg-primary text-primary-foreground shadow-lg hover:opacity-90", children: "Start chatting free" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", className: "rounded-full px-6 py-3 font-semibold border border-border hover:bg-secondary", children: "I have an account" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-24 grid md:grid-cols-3 gap-6", children: [{
        icon: Zap,
        title: "Instant delivery",
        desc: "Real-time messages with no refresh."
      }, {
        icon: Users,
        title: "Groups & DMs",
        desc: "Spin up a group in two taps."
      }, {
        icon: MessageCircle,
        title: "Stories",
        desc: "Share moments that vanish in 24 hours."
      }].map((f) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-11 rounded-2xl bg-accent grid place-items-center mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(f.icon, { className: "size-5 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-lg", children: f.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: f.desc })
      ] }, f.title)) })
    ] })
  ] });
}
export {
  Landing as component
};
