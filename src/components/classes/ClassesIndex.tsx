import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { GraduationCap, Plus, Users, Copy, Check } from "lucide-react";
import { CreateJoinClassDialog } from "./CreateJoinClassDialog";
import { toast } from "sonner";

interface ClassRow {
  id: string;
  name: string;
  join_code: string;
  role: "admin" | "student";
  member_count: number;
}

export function ClassesIndex() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data: members } = await supabase
      .from("class_members")
      .select("class_id, role")
      .eq("user_id", user.id);
    const ids = (members ?? []).map((m) => m.class_id);
    if (ids.length === 0) { setRows([]); setLoading(false); return; }

    const { data: classes } = await supabase.from("classes").select("id, name, join_code").in("id", ids);
    const { data: allMembers } = await supabase.from("class_members").select("class_id, user_id").in("class_id", ids);
    const counts = new Map<string, number>();
    (allMembers ?? []).forEach((m) => counts.set(m.class_id, (counts.get(m.class_id) ?? 0) + 1));
    const roleMap = new Map((members ?? []).map((m) => [m.class_id, m.role as "admin" | "student"]));

    setRows(
      (classes ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        join_code: c.join_code,
        role: roleMap.get(c.id) ?? "student",
        member_count: counts.get(c.id) ?? 1,
      }))
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const copyCode = async (code: string) => {
    try { await navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 1500); toast.success("Code copied"); } catch {}
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Classes</h1>
          <p className="text-sm text-muted-foreground mt-1">Join your school's class workspace.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
        >
          <Plus className="size-4" /> New / Join
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <div className="size-14 rounded-2xl bg-accent grid place-items-center text-primary mx-auto mb-3"><GraduationCap className="size-7" /></div>
          <h3 className="font-bold text-lg">No classes yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Join with a code from your teacher, or create your own.</p>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold">
            <Plus className="size-4" /> Get started
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-4 hover:shadow-lg transition group">
              <Link to="/app/cls/$classId" params={{ classId: c.id }} className="block">
                <div className="flex items-start gap-3">
                  <div className="size-12 rounded-2xl bg-[image:var(--gradient-aurora)] grid place-items-center text-white font-extrabold text-lg shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold truncate">{c.name}</span>
                      {c.role === "admin" && <span className="text-[10px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded bg-primary/15 text-primary">Admin</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1"><Users className="size-3" /> {c.member_count} member{c.member_count === 1 ? "" : "s"}</p>
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); copyCode(c.join_code); }}
                className="mt-3 w-full inline-flex items-center justify-between gap-2 rounded-xl bg-secondary px-3 py-2 text-xs font-mono hover:bg-accent transition"
              >
                <span className="text-muted-foreground">Join code</span>
                <span className="tracking-[0.3em] font-bold text-foreground">{c.join_code}</span>
                {copied === c.join_code ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5 text-muted-foreground" />}
              </button>
            </div>
          ))}
        </div>
      )}

      <CreateJoinClassDialog open={open} onClose={() => setOpen(false)} onChanged={load} />
    </div>
  );
}
