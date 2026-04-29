import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Kit",
  description:
    "Upload your company PPTX or PDF and let AI extract your brand colors, fonts, logos, and layout patterns. Every future slide, document, spreadsheet, and website ships on-brand automatically.",
};

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
