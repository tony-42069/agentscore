import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgentScore - Credit Bureau for AI Agents",
  description:
    "Get credit scores for AI agents based on their ERC-8004 identity and x402 transaction history. Cross-chain support for Base and Solana.",
  openGraph: {
    title: "AgentScore",
    description: "The Credit Bureau for AI Agents",
    url: "https://agentscore.ai",
    siteName: "AgentScore",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentScore",
    description: "The Credit Bureau for AI Agents",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
