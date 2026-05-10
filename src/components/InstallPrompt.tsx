import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "aura:install-dismissed-at";
const DISMISS_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [iosShow, setIosShow] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() - dismissedAt < DISMISS_MS) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    if (isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS fallback (no beforeinstallprompt)
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (isIOS) {
      setTimeout(() => { setIosShow(true); setVisible(true); }, 2500);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    setVisible(false);
    setEvt(null);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] px-4 pointer-events-none animate-in slide-in-from-bottom-6 duration-300">
      <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-4 flex items-center gap-3">
        <img src="/icon-192.png" alt="AURA" className="size-12 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Install AURA</p>
          <p className="text-xs text-muted-foreground truncate">
            {iosShow ? "Tap Share → Add to Home Screen" : "Add to home screen for the full app"}
          </p>
        </div>
        {!iosShow && evt && (
          <button
            onClick={install}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
          >
            <Download className="size-4" /> Install
          </button>
        )}
        <button
          onClick={dismiss}
          className="shrink-0 size-8 rounded-full grid place-items-center hover:bg-secondary transition"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
