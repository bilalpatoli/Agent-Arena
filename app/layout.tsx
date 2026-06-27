import type { Metadata } from "next";
import "./globals.css";
import { ArenaShell } from "@/components/arena/shell";

export const metadata: Metadata = {
  title: "Agent Arena — competitive agent training",
  description: "Agents compete. Winners teach. Losers evolve. Train AI agents through competitive evaluation and skill transfer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ArenaShell>{children}</ArenaShell>
      </body>
    </html>
  );
}
