# Frontend Specification

## Overview

The AgentScore frontend is a Next.js 14 application using the App Router, Tailwind CSS, and shadcn/ui components.

## Design System

### Colors

```css
/* tailwind.config.ts */
colors: {
  // Score colors
  score: {
    excellent: '#22c55e',  // green-500
    veryGood: '#84cc16',   // lime-500
    good: '#eab308',       // yellow-500
    fair: '#f97316',       // orange-500
    poor: '#ef4444',       // red-500
  },
  // Brand
  brand: {
    primary: '#3b82f6',    // blue-500
    secondary: '#8b5cf6',  // violet-500
  },
}
```

### Typography

```css
/* Use Inter font */
font-family: 'Inter', system-ui, sans-serif;

/* Score display */
.score-number {
  font-size: 4rem;      /* 64px */
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* Grade label */
.grade-label {
  font-size: 1.5rem;    /* 24px */
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### Dark Theme

The app uses a dark theme by default:

```css
:root {
  --background: 10 10 10;     /* #0a0a0a */
  --foreground: 250 250 250;  /* #fafafa */
  --card: 23 23 23;           /* #171717 */
  --border: 38 38 38;         /* #262626 */
}
```

## Pages

### 1. Landing Page (`src/app/page.tsx`)

**Purpose:** Hero section + search bar + featured agents

**Layout:**
```
┌────────────────────────────────────────────────────┐
│                     HEADER                         │
│  Logo                              [Get API Key]   │
├────────────────────────────────────────────────────┤
│                                                    │
│                   AgentScore                       │
│         The Credit Bureau for AI Agents            │
│                                                    │
│     ┌────────────────────────────────────┐        │
│     │ 🔍 Enter wallet address...         │        │
│     └────────────────────────────────────┘        │
│                                                    │
│           Search by Base or Solana address         │
│                                                    │
├────────────────────────────────────────────────────┤
│                  HOW IT WORKS                      │
│                                                    │
│  [ERC-8004]    [x402 Data]    [Score]             │
│   Identity      Transactions   300-850            │
│   + Reputation  Base + Solana  Credit Score       │
│                                                    │
├────────────────────────────────────────────────────┤
│                 TOP AGENTS                         │
│                                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│  │ Agent 1 │ │ Agent 2 │ │ Agent 3 │             │
│  │   820   │ │   785   │ │   760   │             │
│  └─────────┘ └─────────┘ └─────────┘             │
│                                                    │
├────────────────────────────────────────────────────┤
│                    FOOTER                          │
│  Built on ERC-8004 + x402    |    Docs    API     │
└────────────────────────────────────────────────────┘
```

**Implementation:**

```tsx
// src/app/page.tsx
import { AgentSearch } from '@/components/AgentSearch';
import { TopAgents } from '@/components/TopAgents';
import { HowItWorks } from '@/components/HowItWorks';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-24">
        <h1 className="text-5xl font-bold text-center mb-4">
          AgentScore
        </h1>
        <p className="text-xl text-muted-foreground text-center mb-8">
          The Credit Bureau for AI Agents
        </p>
        
        <AgentSearch />
        
        <p className="text-sm text-muted-foreground mt-4">
          Search by Base or Solana wallet address
        </p>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            How It Works
          </h2>
          <HowItWorks />
        </div>
      </section>

      {/* Top Agents */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Top Rated Agents
          </h2>
          <TopAgents />
        </div>
      </section>
    </main>
  );
}
```

### 2. Agent Profile Page (`src/app/agent/[address]/page.tsx`)

**Purpose:** Display full credit report for an agent

**Layout:**
```
┌────────────────────────────────────────────────────┐
│ ← Back                                             │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │                                              │ │
│  │    [Agent Image]                             │ │
│  │                                              │ │
│  │    Agent Name                                │ │
│  │    0x742d...0bEb7                           │ │
│  │                                              │ │
│  │    ┌─────────────────────┐                  │ │
│  │    │                     │                  │ │
│  │    │        720          │                  │ │
│  │    │                     │                  │ │
│  │    │       GOOD          │                  │ │
│  │    └─────────────────────┘                  │ │
│  │                                              │ │
│  │    Reason Codes:                            │ │
│  │    [HIGH_VOLUME] [VALIDATED] [MULTI_CHAIN]  │ │
│  │                                              │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
├────────────────────────────────────────────────────┤
│  [Score Breakdown] [Chain Metrics] [History]       │
├────────────────────────────────────────────────────┤
│                                                    │
│  Score Breakdown                                   │
│  ┌────────────────────────────────────────────┐   │
│  │ Transaction History    ████████░░  100/150 │   │
│  │ Activity Level         ██████░░░░   75/100 │   │
│  │ Buyer Diversity        ██████░░░░   55/75  │   │
│  │ Reputation             ██████░░░░   75/100 │   │
│  │ Validation             ███░░░░░░░   25/50  │   │
│  │ Longevity              ████████░░   40/50  │   │
│  │ Cross-Chain            ██████████   25/25  │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  Chain Metrics                                     │
│  ┌──────────────────┐ ┌──────────────────┐       │
│  │      BASE        │ │     SOLANA       │       │
│  │  1,500 txns      │ │   500 txns       │       │
│  │  $25,000 volume  │ │  $8,000 volume   │       │
│  │  45 buyers       │ │  20 buyers       │       │
│  └──────────────────┘ └──────────────────┘       │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Implementation:**

```tsx
// src/app/agent/[address]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ScoreCard } from '@/components/ScoreCard';
import { ScoreBreakdown } from '@/components/ScoreBreakdown';
import { ChainMetrics } from '@/components/ChainMetrics';
import { ReasonCodes } from '@/components/ReasonCodes';
import { ScoreHistory } from '@/components/ScoreHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PageProps {
  params: { address: string };
}

async function getAgentReport(address: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/report?address=${address}`,
    { next: { revalidate: 300 } } // Cache for 5 minutes
  );
  
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch report');
  }
  
  return res.json();
}

export default async function AgentPage({ params }: PageProps) {
  const report = await getAgentReport(params.address);
  
  if (!report || !report.success) {
    notFound();
  }

  const { agent, score, metrics, reputation, validation, history } = report.data;

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <a href="/" className="text-muted-foreground hover:text-foreground mb-8 inline-block">
          ← Back to Search
        </a>

        {/* Score Card */}
        <ScoreCard
          score={score.value}
          grade={score.grade}
          name={agent.name}
          address={params.address}
          imageUrl={agent.imageUrl}
        />

        {/* Reason Codes */}
        <div className="mt-6">
          <ReasonCodes codes={score.reasonCodes} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="breakdown" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
            <TabsTrigger value="metrics">Chain Metrics</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="breakdown" className="mt-6">
            <ScoreBreakdown breakdown={score.breakdown} />
          </TabsContent>

          <TabsContent value="metrics" className="mt-6">
            <ChainMetrics base={metrics.base} solana={metrics.solana} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <ScoreHistory history={history} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
```

## Components

### ScoreCard

Displays the main score prominently.

```tsx
// src/components/ScoreCard.tsx
import { Card } from '@/components/ui/card';
import { ScoreGauge } from './ScoreGauge';

interface ScoreCardProps {
  score: number;
  grade: string;
  name?: string | null;
  address: string;
  imageUrl?: string | null;
}

export function ScoreCard({ score, grade, name, address, imageUrl }: ScoreCardProps) {
  const gradeColor = getGradeColor(grade);
  
  return (
    <Card className="p-8 bg-card">
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Agent Info */}
        <div className="flex items-center gap-4">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={name || 'Agent'} 
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {name || 'Unknown Agent'}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              {shortenAddress(address)}
            </p>
          </div>
        </div>

        {/* Score Display */}
        <div className="flex-1 flex flex-col items-center">
          <ScoreGauge score={score} />
          <div className="mt-4 text-center">
            <div className="text-6xl font-bold" style={{ color: gradeColor }}>
              {score}
            </div>
            <div 
              className="text-xl font-semibold uppercase tracking-wider mt-2"
              style={{ color: gradeColor }}
            >
              {grade}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'Excellent': return '#22c55e';
    case 'Very Good': return '#84cc16';
    case 'Good': return '#eab308';
    case 'Fair': return '#f97316';
    default: return '#ef4444';
  }
}

function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
```

### ScoreGauge

Circular gauge showing score position.

```tsx
// src/components/ScoreGauge.tsx
'use client';

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

export function ScoreGauge({ score, size = 200 }: ScoreGaugeProps) {
  // Score range is 300-850 (550 point range)
  const percentage = ((score - 300) / 550) * 100;
  const rotation = (percentage / 100) * 180 - 90; // -90 to 90 degrees
  
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // Half circle
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size / 2 + 20} className="overflow-visible">
      {/* Background arc */}
      <path
        d={describeArc(size / 2, size / 2, radius, -180, 0)}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      
      {/* Score arc */}
      <path
        d={describeArc(size / 2, size / 2, radius, -180, -180 + (percentage / 100) * 180)}
        fill="none"
        stroke={getScoreColor(score)}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      
      {/* Score labels */}
      <text x="10" y={size / 2 + 15} className="text-xs fill-muted-foreground">
        300
      </text>
      <text x={size - 25} y={size / 2 + 15} className="text-xs fill-muted-foreground">
        850
      </text>
    </svg>
  );
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  
  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(' ');
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function getScoreColor(score: number): string {
  if (score >= 800) return '#22c55e';
  if (score >= 740) return '#84cc16';
  if (score >= 670) return '#eab308';
  if (score >= 580) return '#f97316';
  return '#ef4444';
}
```

### ScoreBreakdown

Bar chart showing score factor breakdown.

```tsx
// src/components/ScoreBreakdown.tsx
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface FactorScore {
  score: number;
  maxScore: number;
  percentage: number;
  details: Record<string, any>;
}

interface ScoreBreakdownProps {
  breakdown: {
    transactionHistory: FactorScore;
    activityLevel: FactorScore;
    buyerDiversity: FactorScore;
    reputation: FactorScore;
    validation: FactorScore;
    longevity: FactorScore;
    crossChain: FactorScore;
  };
}

const FACTOR_LABELS = {
  transactionHistory: 'Transaction History',
  activityLevel: 'Activity Level',
  buyerDiversity: 'Buyer Diversity',
  reputation: 'Reputation',
  validation: 'Validation',
  longevity: 'Longevity',
  crossChain: 'Cross-Chain Presence',
};

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const factors = Object.entries(breakdown) as [keyof typeof FACTOR_LABELS, FactorScore][];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Score Breakdown</h3>
      <div className="space-y-6">
        {factors.map(([key, factor]) => (
          <div key={key}>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">
                {FACTOR_LABELS[key]}
              </span>
              <span className="text-sm text-muted-foreground">
                {factor.score} / {factor.maxScore}
              </span>
            </div>
            <Progress 
              value={factor.percentage} 
              className="h-2"
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
```

### ReasonCodes

Display reason code badges.

```tsx
// src/components/ReasonCodes.tsx
import { Badge } from '@/components/ui/badge';
import { REASON_CODES } from '@/lib/scoring/reason-codes';
import type { ReasonCode } from '@/lib/scoring/types';

interface ReasonCodesProps {
  codes: ReasonCode[];
}

export function ReasonCodes({ codes }: ReasonCodesProps) {
  const sortedCodes = [...codes].sort((a, b) => {
    const order = { negative: 0, positive: 1, neutral: 2 };
    return order[REASON_CODES[a].impact] - order[REASON_CODES[b].impact];
  });

  return (
    <div className="flex flex-wrap gap-2">
      {sortedCodes.map(code => {
        const info = REASON_CODES[code];
        const variant = info.impact === 'positive' ? 'default' : 
                       info.impact === 'negative' ? 'destructive' : 'secondary';
        
        return (
          <Badge 
            key={code} 
            variant={variant}
            title={info.description}
            className="cursor-help"
          >
            {info.label}
          </Badge>
        );
      })}
    </div>
  );
}
```

### ChainMetrics

Display metrics for each chain side-by-side.

```tsx
// src/components/ChainMetrics.tsx
import { Card } from '@/components/ui/card';

interface ChainData {
  transactionCount: number;
  volumeUsd: number;
  uniqueBuyers: number;
  firstTransactionAt: string | null;
  lastTransactionAt: string | null;
}

interface ChainMetricsProps {
  base: ChainData;
  solana: ChainData;
}

export function ChainMetrics({ base, solana }: ChainMetricsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <ChainCard 
        chain="Base" 
        data={base} 
        icon="🔵"
        active={base.transactionCount > 0}
      />
      <ChainCard 
        chain="Solana" 
        data={solana} 
        icon="🟣"
        active={solana.transactionCount > 0}
      />
    </div>
  );
}

function ChainCard({ 
  chain, 
  data, 
  icon,
  active 
}: { 
  chain: string; 
  data: ChainData; 
  icon: string;
  active: boolean;
}) {
  return (
    <Card className={`p-6 ${!active ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-semibold">{chain}</h3>
        {!active && (
          <span className="text-xs text-muted-foreground">(No activity)</span>
        )}
      </div>
      
      <div className="space-y-3">
        <MetricRow label="Transactions" value={data.transactionCount.toLocaleString()} />
        <MetricRow label="Volume" value={`$${data.volumeUsd.toLocaleString()}`} />
        <MetricRow label="Unique Buyers" value={data.uniqueBuyers.toLocaleString()} />
        <MetricRow 
          label="First Transaction" 
          value={data.firstTransactionAt ? new Date(data.firstTransactionAt).toLocaleDateString() : 'N/A'} 
        />
        <MetricRow 
          label="Last Transaction" 
          value={data.lastTransactionAt ? new Date(data.lastTransactionAt).toLocaleDateString() : 'N/A'} 
        />
      </div>
    </Card>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
```

### AgentSearch

Search input with autocomplete (future) and validation.

```tsx
// src/components/AgentSearch.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export function AgentSearch() {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    // Basic validation
    const trimmed = address.trim();
    
    if (!trimmed) {
      setError('Please enter an address');
      return;
    }

    // Check if valid Base address
    const isBase = trimmed.startsWith('0x') && trimmed.length === 42;
    
    // Check if valid Solana address (base58, 32-44 chars)
    const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);

    if (!isBase && !isSolana) {
      setError('Invalid address. Enter a Base (0x...) or Solana address.');
      return;
    }

    setError('');
    router.push(`/agent/${trimmed}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full max-w-xl">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter wallet address..."
            className="pl-10 h-12 text-base"
          />
        </div>
        <Button onClick={handleSearch} size="lg" className="h-12">
          Search
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}
```

## Loading States

Use skeleton loaders for all async content:

```tsx
// src/app/agent/[address]/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function Loading() {
  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-6 w-24 mb-8" />
        
        <Card className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          
          <div className="flex justify-center">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        </Card>
        
        <div className="mt-8 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </main>
  );
}
```

## Error Handling

```tsx
// src/app/agent/[address]/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't load the agent data. Please try again.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <a href="/">Go Home</a>
          </Button>
        </div>
      </div>
    </main>
  );
}
```

## Not Found Page

```tsx
// src/app/agent/[address]/not-found.tsx
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold mb-4">Agent Not Found</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't find any data for this address. The agent may not have any x402 transactions yet.
        </p>
        <Button asChild>
          <a href="/">Search Another Agent</a>
        </Button>
      </div>
    </main>
  );
}
```

## Responsive Design

- Mobile-first approach
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`
- Stack layouts vertically on mobile, side-by-side on desktop
- Touch-friendly tap targets (min 44x44px)

## SEO

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AgentScore - Credit Bureau for AI Agents',
  description: 'Get credit scores for AI agents based on their ERC-8004 identity and x402 transaction history.',
  openGraph: {
    title: 'AgentScore',
    description: 'The Credit Bureau for AI Agents',
    url: 'https://agentscore.ai',
    siteName: 'AgentScore',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentScore',
    description: 'The Credit Bureau for AI Agents',
  },
};
```

Dynamic metadata for agent pages:

```tsx
// src/app/agent/[address]/page.tsx
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const report = await getAgentReport(params.address);
  
  if (!report?.success) {
    return { title: 'Agent Not Found | AgentScore' };
  }

  const { agent, score } = report.data;
  
  return {
    title: `${agent.name || 'Agent'} - Score ${score.value} | AgentScore`,
    description: `Credit score: ${score.value} (${score.grade}). View full report for this AI agent.`,
  };
}
```
