import { r as reactExports, W as jsxRuntimeExports } from "./server-U61-uJh3.js";
import { c as createLucideIcon, R as Route, u as useAuth, a as useNavigate, L as Link, t as toast, s as supabase, o as objectType, b as stringType } from "./router-CYx1i6QQ.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }]];
const LoaderCircle = createLucideIcon("loader-circle", __iconNode);
const signupSchema = objectType({
  email: stringType().trim().email("Enter a valid email").max(255),
  password: stringType().min(6, "At least 6 characters").max(72),
  username: stringType().trim().min(3, "Min 3 chars").max(20).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, _ only"),
  display_name: stringType().trim().min(1, "Required").max(40)
});
const loginSchema = objectType({
  email: stringType().trim().email("Enter a valid email"),
  password: stringType().min(1, "Required")
});
function AuthPage() {
  const search = Route.useSearch();
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = reactExports.useState(search.mode ?? "login");
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({
    email: "",
    password: "",
    username: "",
    display_name: ""
  });
  if (!loading && user) {
    navigate({
      to: "/app"
    });
    return null;
  }
  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const {
          error
        } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin + "/app",
            data: {
              username: parsed.data.username,
              display_name: parsed.data.display_name
            }
          }
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Welcome to AURA!");
        navigate({
          to: "/app"
        });
      } else {
        const parsed = loginSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Welcome back");
        navigate({
          to: "/app"
        });
      }
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen grid md:grid-cols-2 bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden md:flex relative overflow-hidden bg-[image:var(--gradient-aurora)] p-12 flex-col justify-between text-white", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-9 rounded-2xl bg-white/20 backdrop-blur grid place-items-center font-bold", children: "A" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl font-bold", children: "AURA" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-4xl font-extrabold leading-tight", children: "Conversations that feel like presence." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-white/80 max-w-md", children: "Real-time messages, live typing indicators, groups, and stories — all in one beautiful place." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-white/60", children: "© AURA" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: mode === "signup" ? "Create your account" : "Welcome back" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: mode === "signup" ? "Join AURA in seconds." : "Sign in to continue." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "mt-8 space-y-3", children: [
        mode === "signup" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Display name", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.display_name, onChange: (e) => setForm({
            ...form,
            display_name: e.target.value
          }), className: inputCls, placeholder: "Alex Doe" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Username", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.username, onChange: (e) => setForm({
            ...form,
            username: e.target.value
          }), className: inputCls, placeholder: "alex_doe" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Email", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "email", autoComplete: "email", value: form.email, onChange: (e) => setForm({
          ...form,
          email: e.target.value
        }), className: inputCls, placeholder: "you@example.com" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Password", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "password", autoComplete: mode === "signup" ? "new-password" : "current-password", value: form.password, onChange: (e) => setForm({
          ...form,
          password: e.target.value
        }), className: inputCls, placeholder: "••••••••" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { disabled: submitting, className: "mt-2 w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2", children: [
          submitting && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin" }),
          mode === "signup" ? "Create account" : "Sign in"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-6 text-sm text-center text-muted-foreground", children: [
        mode === "signup" ? "Already have an account?" : "New to AURA?",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setMode(mode === "signup" ? "login" : "signup"), className: "text-primary font-semibold hover:underline", children: mode === "signup" ? "Sign in" : "Create account" })
      ] })
    ] }) })
  ] });
}
const inputCls = "w-full rounded-xl border border-input bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition";
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1", children })
  ] });
}
export {
  AuthPage as component
};
