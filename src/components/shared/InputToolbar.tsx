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
  PlusSignIcon,
  AppStoreIcon,
} from "@hugeicons/core-free-icons";
import { ConnectorPopover } from "@/components/shared/ConnectorPopover";
import { ConnectorModal } from "@/components/shared/ConnectorModal";
import { AttachmentPopover, TelescopeIcon } from "@/components/shared/AttachmentPopover";
import { AssetPickerModal } from "@/components/shared/AssetPickerModal";
import { Tooltip } from "@/components/shared/Tooltip";
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

type Mode = "slides" | "docs" | "sheets" | "website";

const MODES: { id: Mode; label: string; icon: React.ReactNode }[] = [
  {
    id: "slides",
    label: "Slides",
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8" />
        <path d="M12 16v4" />
      </svg>
    ),
  },
  {
    id: "docs",
    label: "Docs",
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    id: "sheets",
    label: "Sheets",
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M3 15h18" />
        <path d="M9 3v18" />
      </svg>
    ),
  },
  {
    id: "website",
    label: "App",
    icon: (
      <HugeiconsIcon icon={AppStoreIcon} size={10} strokeWidth={2} />
    ),
  },
];

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
  onSend: (message: string, options?: { deepResearch?: boolean; docsMode?: boolean; sheetsMode?: boolean; websiteMode?: boolean; discussMode?: boolean; attachments?: PendingAttachment[] }) => void;
  isStreaming?: boolean;
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  selectedTemplate?: SelectedTemplate;
  onClearTemplate?: () => void;
  animatedPlaceholder?: boolean;
  focusAnimation?: boolean;
  sessionType?: "slides" | "docs" | "sheets" | "website";
  sessionId?: string;
  /** When this object reference changes, the textarea is pre-filled with the
   *  supplied text and focused. Powers click-to-edit from the preview iframe.
   *  Pass `{ text, nonce }` where `nonce` is a counter so identical prefills
   *  still re-trigger. */
  prefill?: { text: string; nonce: number } | null;
  /** Fires whenever the active tab changes (slides/docs/sheets/website).
   *  Lets the parent react — e.g. swap the template gallery on the home page. */
  onModeChange?: (mode: "slides" | "docs" | "sheets" | "website") => void;
  /** Fires when the Build/Chat toggle changes (website mode only). */
  onChatModeChange?: (mode: "build" | "discuss") => void;
  /** Render the top tab strip (Slides / Docs / Sheets / App). Only relevant on
   *  the explore page where the user PICKS a mode. Inside an editor session
   *  the mode is locked by `sessionType`, so tabs would be redundant. */
  showModeTabs?: boolean;
  /** Optional node rendered inline in the left side of the action row, after
   *  the connector button and before the Build/Chat toggle. Used by the home
   *  page to slot in a brand-kit picker so it lives WITH the other prompt
   *  modifiers instead of floating above the bar. */
  leftAccessory?: React.ReactNode;
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
  prefill,
  onModeChange,
  onChatModeChange,
  showModeTabs = false,
  leftAccessory,
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
  const [deepResearchHovered, setDeepResearchHovered] = useState(false);

  // Reset hover state when Deep Research toggles so the pill always
  // mounts in its idle (telescope) look, not in the stale hover look.
  useEffect(() => {
    setDeepResearchHovered(false);
  }, [deepResearch]);
  const [docsMode, setDocsMode] = useState(false);
  const [sheetsMode, setSheetsMode] = useState(false);
  const [websiteMode, setWebsiteMode] = useState(false);
  const [websiteDesktopOnlyModal, setWebsiteDesktopOnlyModal] = useState(false);
  const [chatMode, setChatModeState] = useState<"build" | "discuss">("build");
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [connectorModalOpen, setConnectorModalOpen] = useState(false);
  const connectorBtnRef = useRef<HTMLButtonElement>(null);
  const [attachPopoverOpen, setAttachPopoverOpen] = useState(false);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const attachBtnRef = useRef<HTMLButtonElement>(null);

  // Lock toggles to session type — once a session is docs or has deep research, keep it on
  const isDocsLocked = sessionType === "docs";
  const effectiveDocsMode = isDocsLocked || docsMode;
  const isSheetsLocked = sessionType === "sheets";
  const effectiveSheetsMode = isSheetsLocked || sheetsMode;
  const isWebsiteLocked = sessionType === "website";
  const effectiveWebsiteMode = isWebsiteLocked || websiteMode;

  const activeMode: Mode =
    effectiveDocsMode ? "docs" :
    effectiveSheetsMode ? "sheets" :
    effectiveWebsiteMode ? "website" :
    "slides";
  const lockedMode: Mode | null = isDocsLocked ? "docs" : isSheetsLocked ? "sheets" : isWebsiteLocked ? "website" : null;

  // Notify parent whenever the derived mode changes
  useEffect(() => {
    onModeChange?.(activeMode);
  }, [activeMode, onModeChange]);

  function setChatMode(m: "build" | "discuss") {
    setChatModeState(m);
    onChatModeChange?.(m);
  }

  const [plusHovered, setPlusHovered] = useState(false);
  const [connectorsHovered, setConnectorsHovered] = useState(false);
  const [micHovered, setMicHovered] = useState(false);
  const isMobile = useIsMobile();

  function selectMode(m: Mode) {
    if (lockedMode) return;
    if (m === "website" && isMobile) { setWebsiteDesktopOnlyModal(true); return; }
    setDocsMode(m === "docs");
    setSheetsMode(m === "sheets");
    setWebsiteMode(m === "website");
    setDeepResearch(false);
  }

  // Tab-strip geometry — measured so the SVG path can be drawn with the folder-tab tail
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tabGeo, setTabGeo] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const measure = () => setTabGeo({ w: el.offsetWidth, h: el.offsetHeight });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);
  // Card geometry: w/h for SVG border glow, centerX/clipTop for blob positioning
  const [cardGeo, setCardGeo] = useState({ w: 0, h: 0, centerX: 0, clipTop: 0 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── External prefill (click-to-edit from preview iframe) ────────────
  // Watch prefill.nonce so identical repeat prefills still re-trigger.
  const lastPrefillNonceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!prefill) return;
    if (lastPrefillNonceRef.current === prefill.nonce) return;
    lastPrefillNonceRef.current = prefill.nonce;
    setValue(prefill.text);
    // Defer focus so the browser finishes its own event cycle first
    setTimeout(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      // Place cursor at end so user can immediately type the change they want
      const end = ta.value.length;
      ta.setSelectionRange(end, end);
    }, 30);
  }, [prefill]);
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
    const opts: { deepResearch?: boolean; docsMode?: boolean; sheetsMode?: boolean; websiteMode?: boolean; discussMode?: boolean; attachments?: PendingAttachment[] } = {};
    if (deepResearch) opts.deepResearch = true;
    if (effectiveDocsMode) opts.docsMode = true;
    if (effectiveSheetsMode) opts.sheetsMode = true;
    if (effectiveWebsiteMode) opts.websiteMode = true;
    if (effectiveWebsiteMode && chatMode === "discuss") opts.discussMode = true;
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

      {/* Composer: tab strip (lighter glass) sits BEHIND the card, with
          a folder-tab outward curve on the right edge that lands on the card's top.
          Matches the handoff design 1:1. */}
      <div style={{ position: "relative", textAlign: "left" }}>

      {/* ─── Tab strip (only on the explore page — in editor the mode is locked) ─── */}
      {showModeTabs && (() => {
        const W = tabGeo.w;
        const H = tabGeo.h;
        const rTop = 20;    // top corners
        const rTail = 22;   // outward folder-tab tail radius
        const overlap = 28; // card overlaps strip's lower portion (matches marginBottom: -28)
        const baseY = Math.max(0, H - overlap);
        const svgW = W + rTail;
        const svgH = H + 2;
        const pathD = W > 0 && H > 0
          ? [
              `M 0 ${H}`,
              `L 0 ${rTop}`,
              `Q 0 0 ${rTop} 0`,
              `L ${W - rTop} 0`,
              `Q ${W} 0 ${W} ${rTop}`,
              `L ${W} ${baseY - rTail}`,
              `Q ${W} ${baseY} ${W + rTail} ${baseY}`,
              `L ${W + rTail} ${H}`,
              `L 0 ${H}`,
              "Z",
            ].join(" ")
          : "";
        const strokeD = W > 0 && H > 0
          ? [
              `M 0 ${baseY}`,
              `L 0 ${rTop}`,
              `Q 0 0 ${rTop} 0`,
              `L ${W - rTop} 0`,
              `Q ${W} 0 ${W} ${rTop}`,
              `L ${W} ${baseY - rTail}`,
              `Q ${W} ${baseY} ${W + rTail} ${baseY}`,
            ].join(" ")
          : "";
        return (
          <div
            style={{
              position: "relative",
              display: "inline-block",
              marginBottom: -overlap,
              zIndex: 1, // BEHIND the card (card has zIndex: 10)
            }}
          >
            {/* Background shape — flush-left with card, right edge curves outward into card top */}
            <svg
              aria-hidden
              width={svgW}
              height={svgH}
              viewBox={`0 0 ${svgW} ${svgH}`}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                overflow: "visible",
                pointerEvents: "none",
                zIndex: 0,
                display: "block",
              }}
            >
              <defs>
                <linearGradient id="tabTopHighlight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
                  <stop offset="40%" stopColor="rgba(255,255,255,0.02)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
              </defs>
              {pathD && (
                <>
                  <path d={pathD} fill="#1E191C" />
                  <path d={pathD} fill="url(#tabTopHighlight)" />
                  {strokeD && (
                    <path
                      d={strokeD}
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </>
              )}
            </svg>

            {/* Tabs row */}
            <div
              ref={tabsRef}
              role="tablist"
              style={{
                position: "relative",
                zIndex: 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 4px 32px",
              }}
            >
              {MODES.map(({ id, label, icon }) => {
                const isActive = activeMode === id;
                const isDisabled = !!lockedMode && lockedMode !== id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    onClick={() => selectMode(id)}
                    disabled={isDisabled}
                    onMouseEnter={(e) => {
                      if (!isActive && !isDisabled) {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      }
                    }}
                    style={{
                      position: "relative",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "0 14px",
                      height: 34,
                      border: "none",
                      background: "transparent",
                      color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                      fontSize: 13.5,
                      fontWeight: 500,
                      letterSpacing: "-0.005em",
                      borderRadius: 999,
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      opacity: isDisabled ? 0.35 : 1,
                      transition: "color 240ms",
                      whiteSpace: "nowrap",
                      fontFamily: "inherit",
                    }}
                  >
                    {/* Shared layoutId pill — Framer auto-animates between tabs */}
                    {isActive && (
                      <motion.span
                        layoutId="composer-tab-pill"
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 999,
                          background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04))",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 0 0 1px rgba(255,255,255,0.05)",
                          zIndex: 0,
                        }}
                        transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
                      />
                    )}
                    <span
                      style={{
                        position: "relative",
                        zIndex: 1,
                        width: 18,
                        height: 18,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "50%",
                        background: isActive
                          ? "linear-gradient(135deg, var(--accent), var(--accent-hover))"
                          : "rgba(255,255,255,0.08)",
                        color: isActive ? "#fff" : "rgba(255,255,255,0.75)",
                        transition: "background 240ms, color 240ms",
                      }}
                    >
                      {icon}
                    </span>
                    <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

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
                initial={{ opacity: 0, marginBottom: 0 }}
                animate={{ opacity: 1, marginBottom: 10 }}
                exit={{ opacity: 0, marginBottom: 0 }}
                transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <div className="flex flex-wrap gap-2" style={{ padding: "4px 0 2px" }}>
                    {pendingAttachments.map((att) => (
                      <div
                        key={att.id}
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
                      </div>
                    ))}
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
              <Tooltip show={plusHovered && !attachPopoverOpen} label="Add files and more" />
              <motion.button
                ref={attachBtnRef}
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
                deepResearch={deepResearch}
                onToggleDeepResearch={() => {
                  setDeepResearch((p) => !p);
                  if (!isDocsLocked) setDocsMode(false);
                  setSheetsMode(false);
                }}
              />
            </div>
            <AssetPickerModal
              open={assetPickerOpen}
              onClose={() => setAssetPickerOpen(false)}
              sessionId={sessionId ?? ""}
              onAttach={handleAssetsAttached}
            />

            {/* Connectors — icon-only circular button, same interaction pattern as + */}
            <div style={{ position: "relative", marginLeft: -8 }}>
              <Tooltip show={connectorsHovered && !connectorsOpen} label="Connect apps" />
              <motion.button
                ref={connectorBtnRef}
                onClick={() => setConnectorsOpen((p) => !p)}
                onHoverStart={() => setConnectorsHovered(true)}
                onHoverEnd={() => setConnectorsHovered(false)}
                aria-label="Connectors"
                className="relative w-9 h-9 rounded-[var(--r-md)] flex items-center justify-center"
                style={{ color: connectorsHovered ? "var(--text)" : "var(--text2)" }}
                whileTap={{ scale: 0.88 }}
              >
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ background: "var(--accent)", transformOrigin: "center" }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={connectorsOpen || connectorsHovered ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                />
                <span className="relative z-10" style={{ color: connectorsOpen || connectorsHovered ? "var(--bg)" : "var(--text2)", transition: "color 0.12s", display: "inline-flex" }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" shapeRendering="geometricPrecision">
                    <path d="M9 2v6" />
                    <path d="M15 2v6" />
                    <path d="M6 8h12v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4z" />
                    <path d="M12 17v5" />
                  </svg>
                </span>
              </motion.button>
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

            {/* Optional inline accessory (e.g. brand-kit picker on home page).
                Slides-only — brand kits don't currently apply to docs / sheets
                / website mode. When/if we extend brand-kit support to docs and
                sheets, broaden this gate. */}
            {leftAccessory && !effectiveDocsMode && !effectiveSheetsMode && !effectiveWebsiteMode && (
              <div style={{ display: "inline-flex", alignItems: "center", marginLeft: 4 }}>
                {leftAccessory}
              </div>
            )}

            {/* Build / Chat toggle — website mode only */}
            <AnimatePresence initial={false}>
              {effectiveWebsiteMode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: -4 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -4 }}
                  transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 999,
                    padding: 3,
                    flexShrink: 0,
                    marginLeft: -4,
                  }}
                >
                  {(["build", "discuss"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setChatMode(m)}
                      style={{
                        position: "relative",
                        padding: "3px 10px",
                        borderRadius: 999,
                        fontSize: 12.5,
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                        color: chatMode === m ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        transition: "color 150ms",
                        whiteSpace: "nowrap",
                        fontFamily: "inherit",
                      }}
                    >
                      {chatMode === m && (
                        <motion.span
                          layoutId="chat-mode-indicator"
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.1)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
                          }}
                          transition={{ type: "spring", bounce: 0.12, duration: 0.35 }}
                        />
                      )}
                      <span style={{ position: "relative", zIndex: 1 }}>
                        {m === "build" ? "Build" : "Chat"}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Deep Research indicator — appears when ON, click to disable */}
            <AnimatePresence initial={false}>
              {deepResearch && (
                <motion.button
                  key="deep-research-active-pill"
                  type="button"
                  title="Click to disable Deep Research"
                  onClick={() => setDeepResearch(false)}
                  onMouseEnter={() => setDeepResearchHovered(true)}
                  onMouseLeave={() => setDeepResearchHovered(false)}
                  initial={{ opacity: 0, scale: 0.9, x: -6 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -6 }}
                  transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{
                    marginLeft: -6,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "6px 13px 6px 10px",
                    borderRadius: 999,
                    border: `1px solid ${deepResearchHovered ? "rgba(194,24,91,0.3)" : "transparent"}`,
                    background: deepResearchHovered ? "var(--accent-soft)" : "transparent",
                    color: "var(--accent)",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "-0.005em",
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "background 150ms, border-color 150ms",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ display: "inline-flex", width: 15, height: 15, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {deepResearchHovered ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" shapeRendering="geometricPrecision">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    ) : (
                      <TelescopeIcon color="currentColor" size={15} />
                    )}
                  </span>
                  <span>Deep research</span>
                </motion.button>
              )}
            </AnimatePresence>

            <div className="flex-1" />

            {/* Mic — normal state */}
            {!isListening && (
              <div style={{ position: "relative" }}>
                <Tooltip show={micHovered} label="Voice input" />
                <motion.button
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
                  <span className="relative z-10" style={{ color: micHovered ? "var(--bg)" : "var(--text)", transition: "color 0.12s", display: "inline-flex" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" shapeRendering="geometricPrecision" vectorEffect="non-scaling-stroke">
                      <rect x="9" y="3" width="6" height="11" rx="3" />
                      <path d="M19 11v1a7 7 0 0 1-14 0v-1" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                  </span>
                </motion.button>
              </div>
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
      </div>

      {/* Website mode: desktop-only modal (shown when mobile user taps the Website pill) */}
      {websiteDesktopOnlyModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setWebsiteDesktopOnlyModal(false)}
        >
          <div
            className="rounded-[var(--r-2xl)] p-6 max-w-sm w-full"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
              App building is desktop-only
            </div>
            <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.5, marginBottom: 20 }}>
              To build apps with AI, open OpenSlide on a desktop or laptop browser (Chrome, Edge, Arc, or Firefox). You can still view and chat on existing app sessions from your phone.
            </div>
            <button
              onClick={() => setWebsiteDesktopOnlyModal(false)}
              className="w-full rounded-[var(--r-lg)] py-2.5 text-sm font-medium"
              style={{ background: "var(--accent)", color: "white" }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

