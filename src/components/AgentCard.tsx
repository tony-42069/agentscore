import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { shortenAddress } from "@/lib/utils/addresses";
import { formatUSD, formatCompact, getGradeColor } from "@/lib/utils/formatting";

interface AgentCardProps {
  address: string;
  name: string | null;
  score: number;
  grade: string;
  totalVolumeUsd: number;
  transactionCount: number;
  chains: string[];
}

export function AgentCard({
  address,
  name,
  score,
  grade,
  totalVolumeUsd,
  transactionCount,
  chains,
}: AgentCardProps) {
  const gradeColor = getGradeColor(grade);

  return (
    <Link href={`/agent/${address}`}>
      <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span>🤖</span>
            </div>
            <div>
              <h3 className="font-medium">{name || "Unknown Agent"}</h3>
              <p className="text-xs text-muted-foreground font-mono">
                {shortenAddress(address)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: gradeColor }}>
              {score}
            </div>
            <div className="text-xs text-muted-foreground">{grade}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex gap-1">
            {chains.map((chain) => (
              <Badge key={chain} variant="secondary" className="text-xs">
                {chain}
              </Badge>
            ))}
          </div>
          <div className="text-muted-foreground">
            {formatCompact(transactionCount)} txns · {formatUSD(totalVolumeUsd)}
          </div>
        </div>
      </Card>
    </Link>
  );
}
