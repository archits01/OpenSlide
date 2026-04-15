import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Presentations",
  description:
    "View, manage, and organize all your AI-generated presentations and pitch decks in one place.",
};

export default function PresentationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
