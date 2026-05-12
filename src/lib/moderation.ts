import { supabase } from "@/integrations/supabase/client";

export async function isMuted(conversationId: string, userId: string) {
  const { data } = await supabase
    .from("conversation_mutes")
    .select("conversation_id")
    .eq("user_id", userId)
    .eq("conversation_id", conversationId)
    .maybeSingle();
  return !!data;
}

export async function isBlocked(otherUserId: string, userId: string) {
  const { data } = await supabase
    .from("user_blocks")
    .select("blocked_user_id")
    .eq("user_id", userId)
    .eq("blocked_user_id", otherUserId)
    .maybeSingle();
  return !!data;
}

export async function toggleMute(conversationId: string) {
  const { data, error } = await supabase.rpc("toggle_mute", { _conversation_id: conversationId });
  if (error) throw error;
  return data as boolean;
}

export async function toggleBlock(blockedUserId: string) {
  const { data, error } = await supabase.rpc("toggle_block", { _blocked_user_id: blockedUserId });
  if (error) throw error;
  return data as boolean;
}

export async function reportMessage(params: { messageId: string; scope: "dm" | "channel"; reason: string; details?: string }) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");
  const { error } = await supabase.from("message_reports").insert({
    reporter_id: u.user.id,
    message_id: params.messageId,
    scope: params.scope,
    reason: params.reason,
    details: params.details ?? null,
  });
  if (error) throw error;
}
