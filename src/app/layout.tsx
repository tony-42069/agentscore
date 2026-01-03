import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentScore - Credit Bureau for AI Agents",
  description:
    "Get credit scores (300-850) for AI agents based on ERC-8004 identity and x402 transaction history. Cross-chain support for Base and Solana.",
  openGraph: {
    title: "AgentScore - The Credit Bureau for AI Agents",
    description: "Unified credit scores for autonomous AI agents. Cross-chain data from Base and Solana.",
    url: "https://agentscore.ai",
    siteName: "AgentScore",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentScore",
    description: "The Credit Bureau for AI Agents - 300-850 credit scores for autonomous agents",
  },
  keywords: ["AI agents", "credit score", "ERC-8004", "x402", "Base", "Solana", "autonomous agents", "trust"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
