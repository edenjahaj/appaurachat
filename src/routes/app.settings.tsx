import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { Avatar } from "@/components/chat/Avatar";
import { Sun, Moon, Monitor, User as UserIcon, Bell, BellOff, LogOut, ChevronRight, Volume2, VolumeX, Info, Shield, Sparkles, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { showUpdateAgain, CURRENT_UPDATE } from "@/components/UpdateAnnouncement";
import { supabase } from "@/integrations/supabase/client";

const SOUND_KEY = "aura.sound";
const NOTIF_KEY = "aura.notif";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, signOut, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sound, setSound] = useState(true);
  const [notif, setNotif] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerExists, setOwnerExists] = useState(true);

  useEffect(() => {
    setSound(localStorage.getItem(SOUND_KEY) !== "0");
    setNotif(localStorage.getItem(NOTIF_KEY) !== "0");
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      setIsOwner((data ?? []).some((r) => r.role === "owner"));
      const { count } = await supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "owner");
      setOwnerExists((count ?? 0) > 0);
    })();
  }, [user?.id]);

  const toggleSound = () => {
    const v = !sound; setSound(v); localStorage.setItem(SOUND_KEY, v ? "1" : "0");
    toast.success(v ? "Sound on" : "Sound muted");
  };
  const toggleNotif = async () => {
    const v = !notif;
    if (v && "Notification" in window && Notification.permission !== "granted") {
      const r = await Notification.requestPermission();
      if (r !== "granted") { toast.error("Notifications were blocked by your browser."); return; }
    }
    setNotif(v); localStorage.setItem(NOTIF_KEY, v ? "1" : "0");
    toast.success(v ? "Notifications on" : "Notifications off");
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scroll-thin">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-24 md:pb-10 space-y-6">
        <header>
          <h1 className="text-3xl font-extrabold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Customize your AURA experience.</p>
        </header>

        {profile && (
          <Link
            to="/app/profile"
            className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:bg-secondary/40 transition"
          >
            <Avatar name={profile.display_name} src={profile.avatar_url} size={56} />
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{profile.display_name}</div>
              <div className="text-xs text-muted-foreground truncate">@{profile.username}</div>
              {profile.bio && <div className="text-xs text-muted-foreground truncate mt-0.5">{profile.bio}</div>}
            </div>
            <ChevronRight className="size-5 text-muted-foreground shrink-0" />
          </Link>
        )}

        <Section title="Appearance">
          <Row icon={theme === "dark" ? Moon : theme === "light" ? Sun : Monitor} label="Theme" hint={`Currently: ${theme}`}>
            <ThemeSegment value={theme} onChange={setTheme} />
          </Row>
        </Section>

        <Section title="Notifications">
          <Row icon={notif ? Bell : BellOff} label="Push notifications" hint="Show desktop alerts for new messages">
            <Toggle on={notif} onClick={toggleNotif} />
          </Row>
          <Row icon={sound ? Volume2 : VolumeX} label="Sound" hint="Play a chime when a new message arrives">
            <Toggle on={sound} onClick={toggleSound} />
          </Row>
        </Section>

        {(isOwner || !ownerExists) && (
          <Section title="Owner">
            <LinkRow to="/app/admin" icon={Crown} label={isOwner ? "Owner panel" : "Claim ownership"} />
          </Section>
        )}

        <Section title="Account">
          <LinkRow to="/app/profile" icon={UserIcon} label="Edit profile" />
          <LinkRow to="/app/people" icon={Shield} label="Best friends & blocked" />
          <button onClick={signOut} className="w-full flex items-center gap-3 p-4 hover:bg-secondary/40 transition text-left">
            <span className="size-9 rounded-xl bg-destructive/10 text-destructive grid place-items-center"><LogOut className="size-4" /></span>
            <span className="flex-1 font-semibold text-destructive">Sign out</span>
          </button>
        </Section>

        <Section title="About">
          <Row icon={Info} label="AURA" hint={`${CURRENT_UPDATE.version} — ${CURRENT_UPDATE.title}`}>
            <></>
          </Row>
          <button
            onClick={() => { showUpdateAgain(); window.dispatchEvent(new Event("aura:show-update")); }}
            className="w-full flex items-center gap-3 p-4 hover:bg-secondary/40 transition text-left"
          >
            <span className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center"><Sparkles className="size-4" /></span>
            <span className="flex-1 font-semibold text-sm">Show "What's new" again</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        </Section>

        <div className="text-center text-xs text-muted-foreground pt-2">
          Made with <span className="text-primary">♥</span> · by eden
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="px-4 pt-3 pb-2 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">{title}</div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function Row({ icon: Icon, label, hint, children }: { icon: React.ComponentType<{ className?: string }>; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="size-9 rounded-xl bg-secondary grid place-items-center"><Icon className="size-4" /></span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{label}</div>
        {hint && <div className="text-xs text-muted-foreground truncate">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function LinkRow({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 p-4 hover:bg-secondary/40 transition">
      <span className="size-9 rounded-xl bg-secondary grid place-items-center"><Icon className="size-4" /></span>
      <span className="flex-1 font-semibold text-sm">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-11 h-6 rounded-full transition relative ${on ? "bg-primary" : "bg-secondary"}`}>
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${on ? "left-[calc(100%-1.375rem)]" : "left-0.5"}`} />
    </button>
  );
}

function ThemeSegment({ value, onChange }: { value: string; onChange: (v: "light" | "dark" | "system") => void }) {
  const opts = [
    { v: "light", I: Sun }, { v: "system", I: Monitor }, { v: "dark", I: Moon },
  ] as const;
  return (
    <div className="flex bg-secondary rounded-full p-1">
      {opts.map(({ v, I }) => (
        <button key={v} onClick={() => onChange(v)} className={`size-8 rounded-full grid place-items-center transition ${value === v ? "bg-card shadow text-primary" : "text-muted-foreground"}`} title={v}>
          <I className="size-4" />
        </button>
      ))}
    </div>
  );
}
