import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SmilePlus } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Scope = "channel" | "dm";
const QUICK = ["👍", "❤️", "😂", "🔥", "😮", "🎉"];

interface Row { message_id: string; user_id: string; emoji: string; }

export function MessageReactions({ messageId, scope, align = "left" }: { messageId: string; scope: Scope; align?: "left" | "right" }) {
  const { user } = useAuth();
  const table = scope === "channel" ? "message_reactions" : "dm_reactions";
  const rpc = scope === "channel" ? "toggle_channel_reaction" : "toggle_dm_reaction";
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from(table).select("message_id, user_id, emoji").eq("message_id", messageId);
      if (!cancelled) setRows((data ?? []) as Row[]);
    })();
    const ch: RealtimeChannel = supabase
      .channel(`react:${scope}:${messageId}`)
      .on("postgres_changes", { event: "*", schema: "public", table, filter: `message_id=eq.${messageId}` }, async () => {
        const { data } = await supabase.from(table).select("message_id, user_id, emoji").eq("message_id", messageId);
        setRows((data ?? []) as Row[]);
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [messageId, table, scope]);

  const grouped = useMemo(() => {
    const m = new Map<string, { count: number; mine: boolean }>();
    for (const r of rows) {
      const cur = m.get(r.emoji) ?? { count: 0, mine: false };
      cur.count++;
      if (r.user_id === user?.id) cur.mine = true;
      m.set(r.emoji, cur);
    }
    return Array.from(m.entries());
  }, [rows, user?.id]);

  const toggle = async (emoji: string) => {
    setOpen(false);
    await supabase.rpc(rpc, { _message_id: messageId, _emoji: emoji });
  };

  return (
    <div className={`flex flex-wrap items-center gap-1 mt-1 ${align === "right" ? "justify-end" : ""}`}>
      {grouped.map(([emoji, info]) => (
        <button
          key={emoji}
          onClick={() => toggle(emoji)}
          className={`text-xs px-2 py-0.5 rounded-full border transition ${info.mine ? "bg-primary/15 border-primary/40" : "bg-secondary border-transparent hover:border-border"}`}
        >
          {emoji} <span className="font-semibold">{info.count}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-xs size-6 grid place-items-center rounded-full hover:bg-secondary transition"
          title="Add reaction"
        >
          <SmilePlus className="size-3.5" />
        </button>
        {open && (
          <div className="absolute z-20 bottom-full mb-1 left-0 flex gap-1 p-1.5 rounded-full bg-card border border-border shadow-lg animate-in fade-in zoom-in-95">
            {QUICK.map((e) => (
              <button key={e} onClick={() => toggle(e)} className="size-7 grid place-items-center rounded-full hover:bg-secondary text-base">{e}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
