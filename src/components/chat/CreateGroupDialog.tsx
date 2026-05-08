import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "./Avatar";
import { toast } from "sonner";
import { X } from "lucide-react";

interface Person { id: string; display_name: string; username: string; avatar_url: string | null; }

export function CreateGroupDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setName("");
    setSelected(new Set());
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .neq("id", user.id)
        .order("display_name");
      setPeople((data ?? []) as Person[]);
    })();
  }, [open, user?.id]);

  if (!open) return null;

  const submit = async () => {
    if (!name.trim()) return toast.error("Give the group a name");
    if (selected.size === 0) return toast.error("Add at least one person");
    setSubmitting(true);
    const { error } = await supabase.rpc("create_group", { _name: name.trim(), _member_ids: Array.from(selected) });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Group created");
    onCreated();
    onClose();
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg">New group</h2>
          <button onClick={onClose} className="size-8 rounded-full grid place-items-center hover:bg-secondary"><X className="size-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" className="w-full rounded-xl bg-secondary px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" maxLength={40} />
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin px-3 pb-3">
          {people.map((p) => (
            <button key={p.id} onClick={() => toggle(p.id)} className={`w-full flex items-center gap-3 p-2 rounded-2xl transition ${selected.has(p.id) ? "bg-accent" : "hover:bg-secondary"}`}>
              <Avatar name={p.display_name} src={p.avatar_url} size={40} />
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium truncate">{p.display_name}</div>
                <div className="text-xs text-muted-foreground truncate">@{p.username}</div>
              </div>
              <div className={`size-5 rounded-full border-2 ${selected.has(p.id) ? "bg-primary border-primary" : "border-border"}`} />
            </button>
          ))}
        </div>
        <div className="p-5 border-t border-border">
          <button onClick={submit} disabled={submitting} className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 disabled:opacity-50 hover:opacity-90">
            Create group
          </button>
        </div>
      </div>
    </div>
  );
}
