import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Apps",
  description:
    "View, manage, and open every app you've built with the AI agent.",
};

export default function WebsitesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
