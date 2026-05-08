import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "./Avatar";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNowStrict } from "date-fns";

interface Story {
  id: string;
  user_id: string;
  content: string;
  background: string;
  created_at: string;
  expires_at: string;
  profile?: { display_name: string; username: string; avatar_url: string | null };
}

const BACKGROUNDS = ["gradient-1", "gradient-2", "gradient-3", "gradient-4", "gradient-5"];

export function StoriesPage() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [viewing, setViewing] = useState<Story | null>(null);
  const [text, setText] = useState("");
  const [bg, setBg] = useState("gradient-1");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data: s } = await supabase
      .from("stories")
      .select("id, user_id, content, background, created_at, expires_at")
      .order("created_at", { ascending: false });
    const ids = Array.from(new Set((s ?? []).map((x) => x.user_id)));
    const { data: ps } = ids.length
      ? await supabase.from("profiles").select("id, display_name, username, avatar_url").in("id", ids)
      : { data: [] as { id: string; display_name: string; username: string; avatar_url: string | null }[] };
    const map = new Map((ps ?? []).map((p) => [p.id, p]));
    setStories(((s ?? []) as Story[]).map((st) => ({ ...st, profile: map.get(st.user_id) })));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("stories")
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const submit = async () => {
    const c = text.trim();
    if (!c) return toast.error("Write something");
    setSubmitting(true);
    const { error } = await supabase.from("stories").insert({ user_id: user!.id, content: c, background: bg });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Story posted");
    setText("");
    setComposing(false);
  };

  const removeStory = async (id: string) => {
    const { error } = await supabase.from("stories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setViewing(null);
    toast.success("Story deleted");
  };

  return (
    <div className="flex-1 overflow-y-auto scroll-thin">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold">Stories</h1>
            <p className="text-sm text-muted-foreground">Share moments that disappear in 24 hours.</p>
          </div>
          <button onClick={() => setComposing(true)} className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:opacity-90">
            <Plus className="size-4" /> Add story
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : stories.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-3xl">
            <p className="text-muted-foreground">No stories yet. Be the first!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stories.map((s) => (
              <button
                key={s.id}
                onClick={() => setViewing(s)}
                className={`story-${s.background} aspect-[9/14] rounded-3xl p-4 flex flex-col justify-between text-white text-left shadow-[var(--shadow-soft)] hover:scale-[1.02] transition`}
              >
                <div className="flex items-center gap-2">
                  <Avatar name={s.profile?.display_name ?? "?"} src={s.profile?.avatar_url} size={32} />
                  <div className="text-xs">
                    <div className="font-semibold">{s.profile?.display_name}</div>
                    <div className="opacity-80">{formatDistanceToNowStrict(new Date(s.created_at), { addSuffix: true })}</div>
                  </div>
                </div>
                <p className="font-semibold leading-snug line-clamp-5">{s.content}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {composing && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={() => setComposing(false)}>
          <div className="bg-card rounded-3xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">New story</h2>
              <button onClick={() => setComposing(false)} className="size-8 rounded-full grid place-items-center hover:bg-secondary"><X className="size-4" /></button>
            </div>
            <div className={`story-${bg} aspect-[9/14] rounded-2xl p-5 mb-4 text-white grid place-items-center`}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={500}
                placeholder="What's on your mind?"
                className="w-full h-full bg-transparent text-center text-lg font-semibold placeholder:text-white/60 focus:outline-none resize-none"
              />
            </div>
            <div className="flex gap-2 mb-4">
              {BACKGROUNDS.map((b) => (
                <button key={b} onClick={() => setBg(b)} className={`story-${b} size-10 rounded-full border-2 ${bg === b ? "border-primary" : "border-transparent"}`} />
              ))}
            </div>
            <button onClick={submit} disabled={submitting} className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 disabled:opacity-50">Post story</button>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4" onClick={() => setViewing(null)}>
          <div className={`story-${viewing.background} aspect-[9/14] w-full max-w-sm rounded-3xl p-6 text-white flex flex-col justify-between relative`} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewing(null)} className="absolute top-3 right-3 size-9 rounded-full bg-black/30 grid place-items-center"><X className="size-5" /></button>
            <div className="flex items-center gap-2">
              <Avatar name={viewing.profile?.display_name ?? "?"} src={viewing.profile?.avatar_url} size={36} />
              <div className="text-sm">
                <div className="font-semibold">{viewing.profile?.display_name}</div>
                <div className="opacity-80 text-xs">{formatDistanceToNowStrict(new Date(viewing.created_at), { addSuffix: true })}</div>
              </div>
            </div>
            <p className="text-2xl font-bold text-center px-4">{viewing.content}</p>
            <div>
              {viewing.user_id === user?.id && (
                <button onClick={() => removeStory(viewing.id)} className="w-full rounded-xl bg-white/20 backdrop-blur py-2 text-sm font-semibold hover:bg-white/30">
                  Delete story
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
