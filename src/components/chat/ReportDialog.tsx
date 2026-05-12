import { useState } from "react";
import { X, Flag } from "lucide-react";
import { toast } from "sonner";
import { reportMessage } from "@/lib/moderation";

const REASONS = ["Spam", "Harassment", "Hate speech", "Sexual content", "Violence", "Other"];

export function ReportDialog({ messageId, scope, onClose }: { messageId: string; scope: "dm" | "channel"; onClose: () => void }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await reportMessage({ messageId, scope, reason, details });
      toast.success("Report submitted. Thanks for keeping AURA safe.");
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Could not submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-sm rounded-3xl bg-card border border-border shadow-2xl p-6">
        <button onClick={onClose} className="absolute top-3 right-3 size-8 rounded-full hover:bg-secondary grid place-items-center"><X className="size-4" /></button>
        <div className="size-12 rounded-2xl bg-destructive/10 text-destructive grid place-items-center mb-3"><Flag className="size-6" /></div>
        <h2 className="text-xl font-bold mb-1">Report message</h2>
        <p className="text-xs text-muted-foreground mb-4">Your report is private. The moderation team will review it.</p>
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reason</label>
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full mt-1 mb-3 px-3 py-2 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Details (optional)</label>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} className="w-full mt-1 mb-4 px-3 py-2 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" placeholder="Share any context…" />
        <button disabled={submitting} onClick={submit} className="w-full rounded-2xl bg-destructive text-destructive-foreground py-3 font-semibold hover:opacity-90 transition disabled:opacity-50">
          {submitting ? "Submitting…" : "Submit report"}
        </button>
      </div>
    </div>
  );
}
