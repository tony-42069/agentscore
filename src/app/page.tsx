"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { ArrowRight, ArrowUpRight, Search } from "lucide-react";

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }
  }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 1, ease: [0.25, 0.4, 0.25, 1] }
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
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }
  }
};

export default function HomePage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <main ref={containerRef} className="relative bg-background overflow-hidden">
      {/* Noise texture overlay */}
      <div className="noise" />
      
      {/* Ambient orbs */}
      <div className="orb orb-gold w-[800px] h-[800px] -top-[400px] -right-[300px] animate-pulse-subtle" />
      <div className="orb orb-warm w-[600px] h-[600px] top-[50%] -left-[300px] animate-pulse-subtle" style={{ animationDelay: '-4s' }} />
      
      {/* Header */}
      <Header />
      
      {/* Hero */}
      <Hero scrollProgress={scrollYProgress} />
      
      {/* Elegant divider */}
      <div className="elegant-line max-w-4xl mx-auto" />
      
      {/* Metrics */}
      <Metrics />
      
      {/* How it works */}
      <HowItWorks />
      
      {/* Scoring */}
      <Scoring />
      
      {/* CTA */}
      <CallToAction />
      
      {/* Footer */}
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/60 border-b border-border/30"
    >
      <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <span className="font-display text-sm text-primary-foreground font-semibold">A</span>
          </div>
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
    <section id="search" className="relative min-h-screen flex flex-col justify-center pt-32 pb-24 px-8">
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
            className="block italic text-primary"
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
            className="w-px h-16 bg-gradient-to-b from-transparent via-muted-foreground/30 to-transparent"
          />
        </motion.div>
      </motion.div>
    </section>
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

function SearchBox() {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
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
    router.push(`/agent/${trimmed}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.4 }}
      className="max-w-2xl mx-auto"
    >
      <div className={`premium-card rounded-2xl p-2 transition-all duration-500 ${focused ? 'ring-1 ring-primary/30' : ''}`}>
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="luxe-button rounded-xl flex items-center gap-3"
          >
            <span>Search</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
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
    <section ref={ref} className="py-32 px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4"
        >
          {metrics.map((metric, i) => (
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
    <section id="methodology" ref={ref} className="py-32 px-8 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4 font-body">
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
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              variants={fadeUp}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
              className="premium-card rounded-2xl p-8 group"
            >
              <div className="flex items-start justify-between mb-8">
                <span className="font-display text-5xl text-muted-foreground/20 group-hover:text-primary/30 transition-colors">
                  {step.number}
                </span>
                <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground px-3 py-1 rounded-full border border-border">
                  {step.protocol}
                </span>
              </div>
              <h3 className="font-display text-2xl mb-4">
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
    <section id="scoring" ref={ref} className="py-32 px-8 bg-card/30 relative grain">
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4 font-body">
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
          className="premium-card rounded-2xl p-8 md:p-12"
        >
          <div className="space-y-6">
            {factors.map((factor, i) => (
              <motion.div
                key={factor.name}
                variants={fadeUp}
                className="flex items-center justify-between py-4 border-b border-border/50 last:border-0"
              >
                <span className="font-body text-foreground">{factor.name}</span>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isInView ? { width: `${factor.weight * 3.7}%` } : {}}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: [0.25, 0.4, 0.25, 1] }}
                      className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                    />
                  </div>
                  <span className="font-display text-lg w-12 text-right tabular-nums text-muted-foreground">
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
    <section ref={ref} className="py-32 px-8">
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

function Footer() {
  return (
    <footer className="border-t border-border/30 py-16 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="font-display text-sm text-primary-foreground font-semibold">A</span>
              </div>
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
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 link-underline"
            >
              ERC-8004
              <ArrowUpRight className="w-3 h-3" />
            </a>
            <a 
              href="https://x402scan.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 link-underline"
            >
              x402scan
              <ArrowUpRight className="w-3 h-3" />
            </a>
            <a 
              href="https://github.com/tony-42069/agentscore" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 link-underline"
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
