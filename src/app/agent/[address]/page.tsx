import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScoreCard } from "@/components/ScoreCard";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { ChainMetrics } from "@/components/ChainMetrics";
import { ReasonCodes } from "@/components/ReasonCodes";
import { ScoreHistory } from "@/components/ScoreHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import type { ReasonCode, ScoreBreakdown as ScoreBreakdownType } from "@/lib/scoring/types";

interface PageProps {
  params: { address: string };
}

async function getAgentReport(address: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/report?address=${address}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch report");
    }

    return res.json();
  } catch (error) {
    console.error("Failed to fetch agent report:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const report = await getAgentReport(params.address);

  if (!report?.success) {
    return { title: "Agent Not Found | AgentScore" };
  }

  const { agent, score } = report.data;

  return {
    title: `${agent.name || "Agent"} - Score ${score.value} | AgentScore`,
    description: `Credit score: ${score.value} (${score.grade}). View full report for this AI agent.`,
  };
}

export default async function AgentPage({ params }: PageProps) {
  const report = await getAgentReport(params.address);

  if (!report || !report.success) {
    notFound();
  }

  const { agent, score, metrics, reputation, validation, history } = report.data;

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      {/* Header */}
      <header className="border-b mb-8">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">
            AgentScore
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-8 inline-block"
        >
          ← Back to Search
        </Link>

        {/* Score Card */}
        <div className="mt-4">
          <ScoreCard
            score={score.value}
            grade={score.grade}
            name={agent.name}
            address={params.address}
            imageUrl={agent.imageUrl}
          />
        </div>

        {/* Reason Codes */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Score Factors
          </h3>
          <ReasonCodes codes={score.reasonCodes as ReasonCode[]} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="breakdown" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
            <TabsTrigger value="metrics">Chain Metrics</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="breakdown" className="mt-6">
            <ScoreBreakdown breakdown={score.breakdown as ScoreBreakdownType} />
          </TabsContent>

          <TabsContent value="metrics" className="mt-6">
            <ChainMetrics base={metrics.base} solana={metrics.solana} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <ScoreHistory history={history} />
          </TabsContent>
        </Tabs>

        {/* Additional Info */}
        <div className="mt-8 text-sm text-muted-foreground text-center">
          Score calculated at {new Date(report.data.calculatedAt).toLocaleString()}
        </div>
      </div>
    </main>
  );
}
