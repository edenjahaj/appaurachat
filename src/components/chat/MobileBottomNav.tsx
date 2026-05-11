import { Link, useLocation } from "@tanstack/react-router";
import { MessageCircle, Users, Sparkles, GraduationCap, Settings } from "lucide-react";
import { useRealtime } from "@/lib/realtime-context";

export function MobileBottomNav() {
  const loc = useLocation();
  const { totalUnread } = useRealtime();
  const items = [
    { to: "/app", icon: MessageCircle, label: "Chats", badge: totalUnread, match: (p: string) => p === "/app" || p.startsWith("/app/c/") },
    { to: "/app/cls", icon: GraduationCap, label: "Classes", match: (p: string) => p.startsWith("/app/cls") },
    { to: "/app/people", icon: Users, label: "People", match: (p: string) => p.startsWith("/app/people") },
    { to: "/app/stories", icon: Sparkles, label: "Stories", match: (p: string) => p.startsWith("/app/stories") },
    { to: "/app/settings", icon: Settings, label: "Settings", match: (p: string) => p.startsWith("/app/settings") || p.startsWith("/app/profile") },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur border-t border-border pb-[max(env(safe-area-inset-bottom),0.25rem)]">
      <ul className="flex items-stretch justify-around">
        {items.map((it) => {
          const active = it.match(loc.pathname);
          return (
            <li key={it.to} className="flex-1">
              <Link to={it.to} className={`relative flex flex-col items-center gap-0.5 py-2 transition ${active ? "text-primary" : "text-muted-foreground"}`}>
                <it.icon className="size-5" />
                <span className="text-[10px] font-semibold">{it.label}</span>
                {"badge" in it && it.badge && it.badge > 0 ? (
                  <span className="absolute top-1 right-[28%] min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold grid place-items-center">
                    {it.badge > 99 ? "99+" : it.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
