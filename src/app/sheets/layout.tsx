import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spreadsheets",
  description:
    "Create professional spreadsheets, financial models, and data analysis with AI. Describe what you need and get polished output instantly.",
};

export default function SheetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
