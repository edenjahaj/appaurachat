import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { X, GraduationCap, KeyRound } from "lucide-react";
import { toast } from "sonner";

export function CreateJoinClassDialog({ open, onClose, onChanged }: { open: boolean; onClose: () => void; onChanged: () => void }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"create" | "join">("join");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("create_class", { _name: name.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Class created");
    onChanged();
    onClose();
    navigate({ to: "/app/cls/$classId", params: { classId: data as string } });
  };

  const join = async () => {
    if (code.trim().length < 4) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("join_class", { _code: code.trim().toUpperCase() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Joined class");
    onChanged();
    onClose();
    navigate({ to: "/app/cls/$classId", params: { classId: data as string } });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-card border border-border shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Classes</h2>
          <button onClick={onClose} className="size-8 rounded-full hover:bg-secondary grid place-items-center"><X className="size-4" /></button>
        </div>
        <div className="grid grid-cols-2 bg-secondary rounded-2xl p-1 text-sm font-semibold mb-4">
          <button onClick={() => setTab("join")} className={`py-2 rounded-xl transition ${tab === "join" ? "bg-card shadow" : "text-muted-foreground"}`}>Join</button>
          <button onClick={() => setTab("create")} className={`py-2 rounded-xl transition ${tab === "create" ? "bg-card shadow" : "text-muted-foreground"}`}>Create</button>
        </div>

        {tab === "join" ? (
          <div className="space-y-3">
            <div className="grid place-items-center py-2"><div className="size-12 rounded-2xl bg-accent grid place-items-center text-primary"><KeyRound className="size-6" /></div></div>
            <p className="text-xs text-center text-muted-foreground">Enter the 6-character class code from your teacher.</p>
            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD23"
              maxLength={8}
              className="w-full text-center tracking-[0.4em] font-mono text-lg py-3 rounded-2xl bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={join} disabled={busy || code.trim().length < 4} className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50">
              {busy ? "Joining…" : "Join class"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid place-items-center py-2"><div className="size-12 rounded-2xl bg-accent grid place-items-center text-primary"><GraduationCap className="size-6" /></div></div>
            <p className="text-xs text-center text-muted-foreground">You'll be the admin. Students join with the code.</p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Math 101"
              maxLength={60}
              className="w-full py-3 px-4 rounded-2xl bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={create} disabled={busy || !name.trim()} className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50">
              {busy ? "Creating…" : "Create class"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
