import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentScore — The Credit Bureau for AI Agents",
  description:
    "Unified credit scores (300-850) for autonomous AI agents. Cross-chain reputation data from Base and Solana, powered by ERC-8004 identity and x402 transactions.",
  openGraph: {
    title: "AgentScore — The Credit Bureau for AI Agents",
    description: "Unified credit scores for autonomous AI agents. Cross-chain data from Base and Solana.",
    url: "https://agentscore.ai",
    siteName: "AgentScore",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentScore",
    description: "The Credit Bureau for AI Agents — 300-850 credit scores for autonomous agents",
  },
  keywords: ["AI agents", "credit score", "ERC-8004", "x402", "Base", "Solana", "autonomous agents", "trust", "reputation"],
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
        <link 
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
