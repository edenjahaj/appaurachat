import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { useFavorites } from "@/lib/favorites-context";
import { Avatar } from "./Avatar";
import { MessageCircle, Search, Star } from "lucide-react";
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
  const { isOnline } = useRealtime();
  const { isFavorite, toggle: toggleFav } = useFavorites();
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

  const filtered = people
    .filter((p) => !q || p.display_name.toLowerCase().includes(q.toLowerCase()) || p.username.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(isFavorite(b.id)) - Number(isFavorite(a.id)));

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
          {filtered.map((p) => {
            const fav = isFavorite(p.id);
            return (
              <div key={p.id} className={`flex items-center gap-3 p-3 rounded-2xl bg-card border transition ${fav ? "border-primary/40 shadow-[0_0_0_1px_var(--color-primary)/_10%]" : "border-border hover:shadow-[var(--shadow-soft)]"}`}>
                <div className="relative">
                  <Avatar name={p.display_name} src={p.avatar_url} size={48} />
                  {isOnline(p.id) && <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-card" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate flex items-center gap-1.5">
                    {p.display_name}
                    {fav && <Star className="size-3.5 fill-amber-400 text-amber-400" />}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    @{p.username}
                    {isOnline(p.id) && <span className="ml-2 text-emerald-600 font-medium">• Online</span>}
                    {p.bio ? ` • ${p.bio}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => toggleFav(p.id)}
                  className={`size-9 rounded-full grid place-items-center transition ${fav ? "bg-amber-400/15 text-amber-500" : "hover:bg-secondary text-muted-foreground"}`}
                  title={fav ? "Remove from best friends" : "Add to best friends"}
                >
                  <Star className={`size-4 ${fav ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={() => openChat(p)}
                  disabled={opening === p.id}
                  className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50 hover:opacity-90"
                >
                  <MessageCircle className="size-4" />
                  Message
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
