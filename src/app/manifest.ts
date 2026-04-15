import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OpenSlide — AI Presentation Builder",
    short_name: "OpenSlide",
    description:
      "Create professional presentations and documents in seconds with AI.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#4338CA",
    icons: [
      { src: "/api/icon?size=192", sizes: "192x192", type: "image/png" },
      { src: "/api/icon?size=512", sizes: "512x512", type: "image/png" },
    ],
  };
}
