import { Link, useLocation } from "@tanstack/react-router";
import { MessageCircle, Users, Sparkles, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { Avatar } from "./Avatar";

export function Sidebar() {
  const { profile, signOut } = useAuth();
  const { totalUnread } = useRealtime();
  const loc = useLocation();
  const isActive = (p: string) => loc.pathname === p || loc.pathname.startsWith(p + "/");

  const items = [
    { to: "/app", icon: MessageCircle, label: "Chats", match: "/app" as const },
    { to: "/app/people", icon: Users, label: "People", match: "/app/people" as const },
    { to: "/app/stories", icon: Sparkles, label: "Stories", match: "/app/stories" as const },
  ];

  return (
    <aside className="w-[80px] border-r border-border bg-card flex flex-col items-center py-4 gap-1 shrink-0">
      <Link to="/app" className="size-11 rounded-2xl bg-[image:var(--gradient-aurora)] grid place-items-center text-white font-bold mb-2">
        A
      </Link>
      {items.map((it) => {
        const active = it.match === "/app" ? loc.pathname === "/app" || loc.pathname.startsWith("/app/c") : isActive(it.match);
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`size-12 rounded-2xl grid place-items-center transition relative ${
              active ? "bg-accent text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
            title={it.label}
          >
            <it.icon className="size-5" />
            {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary" />}
          </Link>
        );
      })}
      <div className="mt-auto flex flex-col items-center gap-2">
        <button
          onClick={signOut}
          className="size-11 rounded-2xl grid place-items-center text-muted-foreground hover:bg-secondary hover:text-destructive transition"
          title="Sign out"
        >
          <LogOut className="size-5" />
        </button>
        {profile && <Avatar name={profile.display_name} src={profile.avatar_url} size={40} />}
      </div>
    </aside>
  );
}
