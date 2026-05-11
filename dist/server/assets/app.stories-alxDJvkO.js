import { r as reactExports, W as jsxRuntimeExports } from "./server-U61-uJh3.js";
import { u as useAuth, s as supabase, X, t as toast } from "./router-CYx1i6QQ.js";
import { A as Avatar } from "./Avatar-CxBchUvZ.js";
import { P as Plus } from "./plus-7Bfs70-e.js";
import { f as formatDistanceToNowStrict } from "./formatDistanceToNowStrict-DBgh6Ve6.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./en-US-CqQV4g4D.js";
const BACKGROUNDS = ["gradient-1", "gradient-2", "gradient-3", "gradient-4", "gradient-5"];
function StoriesPage() {
  const { user } = useAuth();
  const [stories, setStories] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [composing, setComposing] = reactExports.useState(false);
  const [viewing, setViewing] = reactExports.useState(null);
  const [text, setText] = reactExports.useState("");
  const [bg, setBg] = reactExports.useState("gradient-1");
  const [submitting, setSubmitting] = reactExports.useState(false);
  const load = async () => {
    const { data: s } = await supabase.from("stories").select("id, user_id, content, background, created_at, expires_at").order("created_at", { ascending: false });
    const ids = Array.from(new Set((s ?? []).map((x) => x.user_id)));
    const { data: ps } = ids.length ? await supabase.from("profiles").select("id, display_name, username, avatar_url").in("id", ids) : { data: [] };
    const map = new Map((ps ?? []).map((p) => [p.id, p]));
    setStories((s ?? []).map((st) => ({ ...st, profile: map.get(st.user_id) })));
    setLoading(false);
  };
  reactExports.useEffect(() => {
    load();
    const ch = supabase.channel("stories").on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => load()).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);
  const submit = async () => {
    const c = text.trim();
    if (!c) return toast.error("Write something");
    setSubmitting(true);
    const { error } = await supabase.from("stories").insert({ user_id: user.id, content: c, background: bg });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Story posted");
    setText("");
    setComposing(false);
  };
  const removeStory = async (id) => {
    const { error } = await supabase.from("stories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setViewing(null);
    toast.success("Story deleted");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto scroll-thin", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl mx-auto p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-extrabold", children: "Stories" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Share moments that disappear in 24 hours." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setComposing(true), className: "rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:opacity-90", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4" }),
          " Add story"
        ] })
      ] }),
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "Loading…" }) : stories.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-16 border border-dashed border-border rounded-3xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "No stories yet. Be the first!" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: stories.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setViewing(s),
          className: `story-${s.background} aspect-[9/14] rounded-3xl p-4 flex flex-col justify-between text-white text-left shadow-[var(--shadow-soft)] hover:scale-[1.02] transition`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: s.profile?.display_name ?? "?", src: s.profile?.avatar_url, size: 32 }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: s.profile?.display_name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "opacity-80", children: formatDistanceToNowStrict(new Date(s.created_at), { addSuffix: true }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold leading-snug line-clamp-5", children: s.content })
          ]
        },
        s.id
      )) })
    ] }),
    composing && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 bg-black/40 grid place-items-center p-4", onClick: () => setComposing(false), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card rounded-3xl w-full max-w-md p-6 shadow-2xl", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-bold text-lg", children: "New story" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setComposing(false), className: "size-8 rounded-full grid place-items-center hover:bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `story-${bg} aspect-[9/14] rounded-2xl p-5 mb-4 text-white grid place-items-center`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          value: text,
          onChange: (e) => setText(e.target.value),
          maxLength: 500,
          placeholder: "What's on your mind?",
          className: "w-full h-full bg-transparent text-center text-lg font-semibold placeholder:text-white/60 focus:outline-none resize-none"
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 mb-4", children: BACKGROUNDS.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setBg(b), className: `story-${b} size-10 rounded-full border-2 ${bg === b ? "border-primary" : "border-transparent"}` }, b)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: submit, disabled: submitting, className: "w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 disabled:opacity-50", children: "Post story" })
    ] }) }),
    viewing && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 bg-black/80 grid place-items-center p-4", onClick: () => setViewing(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `story-${viewing.background} aspect-[9/14] w-full max-w-sm rounded-3xl p-6 text-white flex flex-col justify-between relative`, onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setViewing(null), className: "absolute top-3 right-3 size-9 rounded-full bg-black/30 grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: viewing.profile?.display_name ?? "?", src: viewing.profile?.avatar_url, size: 36 }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: viewing.profile?.display_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "opacity-80 text-xs", children: formatDistanceToNowStrict(new Date(viewing.created_at), { addSuffix: true }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-center px-4", children: viewing.content }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: viewing.user_id === user?.id && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeStory(viewing.id), className: "w-full rounded-xl bg-white/20 backdrop-blur py-2 text-sm font-semibold hover:bg-white/30", children: "Delete story" }) })
    ] }) })
  ] });
}
const SplitComponent = StoriesPage;
export {
  SplitComponent as component
};
