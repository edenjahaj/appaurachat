import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { Avatar } from "./Avatar";
import { MessageCircle, Search } from "lucide-react";
import { toast } from "sonner";

interface Person {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

export function PeopleList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio")
        .neq("id", user!.id)
        .order("display_name");
      setPeople((data ?? []) as Person[]);
      setLoading(false);
    })();
  }, [user?.id]);

  const openChat = async (other: Person) => {
    setOpening(other.id);
    const { data, error } = await supabase.rpc("get_or_create_dm", { _other_user_id: other.id });
    setOpening(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) navigate({ to: "/app/c/$conversationId", params: { conversationId: data as string } });
  };

  const filtered = people.filter(
    (p) => !q || p.display_name.toLowerCase().includes(q.toLowerCase()) || p.username.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-1">People</h1>
      <p className="text-sm text-muted-foreground mb-5">Find someone to start chatting with.</p>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or @username"
          className="w-full pl-9 pr-3 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No people yet. Invite a friend!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:shadow-[var(--shadow-soft)] transition">
              <Avatar name={p.display_name} src={p.avatar_url} size={48} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{p.display_name}</div>
                <div className="text-xs text-muted-foreground truncate">@{p.username}{p.bio ? ` • ${p.bio}` : ""}</div>
              </div>
              <button
                onClick={() => openChat(p)}
                disabled={opening === p.id}
                className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50 hover:opacity-90"
              >
                <MessageCircle className="size-4" />
                Message
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
