import { r as reactExports, W as jsxRuntimeExports } from "./server-U61-uJh3.js";
import { c as createLucideIcon, u as useAuth, a as useNavigate, t as toast, s as supabase, o as objectType, b as stringType } from "./router-CYx1i6QQ.js";
import { A as Avatar } from "./Avatar-CxBchUvZ.js";
import { A as ArrowLeft } from "./arrow-left-D1Xbmolz.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode$1 = [
  [
    "path",
    {
      d: "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z",
      key: "18u6gg"
    }
  ],
  ["circle", { cx: "12", cy: "13", r: "3", key: "1vg3eu" }]
];
const Camera = createLucideIcon("camera", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
      key: "1c8476"
    }
  ],
  ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", key: "1ydtos" }],
  ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7", key: "t51u73" }]
];
const Save = createLucideIcon("save", __iconNode);
const schema = objectType({
  display_name: stringType().trim().min(1, "Required").max(60),
  bio: stringType().trim().max(160).optional().nullable()
});
function ProfilePage() {
  const {
    user,
    profile,
    refreshProfile
  } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = reactExports.useState("");
  const [bio, setBio] = reactExports.useState("");
  const [avatarUrl, setAvatarUrl] = reactExports.useState(null);
  const [saving, setSaving] = reactExports.useState(false);
  const [uploading, setUploading] = reactExports.useState(false);
  const fileRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setBio(profile.bio ?? "");
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile?.id]);
  const onPickAvatar = async (f) => {
    if (!user) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please pick an image");
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      toast.error("Max 4MB");
      return;
    }
    setUploading(true);
    const ext = f.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const {
      error: upErr
    } = await supabase.storage.from("chat-media").upload(path, f, {
      upsert: true,
      contentType: f.type
    });
    if (upErr) {
      toast.error(upErr.message);
      setUploading(false);
      return;
    }
    const url = supabase.storage.from("chat-media").getPublicUrl(path).data.publicUrl;
    setAvatarUrl(url);
    await supabase.from("profiles").update({
      avatar_url: url
    }).eq("id", user.id);
    await refreshProfile();
    setUploading(false);
    toast.success("Photo updated");
  };
  const save = async () => {
    if (!user) return;
    const parsed = schema.safeParse({
      display_name: displayName,
      bio: bio || null
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    const {
      error
    } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success("Profile saved");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-h-0 overflow-y-auto scroll-thin", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-24 md:pb-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => navigate({
      to: "/app/settings"
    }), className: "flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4" }),
      " Back"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-extrabold mb-1", children: "Edit profile" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-6", children: "How others will see you across AURA." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-3 mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: displayName || "?", src: avatarUrl, size: 112 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => fileRef.current?.click(), disabled: uploading, className: "absolute bottom-0 right-0 size-9 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg hover:opacity-90 transition disabled:opacity-50", title: "Change photo", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "size-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileRef, type: "file", accept: "image/*", className: "hidden", onChange: (e) => {
          const f = e.target.files?.[0];
          if (f) onPickAvatar(f);
          e.target.value = "";
        } })
      ] }),
      uploading && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "Uploading…" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
        "@",
        profile?.username
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Display name", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: displayName, onChange: (e) => setDisplayName(e.target.value), maxLength: 60, className: "w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Bio", hint: `${bio.length}/160`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: bio, onChange: (e) => setBio(e.target.value), rows: 3, maxLength: 160, placeholder: "A short status — what you're up to", className: "w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: save, disabled: saving, className: "w-full rounded-2xl bg-primary text-primary-foreground py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "size-4" }),
        " ",
        saving ? "Saving…" : "Save changes"
      ] })
    ] })
  ] }) });
}
function Field({
  label,
  hint,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1.5 px-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider", children: label }),
      hint && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground", children: hint })
    ] }),
    children
  ] });
}
export {
  ProfilePage as component
};
