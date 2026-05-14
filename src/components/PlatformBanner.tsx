import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Megaphone, AlertTriangle, AlertOctagon, X } from "lucide-react";

interface PA {
  id: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  pinned: boolean;
}

const DISMISS_KEY = "aura.pa.dismissed";

export function PlatformBanner() {
  const { user } = useAuth();
  const [items, setItems] = useState<PA[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(DISMISS_KEY) || "[]")); } catch { return new Set(); }
  });
  const [warnings, setWarnings] = useState<{ id: string; reason: string }[]>([]);
  const [ban, setBan] = useState<{ reason: string; expires_at: string | null; severity: string } | null>(null);
  const [maint, setMaint] = useState<{ on: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("platform_announcements")
        .select("id, title, body, severity, pinned")
        .eq("active", true)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5);
      setItems((data ?? []) as PA[]);

      const { data: w } = await supabase
        .from("user_warnings")
        .select("id, reason")
        .eq("user_id", user.id)
        .eq("acknowledged", false)
        .order("created_at", { ascending: false });
      setWarnings(w ?? []);

      const { data: b } = await supabase
        .from("user_bans")
        .select("reason, expires_at, severity")
        .eq("user_id", user.id)
        .maybeSingle();
      if (b && (!b.expires_at || new Date(b.expires_at) > new Date())) setBan(b as any);

      const { data: ms } = await supabase.from("platform_settings").select("value").eq("key", "maintenance").maybeSingle();
      if (ms?.value && (ms.value as any).on) setMaint(ms.value as any);
    })();
  }, [user?.id]);

  const dismiss = (id: string) => {
    const next = new Set(dismissed); next.add(id); setDismissed(next);
    localStorage.setItem(DISMISS_KEY, JSON.stringify([...next]));
  };
  const ackWarning = async (id: string) => {
    await supabase.from("user_warnings").update({ acknowledged: true }).eq("id", id);
    setWarnings((w) => w.filter((x) => x.id !== id));
  };

  const visible = items.filter((i) => i.pinned || !dismissed.has(i.id));
  if (!ban && visible.length === 0 && warnings.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 px-3 pt-3">
      {ban && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive p-3 flex items-start gap-3">
          <AlertOctagon className="size-5 shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <div className="font-bold">You are {ban.severity === "suspend" ? "suspended" : "banned"}</div>
            <div className="opacity-90">{ban.reason || "Contact the owner for details."}</div>
            {ban.expires_at && <div className="text-xs opacity-70 mt-1">Until {new Date(ban.expires_at).toLocaleString()}</div>}
          </div>
        </div>
      )}
      {warnings.map((w) => (
        <div key={w.id} className="rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 p-3 flex items-start gap-3">
          <AlertTriangle className="size-5 shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <div className="font-bold">Warning from moderation</div>
            <div className="opacity-90">{w.reason}</div>
          </div>
          <button onClick={() => ackWarning(w.id)} className="text-xs font-bold px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30">OK</button>
        </div>
      ))}
      {visible.map((i) => {
        const tone = i.severity === "critical" ? "bg-destructive/10 border-destructive/30 text-destructive"
          : i.severity === "warning" ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
          : "bg-primary/10 border-primary/20 text-primary";
        return (
          <div key={i.id} className={`rounded-2xl border p-3 flex items-start gap-3 ${tone}`}>
            <Megaphone className="size-5 shrink-0 mt-0.5" />
            <div className="text-sm flex-1 min-w-0">
              <div className="font-bold">{i.title}</div>
              <div className="opacity-90 whitespace-pre-wrap break-words">{i.body}</div>
            </div>
            {!i.pinned && (
              <button onClick={() => dismiss(i.id)} className="opacity-70 hover:opacity-100"><X className="size-4" /></button>
            )}
          </div>
        );
      })}
    </div>
  );
}
