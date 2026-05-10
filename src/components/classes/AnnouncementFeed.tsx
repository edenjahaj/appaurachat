import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/chat/Avatar";
import { Megaphone, Pin, Plus, Trash2, AlertTriangle, Star } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { NewAnnouncementDialog } from "./NewAnnouncementDialog";

type Severity = "normal" | "important" | "critical";
interface Announcement {
  id: string;
  class_id: string;
  author_id: string;
  title: string;
  body: string;
  severity: Severity;
  pinned: boolean;
  created_at: string;
}
interface Profile { id: string; display_name: string; avatar_url: string | null; }

const STYLES: Record<Severity, { ring: string; chip: string; label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  normal:    { ring: "border-border",                                                   chip: "bg-secondary text-muted-foreground",                            label: "Normal",    Icon: Megaphone },
  important: { ring: "border-transparent [background:linear-gradient(var(--card),var(--card))_padding-box,var(--gradient-aurora)_border-box] border-2", chip: "bg-primary/15 text-primary",  label: "Important", Icon: Star },
  critical:  { ring: "border-destructive/50 bg-destructive/5",                          chip: "bg-destructive text-destructive-foreground",                    label: "Critical",  Icon: AlertTriangle },
};

export function AnnouncementFeed({ classId, isAdmin }: { classId: string; isAdmin: boolean }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [reads, setReads] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("id, class_id, author_id, title, body, severity, pinned, created_at")
      .eq("class_id", classId)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    const list = (data ?? []) as Announcement[];
    setItems(list);
    const ids = Array.from(new Set(list.map((x) => x.author_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
      setProfiles(new Map((profs ?? []).map((p) => [p.id, p as Profile])));
    }
    if (user) {
      const { data: rd } = await supabase.from("announcement_reads").select("announcement_id").eq("user_id", user.id);
      setReads(new Set((rd ?? []).map((r) => r.announcement_id)));
    }
  };

  useEffect(() => { load(); }, [classId, user?.id]);

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel(`ann:${classId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements", filter: `class_id=eq.${classId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [classId]);

  const markRead = async (id: string) => {
    if (reads.has(id)) return;
    setReads((s) => new Set(s).add(id));
    await supabase.rpc("mark_announcement_read", { _announcement_id: id });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) toast.error(error.message);
  };

  const togglePin = async (a: Announcement) => {
    const { error } = await supabase.from("announcements").update({ pinned: !a.pinned }).eq("id", a.id);
    if (error) toast.error(error.message);
  };

  const sorted = useMemo(() => items, [items]);

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-background">
      <header className="h-14 px-4 border-b border-border flex items-center gap-3 bg-card/60 backdrop-blur">
        <Megaphone className="size-4 text-muted-foreground" />
        <h2 className="font-bold">announcements</h2>
        {isAdmin && (
          <button
            onClick={() => setOpen(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:opacity-90"
          >
            <Plus className="size-3.5" /> New
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-3">
        {sorted.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center mt-6">
            <div className="size-12 rounded-2xl bg-accent grid place-items-center text-primary mx-auto mb-3"><Megaphone className="size-6" /></div>
            <p className="font-semibold">No announcements yet</p>
            <p className="text-sm text-muted-foreground mt-1">{isAdmin ? "Post one to get started." : "Check back soon."}</p>
          </div>
        ) : (
          sorted.map((a) => {
            const s = STYLES[a.severity];
            const prof = profiles.get(a.author_id);
            const unread = !reads.has(a.id);
            return (
              <article
                key={a.id}
                onClick={() => markRead(a.id)}
                className={`relative rounded-2xl border bg-card backdrop-blur p-4 transition hover:shadow-lg cursor-default ${s.ring}`}
              >
                {unread && <span className="absolute top-3 right-3 size-2.5 rounded-full bg-primary ring-2 ring-card" />}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${s.chip}`}>
                    <s.Icon className="size-3" /> {s.label}
                  </span>
                  {a.pinned && <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-amber-500"><Pin className="size-3" /> Pinned</span>}
                </div>
                <h3 className="text-base font-extrabold leading-snug">{a.title}</h3>
                <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">{a.body}</p>
                <footer className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar name={prof?.display_name ?? "?"} src={prof?.avatar_url} size={20} />
                  <span className="font-semibold text-foreground">{prof?.display_name ?? "Unknown"}</span>
                  <span>·</span>
                  <span>{format(new Date(a.created_at), "MMM d, h:mm a")}</span>
                  {isAdmin && (
                    <div className="ml-auto flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); togglePin(a); }} className="size-7 rounded-md hover:bg-secondary grid place-items-center" title={a.pinned ? "Unpin" : "Pin"}>
                        <Pin className={`size-3.5 ${a.pinned ? "text-amber-500" : ""}`} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); remove(a.id); }} className="size-7 rounded-md hover:bg-destructive/10 hover:text-destructive grid place-items-center" title="Delete">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </footer>
              </article>
            );
          })
        )}
      </div>

      <NewAnnouncementDialog open={open} onClose={() => setOpen(false)} classId={classId} onCreated={load} />
    </div>
  );
}
