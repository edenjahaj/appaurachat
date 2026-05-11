import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

const KEY = "aura.update.v2";
const NOTES = [
  "Light & dark themes with auto mode",
  "Settings hub + editable profile",
  "Pin best friends to the top",
  "Mobile bottom navigation",
  "Emoji reactions, replies & pinned messages",
];

export function UpdateAnnouncement() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => { localStorage.setItem(KEY, "1"); setOpen(false); };
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm p-4 animate-in fade-in" onClick={dismiss}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl bg-card border border-border shadow-2xl p-6 animate-in zoom-in-95"
      >
        <button onClick={dismiss} className="absolute top-3 right-3 size-8 rounded-full hover:bg-secondary grid place-items-center" aria-label="Close">
          <X className="size-4" />
        </button>
        <div className="size-14 rounded-2xl bg-[image:var(--gradient-aurora)] grid place-items-center mb-3 shadow-lg">
          <Sparkles className="size-7 text-white" />
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">What's new · v2.0</div>
        <h2 className="text-2xl font-extrabold mb-3">AURA just got better</h2>
        <ul className="space-y-2 mb-5">
          {NOTES.map((n) => (
            <li key={n} className="flex gap-2 text-sm">
              <span className="text-primary mt-0.5">✦</span>
              <span>{n}</span>
            </li>
          ))}
        </ul>
        <button onClick={dismiss} className="w-full rounded-2xl bg-primary text-primary-foreground py-3 font-semibold hover:opacity-90 transition">
          Let's go
        </button>
      </div>
    </div>
  );
}
