import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";

interface FavCtx {
  favorites: Set<string>;
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
}
const Ctx = createContext<FavCtx | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user) { setFavorites(new Set()); return; }
    const { data } = await supabase.from("favorites").select("friend_id").eq("user_id", user.id);
    setFavorites(new Set((data ?? []).map((r) => r.friend_id as string)));
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`fav:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "favorites", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, load]);

  const toggle = async (id: string) => {
    // optimistic
    setFavorites((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
    await supabase.rpc("toggle_favorite", { _friend_id: id });
  };

  return (
    <Ctx.Provider value={{ favorites, isFavorite: (id) => favorites.has(id), toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFavorites() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFavorites outside FavoritesProvider");
  return c;
}
