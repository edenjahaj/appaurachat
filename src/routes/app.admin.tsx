import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/chat/Avatar";
import {
  Crown, Shield, ShieldOff, Trash2, Search, Loader2, LayoutDashboard, Users, Flag,
  ScrollText, Megaphone, Filter as FilterIcon, Ban, AlertTriangle, UserX, Plus, Pin, Power, ChevronRight,
  LogOut, Send, Wrench,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin")({ component: AdminPage });

type TabId = "overview" | "users" | "reports" | "audit" | "announce" | "filters";

interface Person { id: string; username: string; display_name: string; avatar_url: string | null; created_at?: string; }

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [ownerExists, setOwnerExists] = useState<boolean | null>(null);
  const [tab, setTab] = useState<TabId>("overview");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    (async () => {
      const { data: mine } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const owner = (mine ?? []).some((r) => r.role === "owner");
      setIsOwner(owner);
      const { count } = await supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "owner");
      setOwnerExists((count ?? 0) > 0);
    })();
  }, [user?.id, authLoading]);

  const claim = async () => {
    setBusy("claim");
    const { data, error } = await supabase.rpc("claim_owner");
    setBusy(null);
    if (error) return toast.error(error.message);
    if (data === false) { toast.error("Owner already exists"); setOwnerExists(true); return; }
    toast.success("You are now the owner 👑");
    setIsOwner(true); setOwnerExists(true);
  };

  if (authLoading || isOwner === null) {
    return <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!isOwner) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto scroll-thin">
        <div className="max-w-md mx-auto px-6 py-16 text-center">
          <div className="size-16 mx-auto rounded-3xl bg-[image:var(--gradient-aurora)] grid place-items-center text-white mb-4">
            <Crown className="size-8" />
          </div>
          <h1 className="text-2xl font-extrabold">Owner Control Center</h1>
          {ownerExists ? (
            <p className="text-sm text-muted-foreground mt-2">This panel is private to the owner. You don't have access.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mt-2">No owner has been set yet. Claim ownership now to lock this panel to your account forever.</p>
              <button onClick={claim} disabled={busy === "claim"}
                className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-50">
                {busy === "claim" && <Loader2 className="size-4 animate-spin" />}
                <Crown className="size-4" /> Claim ownership
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "reports", label: "Reports", icon: Flag },
    { id: "audit", label: "Audit", icon: ScrollText },
    { id: "announce", label: "Announce", icon: Megaphone },
    { id: "filters", label: "Filters", icon: FilterIcon },
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scroll-thin">
      <div className="max-w-5xl mx-auto px-3 md:px-8 py-4 md:py-8 pb-24 md:pb-10 space-y-5">
        <header className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-[image:var(--gradient-aurora)] grid place-items-center text-white shadow-lg">
            <Crown className="size-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold truncate">Owner Control Center</h1>
            <p className="text-xs text-muted-foreground">Total platform control · Audit-logged · Owner only</p>
          </div>
        </header>

        <nav className="flex gap-1.5 overflow-x-auto scroll-thin -mx-1 px-1 pb-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition ${
                tab === t.id ? "bg-primary text-primary-foreground shadow" : "bg-card border border-border hover:bg-secondary/60"
              }`}>
              <t.icon className="size-3.5" /> {t.label}
            </button>
          ))}
        </nav>

        {tab === "overview" && <OverviewTab />}
        {tab === "users" && <UsersTab meId={user!.id} />}
        {tab === "reports" && <ReportsTab />}
        {tab === "audit" && <AuditTab />}
        {tab === "announce" && <AnnouncementsTab />}
        {tab === "filters" && <FiltersTab />}
      </div>
    </div>
  );
}

/* ---------------- OVERVIEW ---------------- */
function OverviewTab() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { (async () => {
    const { data } = await supabase.rpc("owner_stats");
    setStats(data ?? {});
  })(); }, []);
  if (!stats) return <Loading />;
  const cards = [
    { label: "Users", value: stats.total_users, sub: `+${stats.new_users_week} this week` },
    { label: "Messages", value: stats.total_messages, sub: `${stats.messages_today} today` },
    { label: "Messages / week", value: stats.messages_week },
    { label: "Active bans", value: stats.active_bans, danger: stats.active_bans > 0 },
    { label: "Open reports", value: stats.open_reports, danger: stats.open_reports > 0 },
    { label: "Conversations", value: stats.total_conversations },
    { label: "Classes", value: stats.total_classes },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-2xl p-4 border ${c.danger ? "bg-destructive/5 border-destructive/30" : "bg-card border-border"}`}>
          <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">{c.label}</div>
          <div className={`text-2xl font-extrabold mt-1 ${c.danger ? "text-destructive" : ""}`}>{c.value ?? 0}</div>
          {c.sub && <div className="text-xs text-muted-foreground mt-0.5">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}

/* ---------------- USERS ---------------- */
function UsersTab({ meId }: { meId: string }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [roles, setRoles] = useState<Record<string, Set<string>>>({});
  const [bans, setBans] = useState<Record<string, { reason: string; expires_at: string | null; severity: string }>>({});
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [banFor, setBanFor] = useState<Person | null>(null);
  const [warnFor, setWarnFor] = useState<Person | null>(null);

  const reload = async () => {
    const [{ data: ps }, { data: rs }, { data: bs }] = await Promise.all([
      supabase.from("profiles").select("id, username, display_name, avatar_url, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("user_bans").select("user_id, reason, expires_at, severity"),
    ]);
    setPeople((ps ?? []) as Person[]);
    const r: Record<string, Set<string>> = {};
    (rs ?? []).forEach((x: any) => { (r[x.user_id] ??= new Set()).add(x.role); });
    setRoles(r);
    const b: any = {};
    (bs ?? []).forEach((x: any) => { if (!x.expires_at || new Date(x.expires_at) > new Date()) b[x.user_id] = x; });
    setBans(b);
  };
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => people.filter((p) =>
    !q || p.display_name.toLowerCase().includes(q.toLowerCase()) || p.username.toLowerCase().includes(q.toLowerCase())
  ), [people, q]);

  const grant = async (id: string, role: "admin" | "moderator") => {
    setBusy(id);
    const fn = role === "admin" ? "admin_grant_admin" : "admin_grant_moderator";
    const { error } = await supabase.rpc(fn, { _user_id: id });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`${role} granted`); reload();
  };
  const revoke = async (id: string, role: "admin" | "moderator") => {
    setBusy(id);
    const fn = role === "admin" ? "admin_revoke_admin" : "admin_revoke_moderator";
    const { error } = await supabase.rpc(fn, { _user_id: id });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`${role} revoked`); reload();
  };
  const unban = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.rpc("admin_unban_user", { _user_id: id });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Unbanned"); reload();
  };
  const purge = async (id: string) => {
    if (!confirm("Delete ALL of this user's messages and stories? This is irreversible.")) return;
    setBusy(id);
    const { error } = await supabase.rpc("admin_delete_user_content", { _user_id: id });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Content purged");
  };
  const forceSignout = async (id: string) => {
    if (!confirm("Force this user to sign out everywhere?")) return;
    setBusy(id);
    const { error } = await supabase.rpc("admin_force_signout", { _target: id });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Signed out everywhere");
  };
  const deleteAccount = async (id: string, name: string) => {
    if (!confirm(`PERMANENTLY delete ${name}'s account and ALL their data? This cannot be undone.`)) return;
    if (!confirm("Are you absolutely sure?")) return;
    setBusy(id);
    const { error } = await supabase.rpc("admin_delete_account", { _target: id });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Account deleted"); reload();
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-3 md:p-4">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or @username…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <div className="space-y-1.5">
        {filtered.map((p) => {
          const isMe = p.id === meId;
          const r = roles[p.id] ?? new Set();
          const isOwn = r.has("owner");
          const isAdm = r.has("admin");
          const isMod = r.has("moderator");
          const ban = bans[p.id];
          return (
            <div key={p.id} className={`flex flex-wrap items-center gap-2 p-2.5 rounded-xl ${ban ? "bg-destructive/5" : "hover:bg-secondary/40"}`}>
              <Avatar name={p.display_name} src={p.avatar_url} size={40} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate flex items-center gap-1.5 flex-wrap">
                  {p.display_name}
                  {isOwn && <Crown className="size-3.5 text-amber-500" />}
                  {isAdm && !isOwn && <Shield className="size-3.5 text-primary" />}
                  {isMod && !isAdm && !isOwn && <Shield className="size-3.5 text-emerald-500" />}
                  {ban && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-bold uppercase">{ban.severity}</span>}
                </div>
                <div className="text-xs text-muted-foreground truncate">@{p.username}{p.created_at && ` · joined ${new Date(p.created_at).toLocaleDateString()}`}</div>
                {ban?.reason && <div className="text-xs text-destructive/80 truncate mt-0.5">⚠ {ban.reason}</div>}
              </div>
              {!isMe && !isOwn && (
                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto justify-end">
                  {ban ? (
                    <Btn onClick={() => unban(p.id)} busy={busy === p.id} tone="ok"><Power className="size-3.5" /> Unban</Btn>
                  ) : (
                    <Btn onClick={() => setBanFor(p)} tone="danger"><Ban className="size-3.5" /> Ban</Btn>
                  )}
                  <Btn onClick={() => setWarnFor(p)} tone="warn"><AlertTriangle className="size-3.5" /> Warn</Btn>
                  {isAdm
                    ? <Btn onClick={() => revoke(p.id, "admin")} busy={busy === p.id} tone="danger"><ShieldOff className="size-3.5" /> Admin</Btn>
                    : <Btn onClick={() => grant(p.id, "admin")} busy={busy === p.id}><Shield className="size-3.5" /> Admin</Btn>}
                  {isMod
                    ? <Btn onClick={() => revoke(p.id, "moderator")} busy={busy === p.id} tone="danger"><ShieldOff className="size-3.5" /> Mod</Btn>
                    : <Btn onClick={() => grant(p.id, "moderator")} busy={busy === p.id}><Shield className="size-3.5" /> Mod</Btn>}
                  <Btn onClick={() => purge(p.id)} busy={busy === p.id} tone="danger"><UserX className="size-3.5" /> Purge</Btn>
                  <Btn onClick={() => forceSignout(p.id)} busy={busy === p.id} tone="warn"><LogOut className="size-3.5" /> Sign out</Btn>
                  <Btn onClick={() => deleteAccount(p.id, p.display_name)} busy={busy === p.id} tone="danger"><Trash2 className="size-3.5" /> Delete</Btn>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <Empty>No users match.</Empty>}
      </div>

      {banFor && <BanDialog person={banFor} onClose={() => { setBanFor(null); reload(); }} />}
      {warnFor && <WarnDialog person={warnFor} onClose={() => setWarnFor(null)} />}
    </div>
  );
}

function BanDialog({ person, onClose }: { person: Person; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState<"ban" | "suspend" | "shadow">("ban");
  const [hours, setHours] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("admin_ban_user", {
      _user_id: person.id, _reason: reason || "", _severity: severity,
      _hours: hours ? parseInt(hours, 10) : undefined,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${severity === "suspend" ? "Suspended" : severity === "shadow" ? "Shadow-banned" : "Banned"} @${person.username}`);
    onClose();
  };
  return (
    <Modal onClose={onClose} title={`Ban @${person.username}`}>
      <Field label="Severity">
        <div className="flex gap-1.5">
          {(["ban", "suspend", "shadow"] as const).map((s) => (
            <button key={s} onClick={() => setSeverity(s)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize ${severity === s ? "bg-destructive text-destructive-foreground" : "bg-secondary"}`}>
              {s}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Reason"><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" placeholder="Why?" /></Field>
      <Field label="Duration (hours, blank = permanent)">
        <input value={hours} onChange={(e) => setHours(e.target.value.replace(/\D/g, ""))} className="w-full px-3 py-2 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. 24" />
      </Field>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-secondary text-sm font-semibold">Cancel</button>
        <button onClick={submit} disabled={busy} className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold disabled:opacity-50 inline-flex items-center gap-1.5">
          {busy && <Loader2 className="size-3.5 animate-spin" />} Apply ban
        </button>
      </div>
    </Modal>
  );
}

function WarnDialog({ person, onClose }: { person: Person; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!reason.trim()) return toast.error("Reason required");
    setBusy(true);
    const { error } = await supabase.rpc("admin_warn_user", { _user_id: person.id, _reason: reason });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Warned @${person.username}`); onClose();
  };
  return (
    <Modal onClose={onClose} title={`Warn @${person.username}`}>
      <Field label="Reason"><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" placeholder="The user will see this." /></Field>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-secondary text-sm font-semibold">Cancel</button>
        <button onClick={submit} disabled={busy} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold disabled:opacity-50 inline-flex items-center gap-1.5">
          {busy && <Loader2 className="size-3.5 animate-spin" />} Send warning
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- REPORTS ---------------- */
function ReportsTab() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { (async () => {
    const { data } = await supabase.from("message_reports").select("*").order("created_at", { ascending: false }).limit(100);
    setRows(data ?? []);
  })(); }, []);
  return (
    <div className="rounded-2xl bg-card border border-border divide-y divide-border">
      {rows.length === 0 && <Empty>No reports yet.</Empty>}
      {rows.map((r) => (
        <div key={r.id} className="p-3 flex items-start gap-3">
          <Flag className="size-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 text-sm">
            <div className="font-semibold">{r.reason} <span className="text-xs text-muted-foreground font-normal">· {r.scope}</span></div>
            {r.details && <div className="text-xs text-muted-foreground">{r.details}</div>}
            <div className="text-[11px] text-muted-foreground mt-0.5">message {r.message_id} · {new Date(r.created_at).toLocaleString()}</div>
          </div>
          <button onClick={async () => {
            const fn = r.scope === "channel" ? "admin_delete_channel_message" : "admin_delete_message";
            const { error } = await supabase.rpc(fn, { _message_id: r.message_id });
            if (error) toast.error(error.message); else toast.success("Message deleted");
          }} className="text-xs font-bold px-3 py-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 inline-flex items-center gap-1">
            <Trash2 className="size-3.5" /> Remove
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------------- AUDIT ---------------- */
function AuditTab() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { (async () => {
    const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
    setRows(data ?? []);
  })(); }, []);
  return (
    <div className="rounded-2xl bg-card border border-border divide-y divide-border">
      {rows.length === 0 && <Empty>No actions logged.</Empty>}
      {rows.map((r) => (
        <div key={r.id} className="p-3 text-sm">
          <div className="flex items-center gap-2">
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <span className="font-bold">{r.action}</span>
            {r.target_type && <span className="text-xs text-muted-foreground">→ {r.target_type}</span>}
            <span className="ml-auto text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
          </div>
          {r.details && Object.keys(r.details).length > 0 && (
            <pre className="text-[11px] text-muted-foreground bg-secondary/50 rounded-lg px-2 py-1 mt-1 overflow-x-auto">{JSON.stringify(r.details)}</pre>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------- ANNOUNCEMENTS ---------------- */
function AnnouncementsTab() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<"info" | "warning" | "critical">("info");
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const { data } = await supabase.from("platform_announcements").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { reload(); }, []);

  const submit = async () => {
    if (!title.trim() || !body.trim()) return toast.error("Title and body required");
    setBusy(true);
    const { error } = await supabase.from("platform_announcements").insert({ title, body, severity, pinned, created_by: user!.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Announcement published");
    setTitle(""); setBody(""); setPinned(false); reload();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("platform_announcements").update({ active: !active }).eq("id", id); reload();
  };
  const remove = async (id: string) => {
    await supabase.from("platform_announcements").delete().eq("id", id); reload();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <div className="flex items-center gap-2"><Plus className="size-4 text-primary" /><span className="font-bold text-sm">New platform announcement</span></div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full px-3 py-2 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" rows={3} className="w-full px-3 py-2 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        <div className="flex flex-wrap gap-2">
          {(["info", "warning", "critical"] as const).map((s) => (
            <button key={s} onClick={() => setSeverity(s)} className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${severity === s ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{s}</button>
          ))}
          <button onClick={() => setPinned(!pinned)} className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${pinned ? "bg-amber-500 text-white" : "bg-secondary"}`}><Pin className="size-3.5" /> Pin</button>
          <button onClick={submit} disabled={busy} className="ml-auto px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5">
            {busy && <Loader2 className="size-3.5 animate-spin" />} Publish
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border divide-y divide-border">
        {rows.length === 0 && <Empty>No announcements yet.</Empty>}
        {rows.map((r) => (
          <div key={r.id} className="p-3 flex items-start gap-3">
            <Megaphone className="size-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm flex items-center gap-1.5">{r.title}
                {r.pinned && <Pin className="size-3 text-amber-500" />}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold ${r.severity === "critical" ? "bg-destructive/15 text-destructive" : r.severity === "warning" ? "bg-amber-500/15 text-amber-600" : "bg-primary/15 text-primary"}`}>{r.severity}</span>
                {!r.active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase font-bold">paused</span>}
              </div>
              <div className="text-xs text-muted-foreground whitespace-pre-wrap">{r.body}</div>
            </div>
            <button onClick={() => toggleActive(r.id, r.active)} className="text-xs px-2 py-1 rounded-full bg-secondary"><Power className="size-3.5" /></button>
            <button onClick={() => remove(r.id)} className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive"><Trash2 className="size-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- FILTERS ---------------- */
function FiltersTab() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [pattern, setPattern] = useState("");
  const reload = async () => {
    const { data } = await supabase.from("keyword_filters").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { reload(); }, []);
  const add = async () => {
    if (!pattern.trim()) return;
    const { error } = await supabase.from("keyword_filters").insert({ pattern: pattern.trim().toLowerCase(), severity: "flag", created_by: user!.id });
    if (error) return toast.error(error.message);
    setPattern(""); reload();
  };
  const remove = async (id: string) => { await supabase.from("keyword_filters").delete().eq("id", id); reload(); };
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-card border border-border p-3 flex gap-2">
        <input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="Add forbidden keyword…" className="flex-1 px-3 py-2 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <button onClick={add} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center gap-1.5"><Plus className="size-3.5" /> Add</button>
      </div>
      <div className="rounded-2xl bg-card border border-border p-3 flex flex-wrap gap-2">
        {rows.length === 0 && <Empty>No keyword filters.</Empty>}
        {rows.map((r) => (
          <span key={r.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-xs font-semibold">
            {r.pattern}
            <button onClick={() => remove(r.id)} className="opacity-70 hover:text-destructive hover:opacity-100"><Trash2 className="size-3" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */
function Btn({ children, onClick, busy, tone }: { children: React.ReactNode; onClick: () => void; busy?: boolean; tone?: "danger" | "warn" | "ok" }) {
  const cls = tone === "danger" ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
    : tone === "warn" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
    : tone === "ok" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
    : "bg-primary/10 text-primary hover:bg-primary/20";
  return (
    <button onClick={onClick} disabled={busy} className={`text-xs font-semibold px-2.5 py-1.5 rounded-full inline-flex items-center gap-1 disabled:opacity-50 ${cls}`}>
      {busy && <Loader2 className="size-3 animate-spin" />}{children}
    </button>
  );
}
function Loading() { return <div className="grid place-items-center py-10 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>; }
function Empty({ children }: { children: React.ReactNode }) { return <div className="text-sm text-muted-foreground text-center py-6">{children}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>{children}</label>;
}
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-card border border-border p-5 space-y-3 shadow-2xl">
        <div className="font-extrabold text-lg">{title}</div>
        {children}
      </div>
    </div>
  );
}
