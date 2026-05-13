import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/chat/Avatar";
import { Crown, Shield, ShieldOff, Trash2, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin")({
  component: AdminPage,
});

interface Person {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [ownerExists, setOwnerExists] = useState<boolean | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [admins, setAdmins] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    (async () => {
      const { data: mine } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const owner = (mine ?? []).some((r) => r.role === "owner");
      setIsOwner(owner);

      const { count } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "owner");
      setOwnerExists((count ?? 0) > 0);

      if (owner) {
        const [{ data: ps }, { data: rs }] = await Promise.all([
          supabase.from("profiles").select("id, username, display_name, avatar_url").order("display_name"),
          supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
        ]);
        setPeople((ps ?? []) as Person[]);
        setAdmins(new Set((rs ?? []).map((r) => r.user_id)));
      }
    })();
  }, [user?.id, authLoading]);

  const claim = async () => {
    setBusy("claim");
    const { data, error } = await supabase.rpc("claim_owner");
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    if (data === false) { toast.error("Owner already exists"); setOwnerExists(true); return; }
    toast.success("You are now the owner 👑");
    setIsOwner(true); setOwnerExists(true);
  };

  const grant = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.rpc("admin_grant_admin", { _user_id: id });
    setBusy(null);
    if (error) return toast.error(error.message);
    setAdmins((s) => new Set(s).add(id));
    toast.success("Admin granted");
  };
  const revoke = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.rpc("admin_revoke_admin", { _user_id: id });
    setBusy(null);
    if (error) return toast.error(error.message);
    setAdmins((s) => { const n = new Set(s); n.delete(id); return n; });
    toast.success("Admin revoked");
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
          <h1 className="text-2xl font-extrabold">Owner Panel</h1>
          {ownerExists ? (
            <p className="text-sm text-muted-foreground mt-2">This panel is private to the owner. You don’t have access.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mt-2">No owner has been set yet. Claim ownership now to lock this panel to your account forever.</p>
              <button
                onClick={claim}
                disabled={busy === "claim"}
                className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-50"
              >
                {busy === "claim" && <Loader2 className="size-4 animate-spin" />}
                <Crown className="size-4" /> Claim ownership
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const filtered = people.filter((p) =>
    !q || p.display_name.toLowerCase().includes(q.toLowerCase()) || p.username.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scroll-thin">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-24 md:pb-10 space-y-6">
        <header className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-[image:var(--gradient-aurora)] grid place-items-center text-white">
            <Crown className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Owner Panel</h1>
            <p className="text-xs text-muted-foreground">You are the only owner. Manage admins and moderation.</p>
          </div>
        </header>

        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search users…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            {filtered.map((p) => {
              const isMe = p.id === user!.id;
              const isAdmin = admins.has(p.id);
              return (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50">
                  <Avatar name={p.display_name} src={p.avatar_url} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate flex items-center gap-1.5">
                      {p.display_name}
                      {isMe && <Crown className="size-3.5 text-amber-500" />}
                      {isAdmin && !isMe && <Shield className="size-3.5 text-primary" />}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">@{p.username}</div>
                  </div>
                  {!isMe && (
                    isAdmin ? (
                      <button onClick={() => revoke(p.id)} disabled={busy === p.id} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50 flex items-center gap-1">
                        <ShieldOff className="size-3.5" /> Revoke
                      </button>
                    ) : (
                      <button onClick={() => grant(p.id)} disabled={busy === p.id} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 flex items-center gap-1">
                        <Shield className="size-3.5" /> Make admin
                      </button>
                    )
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-6">No users match.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5"><Trash2 className="size-3.5" /> Moderation</p>
          You can delete any DM or class message directly from the chat — your owner role grants you the rights anywhere in the app.
        </div>
      </div>
    </div>
  );
}
