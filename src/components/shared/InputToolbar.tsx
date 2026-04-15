"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUp02Icon,
  StopCircleIcon,
  Cancel01Icon,
  Mic02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { ConnectorPopover } from "@/components/shared/ConnectorPopover";
import { ConnectorModal } from "@/components/shared/ConnectorModal";
import { AttachmentPopover } from "@/components/shared/AttachmentPopover";
import { AssetPickerModal } from "@/components/shared/AssetPickerModal";
import { useIsMobile } from "@/hooks/useIsMobile";

const PLACEHOLDERS = [
  "Create a 10-slide pitch deck for my startup",
  "Build an investor presentation for Series A",
  "Make a product launch deck for our new app",
  "Summarize our company's Q4 financial results",
  "Design a competitive analysis presentation",
  "Create a go-to-market strategy deck",
  "Build a board meeting presentation for 2025",
  "Make a sales deck for enterprise clients",
];

const placeholderContainerVariants = {
  initial: {},
  // 8ms stagger: 44 chars × 8ms = 352ms for last letter to start → total enter ~550ms
  animate: { transition: { staggerChildren: 0.008 } },
  // Same 8ms stagger on exit → total exit ~580ms (mode="wait" gates next sentence on this)
  exit: { transition: { staggerChildren: 0.008, staggerDirection: -1 as const } },
};

const letterVariants = {
  initial: { opacity: 0, filter: "blur(8px)", y: 6 },
  animate: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: {
      opacity: { duration: 0.14 },
      filter: { duration: 0.18 },
      y: { type: "spring" as const, stiffness: 120, damping: 18 },
    },
  },
  exit: {
    opacity: 0,
    filter: "blur(6px)",
    y: -5,
    transition: {
      opacity: { duration: 0.14 },
      filter: { duration: 0.18 },
      y: { type: "spring" as const, stiffness: 120, damping: 18 },
    },
  },
};

interface SelectedTemplate {
  title: string;
  bg: string;
  prompt?: string;
  /** Pre-built full HTML for the first slide (rendered as mini iframe thumbnail) */
  firstSlideHtml?: string;
}

export interface PendingAttachment {
  id: string;           // client-side temp ID until upload resolves
  name: string;
  mimeType: string;
  sizeBytes: number;
  status: "uploading" | "ready" | "error";
  // Set after successful upload:
  storagePath?: string;
  contentType?: "raw" | "text";
  errorMsg?: string;
}

interface InputToolbarProps {
  onSend: (message: string, options?: { deepResearch?: boolean; docsMode?: boolean; attachments?: PendingAttachment[] }) => void;
  isStreaming?: boolean;
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  selectedTemplate?: SelectedTemplate;
  onClearTemplate?: () => void;
  animatedPlaceholder?: boolean;
  focusAnimation?: boolean;
  sessionType?: "slides" | "docs";
  sessionId?: string;
}



export function InputToolbar({
  onSend,
  isStreaming = false,
  onStop,
  placeholder,
  disabled = false,
  selectedTemplate,
  onClearTemplate,
  animatedPlaceholder = false,
  focusAnimation = false,
  sessionType,
  sessionId,
}: InputToolbarProps) {
  const [value, setValue] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(""); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [deepResearch, setDeepResearch] = useState(false);
  const [docsMode, setDocsMode] = useState(false);
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [connectorModalOpen, setConnectorModalOpen] = useState(false);
  const connectorBtnRef = useRef<HTMLButtonElement>(null);
  const [attachPopoverOpen, setAttachPopoverOpen] = useState(false);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const attachBtnRef = useRef<HTMLButtonElement>(null);

  // Lock toggles to session type — once a session is docs or has deep research, keep it on
  const isDocsLocked = sessionType === "docs";
  const effectiveDocsMode = isDocsLocked || docsMode;
  const [plusHovered, setPlusHovered] = useState(false);
  const [micHovered, setMicHovered] = useState(false);
  const isMobile = useIsMobile();
  // Card geometry: w/h for SVG border glow, centerX/clipTop for blob positioning
  const [cardGeo, setCardGeo] = useState({ w: 0, h: 0, centerX: 0, clipTop: 0 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const audioCtxRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const analyserRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const finalTranscriptRef = useRef<string>("");
  const voiceCanceledRef = useRef(false);
  const ampHistoryRef = useRef<number[]>([]);
  const lastSampleTimeRef = useRef<number>(0);

  // Measure card — feeds both the SVG border glow and the blob centering/clipping
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    function measure() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setCardGeo({
        w: el.offsetWidth,
        h: el.offsetHeight,
        centerX: rect.left + rect.width / 2,  // horizontal center in viewport px
        clipTop: rect.bottom,                  // bottom edge of card in viewport px
      });
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  // Start waveform loop after canvas mounts (isListening → true → canvas in DOM)
  useEffect(() => {
    if (isListening && analyserRef.current) {
      startWaveformLoop();
    }
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  // Cycle animated placeholder when idle
  useEffect(() => {
    if (!animatedPlaceholder || isFocused || value || selectedTemplate) return;
    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 250);
    }, 3200);
    return () => clearInterval(interval);
  }, [animatedPlaceholder, isFocused, value, selectedTemplate]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (!value.trim()) {
      ta.style.height = "44px";
      return;
    }
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [value]);

  // ── File attachment ─────────────────────────────────────────────────────────

  const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB — raw multipart stays under Vercel's 4.5 MB limit

  function handleAttachClick() {
    setAttachPopoverOpen((p) => !p);
  }

  function removeAttachment(id: string) {
    // If the file was already uploaded, delete it from Storage (fire-and-forget)
    const att = pendingAttachments.find((a) => a.id === id);
    if (att?.status === "ready" && att.storagePath) {
      fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath: att.storagePath }),
      }).catch(() => {}); // silent — UI updates immediately regardless
    }
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  async function uploadFileAsync(file: File, tempId: string): Promise<void> {
    if (file.size > MAX_FILE_BYTES) {
      setPendingAttachments((prev) =>
        prev.map((a) => a.id === tempId ? { ...a, status: "error", errorMsg: "File too large (max 4 MB)" } : a)
      );
      return;
    }

    if (!sessionId) {
      setPendingAttachments((prev) =>
        prev.map((a) => a.id === tempId ? { ...a, status: "error", errorMsg: "No session — send a message first" } : a)
      );
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("sessionId", sessionId);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok || !json.attachment) {
        setPendingAttachments((prev) =>
          prev.map((a) => a.id === tempId ? { ...a, status: "error", errorMsg: json.error ?? "Upload failed" } : a)
        );
        return;
      }

      const att = json.attachment as { storagePath: string; contentType: "raw" | "text"; id: string };
      setPendingAttachments((prev) =>
        prev.map((a) =>
          a.id === tempId
            ? { ...a, status: "ready", storagePath: att.storagePath, contentType: att.contentType, id: att.id }
            : a
        )
      );
    } catch {
      setPendingAttachments((prev) =>
        prev.map((a) => a.id === tempId ? { ...a, status: "error", errorMsg: "Network error" } : a)
      );
    }
  }

  function handleAssetsAttached(chips: PendingAttachment[]) {
    setPendingAttachments((prev) => [...prev, ...chips]);
    textareaRef.current?.focus();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";

    // Immediately show chips in uploading state
    const newAttachments: PendingAttachment[] = files.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      mimeType: f.type || "application/octet-stream",
      sizeBytes: f.size,
      status: "uploading" as const,
    }));
    setPendingAttachments((prev) => [...prev, ...newAttachments]);

    // Upload all files in parallel
    await Promise.all(files.map((file, idx) => uploadFileAsync(file, newAttachments[idx].id)));
    textareaRef.current?.focus();
  }

  // ── Voice input ─────────────────────────────────────────────────────────────
  function stopAudio() {
    cancelAnimationFrame(animFrameRef.current);
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    ampHistoryRef.current = [];
  }

  function startWaveformLoop() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ampHistoryRef.current = [];
    lastSampleTimeRef.current = 0;

    const BAR_W = 2;
    const GAP = 2;
    const SAMPLE_MS = 35; // ~28 new bars/sec → dense scrolling feel

    function draw(timestamp: number) {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      const maxBars = Math.floor(W / (BAR_W + GAP));

      // Sample RMS amplitude at SAMPLE_MS cadence
      if (timestamp - lastSampleTimeRef.current >= SAMPLE_MS) {
        lastSampleTimeRef.current = timestamp;
        const analyser = analyserRef.current;
        let rms = 0;
        if (analyser) {
          const buf = new Uint8Array(analyser.fftSize);
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          rms = Math.sqrt(sum / buf.length);
        }
        ampHistoryRef.current.push(rms);
        if (ampHistoryRef.current.length > maxBars) ampHistoryRef.current.shift();
      }

      ctx.clearRect(0, 0, W, H);
      const mid = H / 2;
      const history = ampHistoryRef.current;

      for (let i = 0; i < maxBars; i++) {
        const histIndex = i - (maxBars - history.length);
        const rawAmp = histIndex >= 0 ? history[histIndex] : 0;
        // Min 1.5px dot; scale so normal speech (rms ~0.05-0.3) reaches mid height nicely
        const barH = Math.max(1.5, rawAmp * mid * 7);

        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(i * (BAR_W + GAP), mid - barH, BAR_W, barH * 2, 1);
        } else {
          ctx.rect(i * (BAR_W + GAP), mid - barH, BAR_W, barH * 2);
        }
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }

  function handleVoiceAccept() {
    if (voiceCanceledRef.current) return; // Cancel was clicked — don't save
    recognitionRef.current?.stop();
    stopAudio();
    setIsListening(false);
    const text = finalTranscriptRef.current.trim();
    if (text) {
      setValue(text);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
    setTranscript("");
    finalTranscriptRef.current = "";
  }

  function handleVoiceCancel() {
    voiceCanceledRef.current = true; // Flag so onend → handleVoiceAccept is a no-op
    recognitionRef.current?.stop();
    stopAudio();
    setIsListening(false);
    setTranscript("");
    finalTranscriptRef.current = "";
    setValue(""); // Clear anything that might have been set
  }

  const handleMicClick = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert("Voice input is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      stopAudio();
      setIsListening(false);
      setTranscript("");
      finalTranscriptRef.current = "";
      return;
    }

    // Request mic for Web Audio waveform visualisation
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      // No mic permission — recognition still runs without visualisation
    }

    if (stream) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextAPI = (win.AudioContext || win.webkitAudioContext) as any;
      const actx = new AudioContextAPI();
      const source = actx.createMediaStreamSource(stream);
      const analyser = actx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioCtxRef.current = actx;
      analyserRef.current = analyser;
      // waveform loop starts via useEffect once canvas mounts
    }

    finalTranscriptRef.current = "";
    voiceCanceledRef.current = false; // Reset cancel flag for new session
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      let final = finalTranscriptRef.current;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      finalTranscriptRef.current = final;
      setTranscript(final || interim);
    };

    recognition.onend = () => handleVoiceAccept();
    recognition.onerror = () => {
      stopAudio();
      setIsListening(false);
      setTranscript("");
    };

    recognition.start();
  }, [isListening]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const msg = value.trim() || selectedTemplate?.prompt || "";
    const readyAttachments = pendingAttachments.filter((a) => a.status === "ready");
    if ((!msg && !readyAttachments.length) || isStreaming || disabled) return;
    setValue("");
    setPendingAttachments([]);
    const opts: { deepResearch?: boolean; docsMode?: boolean; attachments?: PendingAttachment[] } = {};
    if (deepResearch) opts.deepResearch = true;
    if (effectiveDocsMode) opts.docsMode = true;
    if (readyAttachments.length) opts.attachments = readyAttachments;
    onSend(msg, Object.keys(opts).length ? opts : undefined);
  }

  function handleFocus() {
    if (!focusAnimation || isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1200);
  }

  const canSend = (value.trim().length > 0 || !!selectedTemplate || pendingAttachments.some((a) => a.status === "ready")) && !isStreaming && !disabled;

  // Dynamic SVG border glow path
  const { w, h, centerX, clipTop } = cardGeo;
  const svgW = w + 4;
  const svgH = h + 4;
  const midX = svgW / 2;
  const r = 24; // matches border-radius: 24px (rounded-3xl)

  const leftPath = w > 0
    ? `M ${midX} ${svgH - 2} L ${r + 2} ${svgH - 2} A ${r} ${r} 0 0 1 2 ${svgH - r - 2} L 2 ${r + 2} A ${r} ${r} 0 0 1 ${r + 2} 2 L ${midX} 2`
    : "";
  const rightPath = w > 0
    ? `M ${midX} ${svgH - 2} L ${svgW - r - 2} ${svgH - 2} A ${r} ${r} 0 0 0 ${svgW - 2} ${svgH - r - 2} L ${svgW - 2} ${r + 2} A ${r} ${r} 0 0 0 ${svgW - r - 2} 2 L ${midX} 2`
    : "";

  return (
    <>
      {/* Hidden file input — triggered by the + button */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.docx,.xlsx,.xls,.txt,.csv,.json,.md"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Full-viewport gradient blob — portalled to body, clipped exactly at card bottom, centered on card */}
      {isAnimating && centerX > 0 && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: 9999 }}
        >
          {/* clipTop px from top = blob only visible below the card's bottom edge */}
          <div className="absolute inset-0" style={{ clipPath: `inset(${clipTop}px 0 0 0)` }}>
            <Image
              src="/images/gradient-blob.png"
              alt=""
              width={1200}
              height={800}
              className="absolute animate-float-up"
              style={{ opacity: 0.55, left: centerX }}
              priority
            />
          </div>
        </div>,
        document.body
      )}

      {/* Input wrapper — relative so SVG glow positions correctly */}
      <div className="relative">

        {/* SVG border glow — traces the rounded rect border */}
        {isAnimating && w > 0 && (
          <div
            className="absolute overflow-hidden pointer-events-none"
            style={{
              inset: -2,
              borderRadius: 26,
              zIndex: 20,
            }}
          >
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox={`0 0 ${svgW} ${svgH}`}
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <defs>
                <radialGradient id="promptPulseGradient">
                  <stop offset="1%"   stopColor="#6B84E8" stopOpacity="1" />
                  <stop offset="3%"   stopColor="#6B84E8" stopOpacity="0.8" />
                  <stop offset="20%"  stopColor="#D4673F" stopOpacity="0.4" />
                  <stop offset="50%"  stopColor="#D4673F" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#D4673F" stopOpacity="0" />
                </radialGradient>
                <mask id="promptBorderMask">
                  <rect width={svgW} height={svgH} fill="white" />
                  <rect x="2" y="2" width={w} height={h} rx={r} ry={r} fill="black" />
                </mask>
              </defs>
              <g mask="url(#promptBorderMask)">
                <circle
                  r="85"
                  fill="url(#promptPulseGradient)"
                  filter="blur(6px)"
                  style={{
                    offsetPath: `path("${leftPath}")`,
                    animation: "followpath-left 0.7s ease-out 0.3s forwards, pulse-fade 0.7s ease-out 0.3s forwards",
                    opacity: 0,
                  } as React.CSSProperties}
                />
                <circle
                  r="85"
                  fill="url(#promptPulseGradient)"
                  filter="blur(6px)"
                  style={{
                    offsetPath: `path("${rightPath}")`,
                    animation: "followpath-right 0.7s ease-out 0.3s forwards, pulse-fade 0.7s ease-out 0.3s forwards",
                    opacity: 0,
                  } as React.CSSProperties}
                />
              </g>
            </svg>
          </div>
        )}

        {/* Main card */}
        <div
          ref={cardRef}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: 16,
            boxShadow: "none",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Template chip */}
          <AnimatePresence>
            {selectedTemplate && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 10 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                style={{ overflow: "hidden", display: "flex", justifyContent: "flex-start" }}
              >
              <div style={{ padding: "8px 8px 2px 0" }}>
              <div
                className="inline-flex items-center gap-2.5 relative"
                style={{
                  padding: "6px 10px 6px 6px",
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.1)",
                  maxWidth: "fit-content",
                }}
              >
                {/* Slide thumbnail */}
                <div
                  style={{
                    width: 64,
                    height: 38,
                    borderRadius: 6,
                    overflow: "hidden",
                    flexShrink: 0,
                    background: selectedTemplate.bg,
                  }}
                >
                  {selectedTemplate.firstSlideHtml ? (
                    <iframe
                      srcDoc={selectedTemplate.firstSlideHtml}
                      style={{
                        width: 1280,
                        height: 720,
                        transform: `scale(${64 / 1280})`,
                        transformOrigin: "top left",
                        border: "none",
                        pointerEvents: "none",
                        display: "block",
                      }}
                      tabIndex={-1}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: selectedTemplate.bg }} />
                  )}
                </div>

                {/* Title + subtitle */}
                <div className="flex flex-col gap-0.5 min-w-0" style={{ maxWidth: 160 }}>
                  <span
                    className="text-[12.5px] font-semibold leading-tight truncate"
                    style={{ color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}
                  >
                    {selectedTemplate.title}
                  </span>
                  <span
                    className="text-[11px] leading-tight"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    Slides Template
                  </span>
                </div>

                {/* Close button */}
                <button
                  onClick={onClearTemplate}
                  className="w-5 h-5 flex items-center justify-center rounded-full transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.5)",
                    position: "absolute",
                    top: -6,
                    right: -6,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.2)";
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)";
                  }}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={10} />
                </button>
              </div>
              </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* File attachment chips */}
          <AnimatePresence>
            {pendingAttachments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 10 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                style={{ overflow: "hidden" }}
              >
                <div className="flex flex-wrap gap-2" style={{ padding: "4px 0 2px" }}>
                  <AnimatePresence>
                    {pendingAttachments.map((att) => (
                      <motion.div
                        key={att.id}
                        initial={{ opacity: 0, scale: 0.88, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, y: -4 }}
                        transition={{ type: "spring", stiffness: 380, damping: 26 }}
                        className="inline-flex items-center gap-1.5 relative"
                        style={{
                          padding: "5px 8px 5px 10px",
                          borderRadius: 10,
                          border: `1px solid ${att.status === "error" ? "var(--red)" : att.status === "uploading" ? "var(--border)" : "var(--border-hover)"}`,
                          background: att.status === "error" ? "var(--red-soft)" : "var(--bg2)",
                          maxWidth: 220,
                        }}
                      >
                        {/* Icon / spinner */}
                        <span style={{ flexShrink: 0, opacity: att.status === "uploading" ? 0.5 : 1 }}>
                          {att.status === "uploading" ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: "var(--text3)", animation: "spin 0.9s linear infinite" }}>
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                          ) : att.status === "error" ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: "var(--red)" }}>
                              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                          ) : att.mimeType.startsWith("image/") ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--text2)" }}>
                              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                            </svg>
                          ) : att.mimeType === "application/pdf" ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--text2)" }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                            </svg>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--text2)" }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                            </svg>
                          )}
                        </span>

                        {/* Filename + subtitle */}
                        <div className="flex flex-col min-w-0" style={{ flex: 1 }}>
                          <span
                            className="truncate"
                            style={{ fontSize: 12, fontWeight: 500, color: att.status === "error" ? "var(--red)" : "var(--text)", lineHeight: 1.3 }}
                          >
                            {att.name}
                          </span>
                          <span style={{ fontSize: 10.5, color: att.status === "error" ? "var(--red)" : "var(--text3)", lineHeight: 1.3 }}>
                            {att.status === "uploading"
                              ? "Uploading…"
                              : att.status === "error"
                              ? (att.errorMsg ?? "Error")
                              : att.sizeBytes < 1024
                              ? `${att.sizeBytes} B`
                              : att.sizeBytes < 1024 * 1024
                              ? `${(att.sizeBytes / 1024).toFixed(1)} KB`
                              : `${(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB`}
                          </span>
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={() => removeAttachment(att.id)}
                          className="flex items-center justify-center rounded-full transition-opacity"
                          style={{ width: 16, height: 16, flexShrink: 0, opacity: 0.5, background: "transparent" }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: "var(--text2)" }}>
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea + animated placeholder */}
          <div style={{ position: "relative" }}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { setIsFocused(true); handleFocus(); }}
              onBlur={() => setIsFocused(false)}
              placeholder={selectedTemplate ? "Add more context or just send…" : (animatedPlaceholder ? "" : (placeholder ?? ""))}
              rows={2}
              disabled={disabled || isStreaming}
              className="w-full bg-transparent focus:outline-none resize-none"
              style={{
                color: "var(--text)",
                fontSize: 15,
                lineHeight: 1.6,
                minHeight: 44,
                maxHeight: 200,
                position: "relative",
                zIndex: 1,
                display: isListening ? "none" : undefined,
              }}
            />

            {/* Waveform canvas — fills full width while recording */}
            {isListening && (
              <canvas
                ref={canvasRef}
                style={{ width: "100%", height: 52, display: "block" }}
              />
            )}

            {/* Animated cycling placeholder — hidden when focused, has value, template selected, or recording */}
            {animatedPlaceholder && !value && !isFocused && !selectedTemplate && !isListening && (
              <div
                className="absolute inset-0 pointer-events-none flex items-start"
                style={{
                  zIndex: 0,
                  paddingTop: 2,
                  WebkitMaskImage: "linear-gradient(to right, black 82%, transparent 100%)",
                  maskImage: "linear-gradient(to right, black 82%, transparent 100%)",
                }}
              >
                <AnimatePresence mode="wait">
                  {showPlaceholder && (
                    <motion.span
                      key={placeholderIndex}
                      variants={placeholderContainerVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      style={{
                        color: "var(--text3)",
                        fontSize: 15,
                        lineHeight: 1.6,
                        whiteSpace: "nowrap",
                        display: "block",
                      }}
                    >
                      {PLACEHOLDERS[placeholderIndex].split("").map((char, i) => (
                        <motion.span
                          key={i}
                          variants={letterVariants}
                          style={{ display: "inline-block" }}
                        >
                          {char === " " ? "\u00A0" : char}
                        </motion.span>
                      ))}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex items-center mt-4" style={{ gap: 8 }}>
            {/* Attachment */}
            <div style={{ position: "relative" }}>
              <motion.button
                ref={attachBtnRef}
                title="Attach file"
                onClick={handleAttachClick}
                onHoverStart={() => setPlusHovered(true)}
                onHoverEnd={() => setPlusHovered(false)}
                className="relative w-9 h-9 rounded-[var(--r-md)] flex items-center justify-center"
                style={{ color: plusHovered ? "var(--text)" : "var(--text2)" }}
                whileTap={{ scale: 0.88 }}
              >
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ background: "var(--accent)", transformOrigin: "center" }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={attachPopoverOpen || plusHovered ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                />
                <span className="relative z-10" style={{ color: attachPopoverOpen || plusHovered ? "var(--bg)" : "var(--text2)", transition: "color 0.12s" }}>
                  <HugeiconsIcon icon={PlusSignIcon} size={21} />
                </span>
              </motion.button>
              <AttachmentPopover
                open={attachPopoverOpen}
                onClose={() => setAttachPopoverOpen(false)}
                anchorRef={attachBtnRef}
                onUpload={() => fileInputRef.current?.click()}
                onAssets={() => setAssetPickerOpen(true)}
              />
            </div>
            <AssetPickerModal
              open={assetPickerOpen}
              onClose={() => setAssetPickerOpen(false)}
              sessionId={sessionId ?? ""}
              onAttach={handleAssetsAttached}
            />

            {/* Connectors pill — opens quick popover, "+ Add connectors" opens full modal */}
            <div style={{ position: "relative" }}>
              <button
                ref={connectorBtnRef}
                title="Connect external tools (Gmail, GitHub, etc.)"
                onClick={() => setConnectorsOpen((p) => !p)}
                className={`deep-research-pill flex items-center gap-1.5 rounded-full ${connectorsOpen ? "active" : ""}`}
                style={{
                  padding: isMobile ? "7px 9px" : "5px 12px 5px 9px",
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {!isMobile && <span>Connectors</span>}
              </button>
              <ConnectorPopover
                open={connectorsOpen}
                onClose={() => setConnectorsOpen(false)}
                onOpenModal={() => setConnectorModalOpen(true)}
                anchorRef={connectorBtnRef}
              />
            </div>
            <ConnectorModal
              open={connectorModalOpen}
              onClose={() => setConnectorModalOpen(false)}
            />

            {/* Docs pill toggle */}
            <button
              title={effectiveDocsMode ? (isDocsLocked ? "Docs mode (locked for this session)" : "Docs mode ON — click to disable") : "Enable Docs mode"}
              onClick={() => { if (isDocsLocked) return; setDocsMode((p) => !p); setDeepResearch(false); }}
              className={`deep-research-pill flex items-center gap-1.5 rounded-full ${effectiveDocsMode ? "active" : ""}`}
              style={{
                padding: isMobile ? "7px 9px" : "5px 12px 5px 9px",
                fontSize: 12.5,
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              {!isMobile && <span>Docs</span>}
            </button>

            {/* Deep Research pill toggle */}
            <button
              title={deepResearch ? "Deep Research ON — click to disable" : "Enable Deep Research"}
              onClick={() => { setDeepResearch((p) => !p); if (!isDocsLocked) setDocsMode(false); }}
              className={`deep-research-pill flex items-center gap-1.5 rounded-full ${deepResearch ? "active" : ""}`}
              style={{
                padding: isMobile ? "7px 9px" : "5px 12px 5px 9px",
                fontSize: 12.5,
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              {!isMobile && <span>Deep research</span>}
            </button>

            <div className="flex-1" />

            {/* Mic — normal state */}
            {!isListening && (
              <motion.button
                title="Voice input"
                onClick={handleMicClick}
                onHoverStart={() => setMicHovered(true)}
                onHoverEnd={() => setMicHovered(false)}
                className="relative w-9 h-9 rounded-[var(--r-md)] flex items-center justify-center"
                style={{ color: "var(--text2)" }}
                whileTap={{ scale: 0.88 }}
              >
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ background: "var(--accent)", transformOrigin: "center" }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={micHovered ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                />
                <span className="relative z-10" style={{ color: micHovered ? "var(--bg)" : "var(--text)", transition: "color 0.12s" }}>
                  <HugeiconsIcon icon={Mic02Icon} size={17} />
                </span>
              </motion.button>
            )}

            {/* Voice mode: X (cancel) + Checkmark (accept) */}
            {isListening && (
              <>
                <motion.button
                  title="Cancel voice input"
                  onClick={handleVoiceCancel}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ color: "var(--text3)", border: "1px solid var(--border)" }}
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ borderColor: "var(--red)", color: "var(--red)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </motion.button>
                <motion.button
                  title="Done speaking"
                  onClick={handleVoiceAccept}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "var(--accent)", color: "white" }}
                  whileTap={{ scale: 0.88 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.button>
              </>
            )}

            {/* Submit / Send / Stop — hidden during voice mode */}
            {isListening ? null : isStreaming ? (
              <button
                onClick={onStop}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150"
                style={{ background: "var(--red)", color: "white" }}
              >
                <HugeiconsIcon icon={StopCircleIcon} size={16} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150"
                style={{
                  background: canSend ? "var(--accent)" : "rgba(255,255,255,0.1)",
                  color: canSend ? "white" : "var(--text2)",
                  cursor: canSend ? "pointer" : "not-allowed",
                }}
              >
                <HugeiconsIcon icon={ArrowUp02Icon} size={17} />
              </button>
            )}
          </div>
        </div>

      </div>
    </>
  );
}

