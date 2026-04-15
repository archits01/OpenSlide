import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documents",
  description:
    "Create professional business documents, proposals, and reports with AI. Describe what you need and get polished output instantly.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
