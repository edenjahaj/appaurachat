import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in to AURA" },
      { name: "description", content: "Sign in or create your AURA account to start chatting in real time." },
      { property: "og:title", content: "Sign in to AURA" },
      { property: "og:description", content: "Sign in or create your AURA account to start chatting." },
      { property: "og:url", content: "https://appaurachat.lovable.app/auth" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://appaurachat.lovable.app/auth" }],
  }),
});

const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
  username: z.string().trim().min(3, "Min 3 chars").max(20).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, _ only"),
  display_name: z.string().trim().min(1, "Required").max(40),
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});

function AuthPage() {
  const search = Route.useSearch();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">(search.mode ?? "login");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", username: "", display_name: "" });

  if (!loading && user) {
    navigate({ to: "/app" });
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin + "/app",
            data: { username: parsed.data.username, display_name: parsed.data.display_name },
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Welcome to AURA!");
        navigate({ to: "/app" });
      } else {
        const parsed = loginSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Welcome back");
        navigate({ to: "/app" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex relative overflow-hidden bg-[image:var(--gradient-aurora)] p-12 flex-col justify-between text-white">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-9 rounded-2xl bg-white/20 backdrop-blur grid place-items-center font-bold">A</div>
          <span className="text-xl font-bold">AURA</span>
        </Link>
        <div>
          <h2 className="text-4xl font-extrabold leading-tight">Conversations that feel like presence.</h2>
          <p className="mt-4 text-white/80 max-w-md">Real-time messages, live typing indicators, groups, and stories — all in one beautiful place.</p>
        </div>
        <div className="text-xs text-white/60">© AURA</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup" ? "Join AURA in seconds." : "Sign in to continue."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-3">
            {mode === "signup" && (
              <>
                <Field label="Display name">
                  <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className={inputCls} placeholder="Alex Doe" />
                </Field>
                <Field label="Username">
                  <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inputCls} placeholder="alex_doe" />
                </Field>
              </>
            )}
            <Field label="Email">
              <input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} placeholder="••••••••" />
            </Field>

            <button disabled={submitting} className="mt-2 w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New to AURA?"}{" "}
            <button type="button" onClick={() => setMode(mode === "signup" ? "login" : "signup")} className="text-primary font-semibold hover:underline">
              {mode === "signup" ? "Sign in" : "Create account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-input bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
