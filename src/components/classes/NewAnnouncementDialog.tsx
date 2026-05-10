import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { X, AlertTriangle, Star, Megaphone } from "lucide-react";
import { toast } from "sonner";

type Severity = "normal" | "important" | "critical";

export function NewAnnouncementDialog({ open, onClose, classId, onCreated }: { open: boolean; onClose: () => void; classId: string; onCreated: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<Severity>("normal");
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!user || !title.trim() || !body.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("announcements").insert({
      class_id: classId,
      author_id: user.id,
      title: title.trim(),
      body: body.trim(),
      severity,
      pinned,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Announcement posted");
    setTitle(""); setBody(""); setSeverity("normal"); setPinned(false);
    onCreated();
    onClose();
  };

  const opts: { v: Severity; label: string; Icon: React.ComponentType<{ className?: string }>; cls: string }[] = [
    { v: "normal",    label: "Normal",    Icon: Megaphone,     cls: "bg-secondary text-foreground" },
    { v: "important", label: "Important", Icon: Star,          cls: "bg-primary/15 text-primary" },
    { v: "critical",  label: "Critical",  Icon: AlertTriangle, cls: "bg-destructive text-destructive-foreground" },
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">New announcement</h2>
          <button onClick={onClose} className="size-8 rounded-full hover:bg-secondary grid place-items-center"><X className="size-4" /></button>
        </div>
        <div className="space-y-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            maxLength={120}
            className="w-full px-4 py-3 rounded-2xl bg-secondary focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What do you want to announce?"
            maxLength={2000}
            rows={5}
            className="w-full px-4 py-3 rounded-2xl bg-secondary focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
          />
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Severity</p>
            <div className="grid grid-cols-3 gap-2">
              {opts.map((o) => (
                <button
                  key={o.v}
                  onClick={() => setSeverity(o.v)}
                  className={`px-2 py-2 rounded-xl text-xs font-bold inline-flex flex-col items-center gap-1 border transition ${
                    severity === o.v ? `${o.cls} border-transparent shadow` : "border-border bg-card text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <o.Icon className="size-4" />
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded" />
            Pin to top
          </label>
          <button
            onClick={submit}
            disabled={busy || !title.trim() || !body.trim()}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
          >
            {busy ? "Posting…" : "Post announcement"}
          </button>
        </div>
      </div>
    </div>
  );
}
