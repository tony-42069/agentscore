"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Shield, Zap, BarChart3, Globe, TrendingUp, Users, CheckCircle2, ExternalLink } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 grid-pattern opacity-30" />
      <div className="hero-gradient hero-gradient-1" />
      <div className="hero-gradient hero-gradient-2" />
      
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Stats Bar */}
      <StatsBar />
      
      {/* How It Works */}
      <HowItWorks />
      
      {/* Scoring Factors */}
      <ScoringFactors />
      
      {/* Trust Signals */}
      <TrustSignals />
      
      {/* CTA Section */}
      <CTASection />
      
      {/* Footer */}
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="relative z-50 border-b border-border/50 backdrop-blur-xl bg-background/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight">AgentScore</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#scoring" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Scoring
          </a>
          <a href="https://github.com/tony-42069/agentscore" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            GitHub <ExternalLink className="w-3 h-3" />
          </a>
        </nav>
        <a 
          href="#search" 
          className="glow-button text-sm text-primary-foreground"
        >
          Check Agent
        </a>
      </div>
    </header>
  );
}

function HeroSection() {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = () => {
    const trimmed = address.trim();
    if (!trimmed) {
      setError("Please enter an address");
      return;
    }
    const isBase = trimmed.startsWith("0x") && trimmed.length === 42;
    const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
    if (!isBase && !isSolana) {
      setError("Invalid address format");
      return;
    }
    setError("");
    setLoading(true);
    router.push(`/agent/${trimmed}`);
  };

  return (
    <section id="search" className="relative z-10 pt-20 pb-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm text-primary font-medium">Powered by ERC-8004 + x402</span>
        </div>
        
        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
          <span className="text-gradient">The Credit Bureau</span>
          <br />
          <span className="text-gradient-primary">for AI Agents</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-slide-up animation-delay-100">
          Get unified credit scores (300-850) for autonomous AI agents. 
          Cross-chain data from Base and Solana, powered by on-chain reputation.
        </p>
        
        {/* Search Box */}
        <div className="max-w-2xl mx-auto animate-slide-up animation-delay-200">
          <div className="glass-card p-2">
            <div className="animated-border rounded-xl">
              <div className="flex items-center gap-3 bg-background rounded-xl p-2">
                <div className="flex-1 flex items-center gap-3 px-4">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Enter Base (0x...) or Solana wallet address"
                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground py-3"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="glow-button flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Searching...</span>
                  ) : (
                    <>
                      <span>Search</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive mt-3">{error}</p>
          )}
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="chain-badge-base">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Base
            </span>
            <span className="chain-badge-solana">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Solana
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [
    { label: "Daily Transactions", value: "1M+", icon: TrendingUp },
    { label: "Active Buyers", value: "62K+", icon: Users },
    { label: "AI Agents", value: "10K+", icon: Zap },
    { label: "Total Volume", value: "$7M+", icon: BarChart3 },
  ];

  return (
    <section className="relative z-10 py-12 border-y border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={stat.label} className="text-center animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-3xl font-bold mono text-foreground mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Shield,
      title: "ERC-8004 Identity",
      description: "We verify agent identity and pull reputation scores from the on-chain identity registry.",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Globe,
      title: "x402 Transactions",
      description: "Transaction history from both Base and Solana chains measures real commercial activity.",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: BarChart3,
      title: "300-850 Score",
      description: "Our algorithm combines 7 weighted factors into a single, transparent credit score.",
      color: "from-primary to-green-400",
    },
  ];

  return (
    <section id="how-it-works" className="relative z-10 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It <span className="text-gradient-primary">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            AgentScore aggregates on-chain data to compute trust scores for AI agents
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div 
              key={step.title} 
              className="glass-card p-8 group hover:scale-[1.02] transition-transform duration-300 animate-slide-up"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <step.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScoringFactors() {
  const factors = [
    { name: "Transaction History", weight: 27, description: "Total volume processed" },
    { name: "Activity Level", weight: 18, description: "Frequency & recency" },
    { name: "Reputation Score", weight: 18, description: "ERC-8004 feedback" },
    { name: "Buyer Diversity", weight: 14, description: "Unique relationships" },
    { name: "Validation Status", weight: 9, description: "Third-party verification" },
    { name: "Longevity", weight: 9, description: "Time in ecosystem" },
    { name: "Cross-Chain", weight: 5, description: "Multi-chain presence" },
  ];

  return (
    <section id="scoring" className="relative z-10 py-24 px-6 bg-card/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Scoring <span className="text-gradient-primary">Factors</span>
          </h2>
          <p className="text-muted-foreground">
            Seven weighted factors determine every agent&apos;s credit score
          </p>
        </div>
        
        <div className="glass-card p-8">
          <div className="space-y-6">
            {factors.map((factor, i) => (
              <div 
                key={factor.name} 
                className="animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium">{factor.name}</span>
                    <span className="text-muted-foreground text-sm ml-2">— {factor.description}</span>
                  </div>
                  <span className="mono text-primary font-semibold">{factor.weight}%</span>
                </div>
                <div className="factor-bar">
                  <div 
                    className="factor-bar-fill transition-all duration-1000"
                    style={{ width: `${factor.weight * 3.7}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Score Range</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-destructive" />
                <span className="mono">300</span>
              </span>
              <span className="text-muted-foreground">to</span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span className="mono">850</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustSignals() {
  const signals = [
    "On-chain verified data",
    "Cross-chain aggregation",
    "Real-time scoring",
    "Transparent algorithms",
    "No centralized data",
    "Open source",
  ];

  return (
    <section className="relative z-10 py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {signals.map((signal, i) => (
            <div 
              key={signal}
              className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50 animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm font-medium">{signal}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative z-10 py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="glass-card p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Check an Agent?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Enter any Base or Solana wallet address to get a comprehensive credit report with full scoring breakdown.
          </p>
          <a href="#search" className="glow-button inline-flex items-center gap-2 text-primary-foreground">
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-border/50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">AgentScore</span>
            <span className="text-muted-foreground text-sm">— The Credit Bureau for AI Agents</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <a 
              href="https://eips.ethereum.org/EIPS/eip-8004" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              ERC-8004 <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="https://x402scan.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              x402scan <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="https://github.com/tony-42069/agentscore" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              GitHub <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          Built with ERC-8004 identity protocol and x402 payment protocol
        </div>
      </div>
    </footer>
  );
}
