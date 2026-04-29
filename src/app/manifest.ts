import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OpenSlide — Your All-in-One AI Workspace",
    short_name: "OpenSlide",
    description:
      "The all-in-one AI workspace for slides, documents, spreadsheets, and websites. Generate on-brand work from a single prompt.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#C2185B",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
