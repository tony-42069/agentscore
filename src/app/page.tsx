"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { ArrowRight, ArrowUpRight, Search, ChevronDown } from "lucide-react";

// Hook for recent searches
function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('agentScore_recentSearches');
    if (saved) {
      try {
        setSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches');
      }
    }
  }, []);

  const addSearch = (address: string) => {
    setSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== address.toLowerCase());
      const updated = [address, ...filtered].slice(0, 5);
      localStorage.setItem('agentScore_recentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  const clearSearches = () => {
    setSearches([]);
    localStorage.removeItem('agentScore_recentSearches');
  };

  return { searches, addSearch, clearSearches, mounted };
}

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" as const }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

const letterAnimation = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const }
  }
};

// Floating data component
function FloatingData() {
  const dataStrings = [
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    "score: 847 | grade: A+",
    "tx_count: 15,847",
    "volume: $2.4M",
    "reputation: 98.7%",
    "7Kz4KZmPGHjZqBhsLnVzKqT8vXMhKGt4dKcH5hE9jFmN",
    "validation: PASSED",
    "cross_chain: true",
    "buyers: 1,247",
    "active: 847 days",
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {dataStrings.map((str, i) => (
        <motion.div
          key={i}
          initial={{ y: "100vh", x: `${10 + (i * 8)}%`, opacity: 0 }}
          animate={{ 
            y: "-100vh", 
            opacity: [0, 0.15, 0.15, 0],
          }}
          transition={{
            duration: 20 + (i * 2),
            repeat: Infinity,
            delay: i * 3,
            ease: "linear"
          }}
          className="absolute font-mono text-xs text-primary/20 whitespace-nowrap"
          style={{ left: `${5 + (i * 9)}%` }}
        >
          {str}
        </motion.div>
      ))}
    </div>
  );
}

// Animated grid background
function AnimatedGrid() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 20%, hsl(237 91% 55% / 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 80%, hsl(270 80% 50% / 0.05) 0%, transparent 50%)
          `
        }}
      />
    </div>
  );
}

export default function HomePage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <main ref={containerRef} className="relative bg-background overflow-hidden">
      {/* Background layers */}
      <AnimatedGrid />
      <FloatingData />
      
      {/* Noise texture overlay */}
      <div className="noise" />
      
      {/* Ambient orbs */}
      <div className="orb orb-blue w-[800px] h-[800px] -top-[400px] -right-[300px] animate-pulse-subtle" />
      <div className="orb orb-purple w-[600px] h-[600px] top-[40%] -left-[300px] animate-pulse-subtle" style={{ animationDelay: '-4s' }} />
      <div className="orb orb-cyan w-[400px] h-[400px] bottom-[20%] right-[10%] animate-pulse-subtle" style={{ animationDelay: '-8s' }} />
      
      {/* Header */}
      <Header />
      
      {/* Hero */}
      <Hero scrollProgress={scrollYProgress} />
      
      {/* Elegant divider */}
      <div className="elegant-line max-w-4xl mx-auto relative z-10" />
      
      {/* Metrics */}
      <Metrics />
      
      {/* How it works */}
      <HowItWorks />
      
      {/* Scoring */}
      <Scoring />
      
      {/* Logo Cloud */}
      <LogoCloud />
      
      {/* FAQ */}
      <FAQ />
      
      {/* CTA */}
      <CallToAction />

      {/* API Promo */}
      <APIPromo />
      
      {/* Footer */}
      <Footer />
    </main>
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'backdrop-blur-xl bg-background/80 border-b border-border/50' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 group">
          <Image 
            src="/agentscore-logo.png" 
            alt="AgentScore" 
            width={32} 
            height={32} 
            className="rounded-lg shadow-lg shadow-primary/20"
          />
          <span className="font-display text-lg tracking-wide">AgentScore</span>
        </a>
        
        <nav className="hidden md:flex items-center gap-10">
          <a href="#methodology" className="text-sm text-muted-foreground hover:text-foreground transition-colors link-underline">
            Methodology
          </a>
          <a href="#scoring" className="text-sm text-muted-foreground hover:text-foreground transition-colors link-underline">
            Scoring
          </a>
          <a 
            href="https://github.com/tony-42069/agentscore" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 link-underline"
          >
            GitHub
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </nav>

        <a href="#search" className="outline-button rounded-full hidden sm:block">
          <span>Check Agent</span>
        </a>
      </div>
    </motion.header>
  );
}

function Hero({ scrollProgress }: { scrollProgress: any }) {
  const y = useTransform(scrollProgress, [0, 0.3], [0, -100]);
  const opacity = useTransform(scrollProgress, [0, 0.2], [1, 0]);

  return (
    <section id="search" className="relative min-h-screen flex flex-col justify-center pt-32 pb-24 px-8 z-10">
      <motion.div 
        style={{ y, opacity }}
        className="max-w-5xl mx-auto text-center"
      >
        {/* Overline */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-8 font-body"
        >
          Introducing
        </motion.p>

        {/* Main headline - animated letters */}
        <motion.h1 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="font-display text-6xl md:text-8xl lg:text-9xl font-normal tracking-tight mb-6 leading-[0.9]"
        >
          <AnimatedText text="The Credit" className="block" />
          <AnimatedText text="Bureau for" className="block text-muted-foreground/60" delay={0.3} />
          <motion.span 
            variants={letterAnimation}
            className="block italic text-primary glow-text"
          >
            AI Agents
          </motion.span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-16 leading-relaxed"
        >
          Unified credit scores for autonomous agents. 
          Cross-chain reputation data from <span className="text-foreground">Base</span> and <span className="text-foreground">Solana</span>, 
          powered by on-chain identity.
        </motion.p>

        {/* Search */}
        <SearchBox />

        {/* Sample Addresses */}
        <SampleAddresses />

        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div 
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-16 bg-gradient-to-b from-transparent via-primary/50 to-transparent"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

function SampleAddresses() {
  const samples = [
    { 
      label: "Example Base Agent", 
      address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      chain: "base" as const
    },
    { 
      label: "Example Solana Agent", 
      address: "7Kz4KZmPGHjZqBhsLnVzKqT8vXMhKGt4dKcH5hE9jFmN",
      chain: "solana" as const
    },
  ];

  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2 }}
      className="mt-8"
    >
      <p className="text-xs text-muted-foreground mb-3 text-center">Try with a sample address</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {samples.map((sample) => (
          <motion.button
            key={sample.address}
            onClick={() => router.push(`/agent/${sample.address}`)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/70 hover:bg-secondary border border-border/60 text-sm transition-colors group shadow-sm"
          >
            <span className={`w-2 h-2 rounded-full ${sample.chain === 'base' ? 'bg-blue-400' : 'bg-purple-400'}`} />
            <span className="text-muted-foreground group-hover:text-foreground">{sample.label}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function AnimatedText({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");
  
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={letterAnimation}
          custom={i}
          className="inline-block mr-[0.25em]"
          style={{ transitionDelay: `${delay + i * 0.05}s` }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

function RecentSearches({ 
  searches, 
  onSelect, 
  onClear 
}: { 
  searches: string[]; 
  onSelect: (address: string) => void;
  onClear: () => void;
}) {
  if (searches.length === 0) return null;

  const getChainIcon = (address: string) => {
    if (address.startsWith("0x")) {
      return <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />;
    }
    return <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />;
  };

  const truncate = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 pt-4 border-t border-border/30"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">Recent searches</span>
        <button 
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.map((address) => (
          <motion.button
            key={address}
            onClick={() => onSelect(address)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/60 hover:bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors border border-border/40"
          >
            {getChainIcon(address)}
            <span>{truncate(address)}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function SearchBox() {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { searches, addSearch, clearSearches, mounted } = useRecentSearches();

  const handleSearch = async () => {
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
    setIsLoading(true);
    addSearch(trimmed);
    router.push(`/agent/${trimmed}`);
  };

  const handleSelectRecent = (addr: string) => {
    setAddress(addr);
    addSearch(addr);
    router.push(`/agent/${addr}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.4 }}
      className="max-w-2xl mx-auto"
    >
      <div className={`premium-card rounded-2xl p-2 transition-all duration-500 ${
        focused ? 'ring-2 ring-primary/40 shadow-lg shadow-primary/10' : ''
      }`}>
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-4 px-6">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={address}
              onChange={(e) => { setAddress(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Enter wallet address..."
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 py-4 font-body text-base"
            />
          </div>
          <motion.button
            onClick={handleSearch}
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className="luxe-button rounded-xl flex items-center gap-3 disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
        
        {/* Recent Searches */}
        {mounted && (
          <RecentSearches 
            searches={searches} 
            onSelect={handleSelectRecent}
            onClear={clearSearches}
          />
        )}
      </div>
      
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-destructive mt-4 text-center"
        >
          {error}
        </motion.p>
      )}
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground"
      >
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Base
        </span>
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          Solana
        </span>
      </motion.div>
    </motion.div>
  );
}

function Metrics() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const metrics = [
    { value: "61M+", label: "Transactions", sublabel: "30-day volume" },
    { value: "$7.2M", label: "Total Volume", sublabel: "USD processed" },
    { value: "62K+", label: "Active Buyers", sublabel: "Unique addresses" },
    { value: "10K+", label: "AI Agents", sublabel: "Scored & indexed" },
  ];

  return (
    <section ref={ref} className="py-32 px-8 relative z-10 section-decorated">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4"
        >
          {metrics.map((metric) => (
            <motion.div 
              key={metric.label}
              variants={fadeUp}
              className="text-center md:text-left p-6"
            >
              <p className="font-display text-4xl md:text-5xl text-foreground mb-2 tabular-nums">
                {metric.value}
              </p>
              <p className="font-body text-sm text-foreground tracking-wide uppercase mb-1">
                {metric.label}
              </p>
              <p className="font-body text-xs text-muted-foreground">
                {metric.sublabel}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      number: "01",
      title: "Identity Verification",
      description: "We query the ERC-8004 registries to verify agent identity, pull reputation scores, and validate third-party attestations.",
      protocol: "ERC-8004"
    },
    {
      number: "02", 
      title: "Transaction Analysis",
      description: "Cross-chain transaction history from x402 protocol measures real commercial activity across Base and Solana networks.",
      protocol: "x402"
    },
    {
      number: "03",
      title: "Score Computation",
      description: "Seven weighted factors combine into a single 300-850 credit score with transparent breakdown and reason codes.",
      protocol: "Algorithm"
    }
  ];

  return (
    <section id="methodology" ref={ref} className="py-32 px-8 relative z-10">
      {/* Background decoration */}
      <div className="absolute inset-0 dot-pattern opacity-30" />
      
      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-primary mb-4 font-body">
            Methodology
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-normal">
            How we calculate<br />
            <span className="italic text-muted-foreground/60">trust scores</span>
          </h2>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-3 gap-8"
        >
          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={fadeUp}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="rounded-2xl p-8 group bg-card/80 border border-border/60 shadow-lg shadow-black/20 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between mb-8">
                <span className="font-display text-5xl text-muted-foreground/20 group-hover:text-primary/40 transition-colors duration-500">
                  {step.number}
                </span>
                <span className="text-xs tracking-[0.2em] uppercase text-primary/70 px-3 py-1 rounded-full border border-primary/30 bg-primary/5">
                  {step.protocol}
                </span>
              </div>
              <h3 className="font-display text-2xl mb-4 group-hover:text-primary transition-colors duration-500">
                {step.title}
              </h3>
              <p className="font-body text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Scoring() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const factors = [
    { name: "Transaction History", weight: 27 },
    { name: "Activity Level", weight: 18 },
    { name: "Reputation Score", weight: 18 },
    { name: "Buyer Diversity", weight: 14 },
    { name: "Validation Status", weight: 9 },
    { name: "Account Longevity", weight: 9 },
    { name: "Cross-Chain Presence", weight: 5 },
  ];

  return (
    <section id="scoring" ref={ref} className="py-32 px-8 relative z-10">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/50 to-transparent" />
      <div className="absolute inset-0 circuit-pattern opacity-30" />
      
      <div className="max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-primary mb-4 font-body">
            Scoring Model
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-normal mb-6">
            Seven factors,<br />
            <span className="italic text-primary">one score</span>
          </h2>
          <p className="font-body text-muted-foreground max-w-xl mx-auto">
            Our algorithm weighs multiple dimensions of agent behavior 
            to compute a comprehensive trust score.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="rounded-2xl p-8 md:p-12 bg-card/80 border border-border/60 shadow-lg shadow-black/20 backdrop-blur-sm"
        >
          <div className="space-y-6">
            {factors.map((factor, i) => (
              <motion.div
                key={factor.name}
                variants={fadeUp}
                className="flex items-center justify-between py-4 border-b border-border/50 last:border-0 group"
              >
                <span className="font-body text-foreground group-hover:text-primary transition-colors">{factor.name}</span>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isInView ? { width: `${factor.weight * 3.7}%` } : {}}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: "easeOut" as const }}
                      className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full shadow-sm shadow-primary/50"
                    />
                  </div>
                  <span className="font-display text-lg w-12 text-right tabular-nums text-muted-foreground group-hover:text-primary transition-colors">
                    {factor.weight}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-border/50 flex items-center justify-between">
            <span className="font-body text-sm text-muted-foreground">Score Range</span>
            <div className="flex items-center gap-8">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-destructive" />
                <span className="font-display text-lg">300</span>
              </span>
              <span className="text-muted-foreground">—</span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="font-display text-lg">850</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CallToAction() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-32 px-8 relative z-10 section-decorated">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="max-w-3xl mx-auto text-center"
      >
        <h2 className="font-display text-4xl md:text-6xl font-normal mb-6">
          Ready to verify<br />
          <span className="italic text-muted-foreground/60">an agent?</span>
        </h2>
        <p className="font-body text-lg text-muted-foreground mb-12 max-w-xl mx-auto">
          Enter any Base or Solana wallet address to receive a comprehensive 
          credit report with full scoring breakdown.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.a
            href="#search"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="luxe-button rounded-full flex items-center gap-3"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </motion.a>
          <a
            href="https://github.com/tony-42069/agentscore"
            target="_blank"
            rel="noopener noreferrer"
            className="outline-button rounded-full flex items-center gap-2"
          >
            <span>View Source</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </motion.div>
    </section>
  );
}

function APIPromo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    "Real-time score lookups",
    "Full credit reports",
    "Batch processing",
    "Webhook notifications"
  ];

  return (
    <section ref={ref} className="py-32 px-8 relative z-10 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="max-w-5xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="premium-card rounded-3xl p-8 md:p-12 relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm tracking-[0.3em] uppercase text-primary mb-4 font-body">
                For Developers
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-normal mb-4">
                Build with our <span className="italic text-primary">API</span>
              </h2>
              <p className="font-body text-muted-foreground mb-8 leading-relaxed">
                Integrate AgentScore into your application or protocol. Query agent scores, 
                get full credit reports, and receive webhook notifications when scores change.
              </p>
              <div className="flex flex-wrap gap-4">
                <motion.a
                  href="https://github.com/tony-42069/agentscore#readme"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="luxe-button rounded-full flex items-center gap-2"
                >
                  <span>View on GitHub</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.a>
                <a
                  href="https://github.com/tony-42069/agentscore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="outline-button rounded-full flex items-center gap-2"
                >
                  <span>GitHub</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            
            <div className="space-y-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/30"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <span className="font-body text-foreground">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function LogoCloud() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const protocols = [
    { name: "ERC-8004", description: "Identity Protocol", color: "from-blue-500/20 to-cyan-500/20" },
    { name: "x402", description: "Payment Protocol", color: "from-purple-500/20 to-pink-500/20" },
    { name: "Base", description: "L2 Network", color: "from-blue-600/20 to-indigo-500/20" },
    { name: "Solana", description: "L1 Network", color: "from-purple-600/20 to-violet-500/20" },
  ];

  return (
    <section ref={ref} className="py-20 px-8 relative z-10">
      <div className="max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-center text-sm text-muted-foreground mb-10 tracking-wide uppercase"
        >
          Powered by leading protocols
        </motion.p>
        
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {protocols.map((protocol) => (
            <motion.div
              key={protocol.name}
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`p-6 rounded-xl bg-gradient-to-br ${protocol.color} border border-border/50 backdrop-blur-sm shadow-lg shadow-black/20`}
            >
              <p className="font-display text-lg text-foreground mb-1">{protocol.name}</p>
              <p className="text-xs text-muted-foreground">{protocol.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is AgentScore?",
      answer: "AgentScore is a credit bureau for AI agents, providing unified credit scores (300-850) based on on-chain transaction history, reputation data, and validation attestations across Base and Solana networks."
    },
    {
      question: "How is the score calculated?",
      answer: "Our algorithm analyzes seven weighted factors: Transaction History (27%), Activity Level (18%), Reputation Score (18%), Buyer Diversity (14%), Validation Status (9%), Account Longevity (9%), and Cross-Chain Presence (5%)."
    },
    {
      question: "What data sources do you use?",
      answer: "We aggregate data from ERC-8004 identity registries, x402 payment protocol transactions, and on-chain reputation systems. This includes cross-chain activity from both Base and Solana networks."
    },
    {
      question: "Is my agent's data private?",
      answer: "All data we use is publicly available on-chain. We only aggregate and analyze transaction patterns and reputation data that is already publicly accessible. No private information is collected or stored."
    },
    {
      question: "How can I improve my agent's score?",
      answer: "Maintain consistent transaction activity, build a diverse buyer base, ensure high uptime and success rates, and seek validation from reputable third parties. Longevity and cross-chain presence also positively impact scores."
    },
    {
      question: "Can I use AgentScore data in my application?",
      answer: "Yes! We offer a public API for querying agent scores and reports. Check out our GitHub repository for API documentation and integration examples."
    }
  ];

  return (
    <section ref={ref} className="py-32 px-8 relative z-10">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-primary mb-4 font-body">
            FAQ
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-normal">
            Common <span className="italic text-muted-foreground/60">questions</span>
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="space-y-4"
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              variants={fadeUp}
              className="rounded-xl overflow-hidden bg-card/80 border border-border/60 shadow-lg shadow-black/20"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-secondary/30 transition-colors"
              >
                <span className="font-body text-foreground pr-4">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </motion.div>
              </button>
              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? "auto" : 0,
                  opacity: openIndex === index ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="px-6 pb-6 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/30 py-16 px-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image 
                src="/agentscore-logo.png" 
                alt="AgentScore" 
                width={32} 
                height={32} 
                className="rounded-lg shadow-lg shadow-primary/20"
              />
              <span className="font-display text-lg">AgentScore</span>
            </div>
            <p className="text-sm text-muted-foreground font-body">
              The credit bureau for autonomous AI agents.
            </p>
          </div>

          <div className="flex items-center gap-10 text-sm font-body">
            <a 
              href="https://eips.ethereum.org/EIPS/eip-8004" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 link-underline"
            >
              ERC-8004
              <ArrowUpRight className="w-3 h-3" />
            </a>
            <a 
              href="https://x402scan.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 link-underline"
            >
              x402scan
              <ArrowUpRight className="w-3 h-3" />
            </a>
            <a 
              href="https://github.com/tony-42069/agentscore" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 link-underline"
            >
              GitHub
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="elegant-line my-10" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-body">
          <p>Built on ERC-8004 identity protocol and x402 payment protocol</p>
          <p>© 2025 AgentScore</p>
        </div>
      </div>
    </footer>
  );
}
