"use client";

import {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

// ─── Contexts ────────────────────────────────────────────────────────────────

const InfoCardImageContext = createContext<{
  handleMediaLoad: (src: string) => void;
  setAllImagesLoaded: (loaded: boolean) => void;
}>({ handleMediaLoad: () => {}, setAllImagesLoaded: () => {} });

const InfoCardContext = createContext<{
  isHovered: boolean;
  onDismiss: () => void;
}>({ isHovered: false, onDismiss: () => {} });

// ─── Sub-components ───────────────────────────────────────────────────────────

export const InfoCardTitle = React.memo(
  ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div className={cn("font-medium mb-1", className)} {...props}>{children}</div>
  )
);
InfoCardTitle.displayName = "InfoCardTitle";

export const InfoCardDescription = React.memo(
  ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div className={cn("leading-4", className)} {...props}>{children}</div>
  )
);
InfoCardDescription.displayName = "InfoCardDescription";

export const InfoCardContent = React.memo(
  ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div className={cn("flex flex-col gap-1 text-xs", className)} {...props}>{children}</div>
  )
);
InfoCardContent.displayName = "InfoCardContent";

export const InfoCardFooter = ({ children, className }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => {
  const { isHovered } = useContext(InfoCardContext);
  return (
    <motion.div
      className={cn("flex justify-between text-xs", className)}
      initial={{ opacity: 0, height: "0px" }}
      animate={{ opacity: isHovered ? 1 : 0, height: isHovered ? "auto" : "0px" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  );
};

export const InfoCardDismiss = React.memo(
  ({ children, className, onDismiss, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; onDismiss?: () => void }) => {
    const { onDismiss: contextDismiss } = useContext(InfoCardContext);
    return (
      <div
        className={cn("cursor-pointer", className)}
        onClick={(e) => { e.preventDefault(); onDismiss?.(); contextDismiss(); }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
InfoCardDismiss.displayName = "InfoCardDismiss";

export const InfoCardAction = React.memo(
  ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div className={cn("", className)} {...props}>{children}</div>
  )
);
InfoCardAction.displayName = "InfoCardAction";

// ─── Media ───────────────────────────────────────────────────────────────────

interface MediaItem {
  type?: "image" | "video";
  src: string;
  alt?: string;
  className?: string;
}

interface InfoCardMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  media: MediaItem[];
  loading?: "eager" | "lazy";
  shrinkHeight?: number;
  expandHeight?: number;
  fadeColor?: string; // CSS color for the gradient fade (match card bg)
}

export const InfoCardMedia = ({
  media = [],
  className,
  loading,
  shrinkHeight = 75,
  expandHeight = 150,
  fadeColor = "#ffffff",
}: InfoCardMediaProps) => {
  const { isHovered } = useContext(InfoCardContext);
  const { setAllImagesLoaded } = useContext(InfoCardImageContext);
  const [isOverflowVisible, setIsOverflowVisible] = useState(false);
  const loadedMedia = useRef(new Set<string>());

  const handleMediaLoad = (src: string) => {
    loadedMedia.current.add(src);
    if (loadedMedia.current.size === Math.min(3, media.slice(0, 3).length)) {
      setAllImagesLoaded(true);
    }
  };

  const displayMedia = useMemo(() => media.slice(0, 3), [media]);
  const mediaCount = displayMedia.length;

  useEffect(() => {
    if (media.length > 0) {
      setAllImagesLoaded(false);
      loadedMedia.current.clear();
    } else {
      setAllImagesLoaded(true);
    }
  }, [media.length, setAllImagesLoaded]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (isHovered) t = setTimeout(() => setIsOverflowVisible(true), 100);
    else setIsOverflowVisible(false);
    return () => clearTimeout(t);
  }, [isHovered]);

  const getRotation = (i: number) => (!isHovered || mediaCount === 1) ? 0 : (i - (mediaCount === 2 ? 0.5 : 1)) * 5;
  const getTranslateX = (i: number) => (!isHovered || mediaCount === 1) ? 0 : (i - (mediaCount === 2 ? 0.5 : 1)) * 20;
  const getTranslateY = (i: number) => {
    if (!isHovered) return 0;
    if (mediaCount === 1) return -5;
    return i === 0 ? -10 : i === 1 ? -5 : 0;
  };
  const getScale = (i: number) => (!isHovered) ? 1 : mediaCount === 1 ? 1 : 0.95 + i * 0.02;

  return (
    <InfoCardImageContext.Provider value={{ handleMediaLoad, setAllImagesLoaded }}>
      <motion.div
        className={cn("relative mt-2 rounded-md", className)}
        animate={{ height: media.length > 0 ? (isHovered ? expandHeight : shrinkHeight) : "auto" }}
        style={{ overflow: isOverflowVisible ? "visible" : "hidden" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="relative" style={{ height: shrinkHeight }}>
          {displayMedia.map((item, i) => (
            <motion.div
              key={item.src}
              className="absolute w-full"
              animate={{
                rotateZ: getRotation(i),
                x: getTranslateX(i),
                y: getTranslateY(i),
                scale: getScale(i),
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {item.type === "video" ? (
                <video
                  src={item.src}
                  className={cn("w-full rounded-md border object-cover shadow-lg", item.className)}
                  style={{ borderColor: "var(--border)" }}
                  onLoadedData={() => handleMediaLoad(item.src)}
                  preload="metadata"
                  muted
                  playsInline
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.src}
                  alt={item.alt ?? ""}
                  className={cn("w-full rounded-md border object-cover shadow-lg", item.className)}
                  style={{ borderColor: "var(--border)" }}
                  onLoad={() => handleMediaLoad(item.src)}
                  loading={loading}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Fade gradient — color matches card background */}
        <motion.div
          className="absolute right-0 bottom-0 left-0 h-10"
          style={{
            background: `linear-gradient(to bottom, transparent, ${fadeColor})`,
          }}
          animate={{ opacity: isHovered ? 0 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </motion.div>
    </InfoCardImageContext.Provider>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

interface InfoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  storageKey?: string;
  dismissType?: "once" | "forever";
}

export function InfoCard({
  children,
  className,
  storageKey,
  dismissType = "once",
}: InfoCardProps) {
  if (dismissType === "forever" && !storageKey) {
    throw new Error('storageKey is required when dismissType="forever"');
  }

  const [isHovered, setIsHovered] = useState(false);
  const [, setAllImagesLoaded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined" || dismissType === "once") return false;
    return localStorage.getItem(storageKey!) === "dismissed";
  });

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    if (dismissType === "forever") localStorage.setItem(storageKey!, "dismissed");
  }, [storageKey, dismissType]);

  const imageCtx = useMemo(() => ({ handleMediaLoad: () => {}, setAllImagesLoaded }), [setAllImagesLoaded]);
  const cardCtx = useMemo(() => ({ isHovered, onDismiss: handleDismiss }), [isHovered, handleDismiss]);

  return (
    <InfoCardContext.Provider value={cardCtx}>
      <InfoCardImageContext.Provider value={imageCtx}>
        <AnimatePresence>
          {!isDismissed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3 }}
              className={cn("group rounded-[var(--r-lg)] p-3", className)}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </InfoCardImageContext.Provider>
    </InfoCardContext.Provider>
  );
}
