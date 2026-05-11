import { r as reactExports, W as jsxRuntimeExports } from "./server-U61-uJh3.js";
import { c as createLucideIcon, a as useNavigate, X, s as supabase, t as toast, u as useAuth, L as Link } from "./router-CYx1i6QQ.js";
import { G as GraduationCap } from "./graduation-cap-Dkf2mlZQ.js";
import { P as Plus } from "./plus-7Bfs70-e.js";
import { U as Users } from "./users-BbnFoWHR.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode$2 = [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]];
const Check = createLucideIcon("check", __iconNode$2);
const __iconNode$1 = [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
];
const Copy = createLucideIcon("copy", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",
      key: "1s6t7t"
    }
  ],
  ["circle", { cx: "16.5", cy: "7.5", r: ".5", fill: "currentColor", key: "w0ekpg" }]
];
const KeyRound = createLucideIcon("key-round", __iconNode);
function CreateJoinClassDialog({ open, onClose, onChanged }) {
  const navigate = useNavigate();
  const [tab, setTab] = reactExports.useState("join");
  const [name, setName] = reactExports.useState("");
  const [code, setCode] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState(false);
  if (!open) return null;
  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("create_class", { _name: name.trim() });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Class created");
    onChanged();
    onClose();
    navigate({ to: "/app/cls/$classId", params: { classId: data } });
  };
  const join = async () => {
    if (code.trim().length < 4) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("join_class", { _code: code.trim().toUpperCase() });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Joined class");
    onChanged();
    onClose();
    navigate({ to: "/app/cls/$classId", params: { classId: data } });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-sm rounded-3xl bg-card border border-border shadow-2xl p-5", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold", children: "Classes" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "size-8 rounded-full hover:bg-secondary grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 bg-secondary rounded-2xl p-1 text-sm font-semibold mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTab("join"), className: `py-2 rounded-xl transition ${tab === "join" ? "bg-card shadow" : "text-muted-foreground"}`, children: "Join" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTab("create"), className: `py-2 rounded-xl transition ${tab === "create" ? "bg-card shadow" : "text-muted-foreground"}`, children: "Create" })
    ] }),
    tab === "join" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-12 rounded-2xl bg-accent grid place-items-center text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "size-6" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-center text-muted-foreground", children: "Enter the 6-character class code from your teacher." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          autoFocus: true,
          value: code,
          onChange: (e) => setCode(e.target.value.toUpperCase()),
          placeholder: "ABCD23",
          maxLength: 8,
          className: "w-full text-center tracking-[0.4em] font-mono text-lg py-3 rounded-2xl bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: join, disabled: busy || code.trim().length < 4, className: "w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50", children: busy ? "Joining…" : "Join class" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-12 rounded-2xl bg-accent grid place-items-center text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { className: "size-6" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-center text-muted-foreground", children: "You'll be the admin. Students join with the code." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          autoFocus: true,
          value: name,
          onChange: (e) => setName(e.target.value),
          placeholder: "e.g. Math 101",
          maxLength: 60,
          className: "w-full py-3 px-4 rounded-2xl bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: create, disabled: busy || !name.trim(), className: "w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50", children: busy ? "Creating…" : "Create class" })
    ] })
  ] }) });
}
function ClassesIndex() {
  const { user } = useAuth();
  useNavigate();
  const [rows, setRows] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [open, setOpen] = reactExports.useState(false);
  const [copied, setCopied] = reactExports.useState(null);
  const load = async () => {
    if (!user) return;
    const { data: members } = await supabase.from("class_members").select("class_id, role").eq("user_id", user.id);
    const ids = (members ?? []).map((m) => m.class_id);
    if (ids.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    const { data: classes } = await supabase.from("classes").select("id, name, join_code").in("id", ids);
    const { data: allMembers } = await supabase.from("class_members").select("class_id, user_id").in("class_id", ids);
    const counts = /* @__PURE__ */ new Map();
    (allMembers ?? []).forEach((m) => counts.set(m.class_id, (counts.get(m.class_id) ?? 0) + 1));
    const roleMap = new Map((members ?? []).map((m) => [m.class_id, m.role]));
    setRows(
      (classes ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        join_code: c.join_code,
        role: roleMap.get(c.id) ?? "student",
        member_count: counts.get(c.id) ?? 1
      }))
    );
    setLoading(false);
  };
  reactExports.useEffect(() => {
    load();
  }, [user?.id]);
  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
      toast.success("Code copied");
    } catch {
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-3xl mx-auto p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-extrabold", children: "Classes" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Join your school's class workspace." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setOpen(true),
          className: "inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4" }),
            " New / Join"
          ]
        }
      )
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "Loading…" }) : rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-3xl border border-dashed border-border p-10 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-14 rounded-2xl bg-accent grid place-items-center text-primary mx-auto mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { className: "size-7" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-lg", children: "No classes yet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1 mb-4", children: "Join with a code from your teacher, or create your own." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setOpen(true), className: "inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4" }),
        " Get started"
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: rows.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-4 hover:shadow-lg transition group", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/app/cls/$classId", params: { classId: c.id }, className: "block", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-12 rounded-2xl bg-[image:var(--gradient-aurora)] grid place-items-center text-white font-extrabold text-lg shrink-0", children: c.name.charAt(0).toUpperCase() }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold truncate", children: c.name }),
            c.role === "admin" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded bg-primary/15 text-primary", children: "Admin" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "size-3" }),
            " ",
            c.member_count,
            " member",
            c.member_count === 1 ? "" : "s"
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: (e) => {
            e.preventDefault();
            copyCode(c.join_code);
          },
          className: "mt-3 w-full inline-flex items-center justify-between gap-2 rounded-xl bg-secondary px-3 py-2 text-xs font-mono hover:bg-accent transition",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Join code" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tracking-[0.3em] font-bold text-foreground", children: c.join_code }),
            copied === c.join_code ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-3.5 text-emerald-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "size-3.5 text-muted-foreground" })
          ]
        }
      )
    ] }, c.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CreateJoinClassDialog, { open, onClose: () => setOpen(false), onChanged: load })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-h-0 overflow-y-auto scroll-thin", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ClassesIndex, {}) });
export {
  SplitComponent as component
};
