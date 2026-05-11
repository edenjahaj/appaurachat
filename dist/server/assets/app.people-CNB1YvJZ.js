import { r as reactExports, W as jsxRuntimeExports } from "./server-U61-uJh3.js";
import { u as useAuth, d as useRealtime, f as useFavorites, a as useNavigate, s as supabase, t as toast } from "./router-CYx1i6QQ.js";
import { A as Avatar } from "./Avatar-CxBchUvZ.js";
import { S as Search, a as Star } from "./star-BsOXsYFc.js";
import { M as MessageCircle } from "./message-circle-C2SfUIBS.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
function PeopleList() {
  const { user } = useAuth();
  const { isOnline } = useRealtime();
  const { isFavorite, toggle: toggleFav } = useFavorites();
  const navigate = useNavigate();
  const [people, setPeople] = reactExports.useState([]);
  const [q, setQ] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(true);
  const [opening, setOpening] = reactExports.useState(null);
  reactExports.useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url, bio").neq("id", user.id).order("display_name");
      setPeople(data ?? []);
      setLoading(false);
    })();
  }, [user?.id]);
  const openChat = async (other) => {
    setOpening(other.id);
    const { data, error } = await supabase.rpc("get_or_create_dm", { _other_user_id: other.id });
    setOpening(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) navigate({ to: "/app/c/$conversationId", params: { conversationId: data } });
  };
  const filtered = people.filter((p) => !q || p.display_name.toLowerCase().includes(q.toLowerCase()) || p.username.toLowerCase().includes(q.toLowerCase())).sort((a, b) => Number(isFavorite(b.id)) - Number(isFavorite(a.id)));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-extrabold mb-1", children: "People" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-5", children: "Find someone to start chatting with." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          value: q,
          onChange: (e) => setQ(e.target.value),
          placeholder: "Search by name or @username",
          className: "w-full pl-9 pr-3 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        }
      )
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "Loading…" }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-16", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No people yet. Invite a friend!" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: filtered.map((p) => {
      const fav = isFavorite(p.id);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-3 p-3 rounded-2xl bg-card border transition ${fav ? "border-primary/40 shadow-[0_0_0_1px_var(--color-primary)/_10%]" : "border-border hover:shadow-[var(--shadow-soft)]"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: p.display_name, src: p.avatar_url, size: 48 }),
          isOnline(p.id) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-card" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-semibold truncate flex items-center gap-1.5", children: [
            p.display_name,
            fav && /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "size-3.5 fill-amber-400 text-amber-400" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground truncate", children: [
            "@",
            p.username,
            isOnline(p.id) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 text-emerald-600 font-medium", children: "• Online" }),
            p.bio ? ` • ${p.bio}` : ""
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => toggleFav(p.id),
            className: `size-9 rounded-full grid place-items-center transition ${fav ? "bg-amber-400/15 text-amber-500" : "hover:bg-secondary text-muted-foreground"}`,
            title: fav ? "Remove from best friends" : "Add to best friends",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: `size-4 ${fav ? "fill-current" : ""}` })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => openChat(p),
            disabled: opening === p.id,
            className: "rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50 hover:opacity-90",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "size-4" }),
              "Message"
            ]
          }
        )
      ] }, p.id);
    }) })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-h-0 overflow-y-auto scroll-thin overscroll-contain", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full md:max-w-2xl mx-auto p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PeopleList, {}) }) });
export {
  SplitComponent as component
};
