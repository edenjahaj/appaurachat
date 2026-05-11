import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/components/chat/Avatar";
import { ArrowLeft, Camera, Save } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  display_name: z.string().trim().min(1, "Required").max(60),
  bio: z.string().trim().max(160).optional().nullable(),
});

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setBio(profile.bio ?? "");
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile?.id]);

  const onPickAvatar = async (f: File) => {
    if (!user) return;
    if (!f.type.startsWith("image/")) { toast.error("Please pick an image"); return; }
    if (f.size > 4 * 1024 * 1024) { toast.error("Max 4MB"); return; }
    setUploading(true);
    const ext = f.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("chat-media").upload(path, f, { upsert: true, contentType: f.type });
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const url = supabase.storage.from("chat-media").getPublicUrl(path).data.publicUrl;
    setAvatarUrl(url);
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    await refreshProfile();
    setUploading(false);
    toast.success("Photo updated");
  };

  const save = async () => {
    if (!user) return;
    const parsed = schema.safeParse({ display_name: displayName, bio: bio || null });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success("Profile saved");
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scroll-thin">
      <div className="max-w-xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-24 md:pb-10">
        <button onClick={() => navigate({ to: "/app/settings" })} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="size-4" /> Back
        </button>
        <h1 className="text-3xl font-extrabold mb-1">Edit profile</h1>
        <p className="text-sm text-muted-foreground mb-6">How others will see you across AURA.</p>

        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="relative">
            <Avatar name={displayName || "?"} src={avatarUrl} size={112} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 size-9 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg hover:opacity-90 transition disabled:opacity-50"
              title="Change photo"
            >
              <Camera className="size-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickAvatar(f); e.target.value = ""; }}
            />
          </div>
          {uploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
          <span className="text-xs text-muted-foreground">@{profile?.username}</span>
        </div>

        <div className="space-y-4">
          <Field label="Display name">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={60}
              className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
          <Field label="Bio" hint={`${bio.length}/160`}>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={160}
              placeholder="A short status — what you're up to"
              className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </Field>
          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded-2xl bg-primary text-primary-foreground py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition"
          >
            <Save className="size-4" /> {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
