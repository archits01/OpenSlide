"use client";

import { motion } from "framer-motion";

export function ShiningText({ text }: { text: string }) {
  return (
    <motion.span
      style={{
        display: "inline-block",
        background: "linear-gradient(110deg, #9ca3af 35%, #111111 50%, #9ca3af 75%, #9ca3af 100%)",
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        fontSize: 13,
        fontWeight: 500,
      }}
      initial={{ backgroundPosition: "200% 0" }}
      animate={{ backgroundPosition: "-200% 0" }}
      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
    >
      {text}
    </motion.span>
  );
}
