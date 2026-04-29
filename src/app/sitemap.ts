import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.tryopenslide.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    // Home — primary entry point
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1.0 },

    // Mode landing pages — equal weight, all four supported formats
    { url: `${baseUrl}/presentations`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/docs`,          lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/sheets`,        lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/websites`,      lastModified: now, changeFrequency: "weekly", priority: 0.8 },

    // Brand kit — feature differentiator
    { url: `${baseUrl}/brand`,         lastModified: now, changeFrequency: "monthly", priority: 0.7 },

    // Library / about
    { url: `${baseUrl}/assets`,        lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/about`,         lastModified: now, changeFrequency: "monthly", priority: 0.5 },

    // Legal — discoverable but low priority
    { url: `${baseUrl}/privacy`,        lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/terms`,          lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/cookie-policy`,  lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/refund-policy`,  lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/gdpr`,           lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
