import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Props {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  selfId: string;
  peerId: string;
  peerName: string;
  mode: "audio" | "video";
  // when true, we initiate the call; otherwise we are answering
  initiator: boolean;
}

const ICE = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export function CallDialog({ open, onClose, conversationId, selfId, peerId, peerName, mode, initiator }: Props) {
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(mode === "audio");
  const [status, setStatus] = useState(initiator ? "Calling…" : "Connecting…");
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const pc = new RTCPeerConnection(ICE);
    pcRef.current = pc;
    const ch = supabase.channel(`call:${conversationId}`, { config: { broadcast: { self: false } } });
    channelRef.current = ch;

    const send = (type: string, payload: any) =>
      ch.send({ type: "broadcast", event: "sig", payload: { type, from: selfId, to: peerId, payload } });

    pc.onicecandidate = (e) => { if (e.candidate) send("ice", e.candidate.toJSON()); };
    pc.ontrack = (e) => {
      if (remoteRef.current) {
        remoteRef.current.srcObject = e.streams[0];
        setStatus("Connected");
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setStatus("Disconnected");
      }
    };

    ch.on("broadcast", { event: "sig" }, async ({ payload }) => {
      if (!payload || payload.to !== selfId) return;
      try {
        if (payload.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.payload));
          const ans = await pc.createAnswer();
          await pc.setLocalDescription(ans);
          send("answer", ans);
        } else if (payload.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.payload));
        } else if (payload.type === "ice") {
          await pc.addIceCandidate(new RTCIceCandidate(payload.payload));
        } else if (payload.type === "hangup") {
          toast.info("Call ended");
          handleClose();
        }
      } catch (err) { console.error(err); }
    });

    (async () => {
      await ch.subscribe();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mode === "video",
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        localStreamRef.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        if (initiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          send("offer", offer);
          // notify peer that an incoming call exists, so they show ringing
          send("ring", { mode });
        }
      } catch (err: any) {
        toast.error(err?.message || "Could not access mic/camera");
        handleClose();
      }
    })();

    return () => {
      cancelled = true;
      try { ch.send({ type: "broadcast", event: "sig", payload: { type: "hangup", from: selfId, to: peerId } }); } catch {}
      pc.close();
      supabase.removeChannel(ch);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() { onClose(); }
  function toggleMute() {
    const s = localStreamRef.current; if (!s) return;
    s.getAudioTracks().forEach((t) => (t.enabled = muted));
    setMuted(!muted);
  }
  function toggleCam() {
    const s = localStreamRef.current; if (!s) return;
    s.getVideoTracks().forEach((t) => (t.enabled = camOff));
    setCamOff(!camOff);
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/90 grid place-items-center p-4">
      <div className="w-full max-w-3xl flex flex-col items-center gap-4">
        <div className="text-white text-center">
          <div className="text-xl font-bold">{peerName}</div>
          <div className="text-sm opacity-80">{status}</div>
        </div>
        <div className="relative w-full aspect-video bg-zinc-900 rounded-3xl overflow-hidden">
          <video ref={remoteRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
          <video ref={localRef} autoPlay playsInline muted className="absolute bottom-3 right-3 w-40 aspect-video rounded-xl object-cover ring-2 ring-white/20" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleMute} className="size-12 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
            {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </button>
          {mode === "video" && (
            <button onClick={toggleCam} className="size-12 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
              {camOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
            </button>
          )}
          <button onClick={handleClose} className="size-14 grid place-items-center rounded-full bg-destructive text-white hover:opacity-90">
            <PhoneOff className="size-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Component: listen for incoming-call ring broadcasts on a conversation */
export function CallRingListener({ conversationId, selfId, onRing }: { conversationId: string; selfId: string | null; onRing: (peerId: string, mode: "audio" | "video") => void }) {
  useEffect(() => {
    if (!conversationId || !selfId) return;
    const ch = supabase.channel(`call:${conversationId}`, { config: { broadcast: { self: false } } });
    ch.on("broadcast", { event: "sig" }, ({ payload }) => {
      if (payload?.type === "ring" && payload.from !== selfId) {
        onRing(payload.from, payload.payload?.mode ?? "audio");
      }
    });
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversationId, selfId, onRing]);
  return null;
}
