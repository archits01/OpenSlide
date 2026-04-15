import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Kit",
  description:
    "Upload your company PPTX template and let AI extract your brand colors, fonts, and logos. Every future presentation matches your brand guidelines automatically.",
};

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
