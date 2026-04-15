import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.tryopenslide.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),

  title: {
    default: "OpenSlide — AI Presentation & Document Builder",
    template: "%s | OpenSlide",
  },

  description:
    "Create professional presentations and documents in seconds with AI. Describe what you need — get polished slides instantly. Free to start.",

  keywords: [
    "ai presentation maker",
    "ai slide generator",
    "ai pitch deck builder",
    "ai powerpoint generator",
    "presentation ai tool",
    "ai deck builder",
    "startup pitch deck maker",
    "business proposal generator",
    "ai document builder",
    "automatic slide creator",
    "openslide",
    "ai pptx maker",
    "presentation design ai",
    "slide deck ai",
  ],

  authors: [{ name: "OpenSlide Team", url: baseUrl }],
  creator: "OpenSlide",
  publisher: "OpenSlide",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "OpenSlide",
    title: "OpenSlide — AI Presentation & Document Builder",
    description:
      "Create professional presentations and documents in seconds with AI. Describe what you need — get polished slides instantly.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },

  twitter: {
    card: "summary_large_image",
    title: "OpenSlide — AI Presentation & Document Builder",
    description:
      "Create professional presentations and documents in seconds with AI. Free to start.",
    creator: "@openslideai",
    images: ["/og-image.png"],
  },

  alternates: {
    canonical: baseUrl,
  },

  category: "Technology",
};

// ─── Structured Data (JSON-LD) ──────────────────────────────────────────────

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "OpenSlide",
  url: baseUrl,
  description:
    "AI-powered presentation, pitch deck, and document builder. Describe what you need — get polished slides in seconds.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${baseUrl}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "OpenSlide",
  url: baseUrl,
  logo: `${baseUrl}/api/icon?size=512`,
  sameAs: [
    "https://twitter.com/openslideai",
    "https://www.linkedin.com/company/openslide",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Support",
    url: `${baseUrl}/contact`,
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "OpenSlide",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: baseUrl,
  description:
    "AI-powered tool that creates professional presentations, pitch decks, and business documents from natural language descriptions.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free tier with 150 credits included",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "120",
    bestRating: "5",
  },
  featureList: [
    "AI slide generation from text prompts",
    "Professional pitch deck templates",
    "PDF and PPTX export",
    "Brand kit extraction from PPTX",
    "Real-time collaborative editing",
    "Web research integration",
    "Multiple design themes",
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does OpenSlide create presentations?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OpenSlide uses AI to transform your text descriptions into professional slide decks. Simply describe what you need — topic, audience, style — and the AI generates a complete presentation with proper layout, design, and content structure.",
      },
    },
    {
      "@type": "Question",
      name: "Can I export my presentations as PPTX or PDF?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. OpenSlide supports both PDF and PPTX export. PDF exports are vector-based with selectable text. PPTX exports are pixel-perfect images per slide for maximum compatibility.",
      },
    },
    {
      "@type": "Question",
      name: "Is OpenSlide free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, every new account gets 150 free credits. A typical presentation costs about 50-75 credits. You can purchase additional credit packs starting from ₹2,499 for 500 credits.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use my company branding?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Upload your company's PPTX template and OpenSlide automatically extracts your brand colors, fonts, logos, and layout patterns. All future presentations will match your brand guidelines.",
      },
    },
  ],
};

// ─── Layout ─────────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body>
        <AppShell>{children}</AppShell>
        <Toaster position="top-center" expand={false} visibleToasts={3} />
        <Analytics />

        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </body>
    </html>
  );
}
