import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface FactorScore {
  score: number;
  maxScore: number;
  percentage: number;
  details: Record<string, unknown>;
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

const FACTOR_LABELS: Record<string, string> = {
  transactionHistory: "Transaction History",
  activityLevel: "Activity Level",
  buyerDiversity: "Buyer Diversity",
  reputation: "Reputation",
  validation: "Validation",
  longevity: "Longevity",
  crossChain: "Cross-Chain Presence",
};

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const factors = Object.entries(breakdown) as [string, FactorScore][];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Score Breakdown</h3>
      <div className="space-y-6">
        {factors.map(([key, factor]) => (
          <div key={key}>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">
                {FACTOR_LABELS[key] || key}
              </span>
              <span className="text-sm text-muted-foreground">
                {factor.score} / {factor.maxScore}
              </span>
            </div>
            <Progress value={factor.percentage} className="h-2" />
          </div>
        ))}
      </div>
    </Card>
  );
}
