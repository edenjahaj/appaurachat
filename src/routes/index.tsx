import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { MessageCircle, Sparkles, Users, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "AURA — Real-time chat for friends, groups & classes" },
      { name: "description", content: "AURA is a beautiful, real-time chat app. DMs, groups, class channels and 24-hour stories — built for speed." },
      { property: "og:title", content: "AURA — Real-time chat for friends, groups & classes" },
      { property: "og:description", content: "Beautiful, real-time messaging with DMs, groups, class channels and stories." },
      { property: "og:url", content: "https://appaurachat.lovable.app/" },
      { name: "twitter:title", content: "AURA — Real-time chat" },
      { name: "twitter:description", content: "Beautiful, real-time messaging with DMs, groups, class channels and stories." },
    ],
    links: [{ rel: "canonical", href: "https://appaurachat.lovable.app/" }],
  }),
});

function Landing() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/app" />;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-2xl bg-[image:var(--gradient-aurora)] grid place-items-center text-white font-bold">A</div>
          <span className="text-xl font-bold aura-brand">AURA</span>
        </div>
        <div className="flex gap-2">
          <Link to="/auth" className="rounded-full px-4 py-2 text-sm font-medium hover:bg-secondary transition">Sign in</Link>
          <Link to="/auth" search={{ mode: "signup" }} className="rounded-full px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90">Get started</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
            <Sparkles className="size-3.5" /> Real-time. Beautiful. Yours.
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Chat that feels <span className="aura-brand">alive.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Message friends instantly, create groups, share 24-hour stories. Built for speed, designed to feel premium.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup" }} className="rounded-full px-6 py-3 font-semibold bg-primary text-primary-foreground shadow-lg hover:opacity-90">Start chatting free</Link>
            <Link to="/auth" className="rounded-full px-6 py-3 font-semibold border border-border hover:bg-secondary">I have an account</Link>
          </div>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: "Instant delivery", desc: "Real-time messages with no refresh." },
            { icon: Users, title: "Groups & DMs", desc: "Spin up a group in two taps." },
            { icon: MessageCircle, title: "Stories", desc: "Share moments that vanish in 24 hours." },
          ].map((f) => (
            <div key={f.title} className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <div className="size-11 rounded-2xl bg-accent grid place-items-center mb-4">
                <f.icon className="size-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
