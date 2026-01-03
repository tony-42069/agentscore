import { Card } from "@/components/ui/card";
import { formatUSD, formatNumber, formatDate } from "@/lib/utils/formatting";

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
      <ChainCard chain="Base" data={base} icon="🔵" active={base.transactionCount > 0} />
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
  active,
}: {
  chain: string;
  data: ChainData;
  icon: string;
  active: boolean;
}) {
  return (
    <Card className={`p-6 ${!active ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-semibold">{chain}</h3>
        {!active && (
          <span className="text-xs text-muted-foreground">(No activity)</span>
        )}
      </div>

      <div className="space-y-3">
        <MetricRow
          label="Transactions"
          value={formatNumber(data.transactionCount)}
        />
        <MetricRow label="Volume" value={formatUSD(data.volumeUsd)} />
        <MetricRow
          label="Unique Buyers"
          value={formatNumber(data.uniqueBuyers)}
        />
        <MetricRow
          label="First Transaction"
          value={
            data.firstTransactionAt
              ? formatDate(data.firstTransactionAt)
              : "N/A"
          }
        />
        <MetricRow
          label="Last Transaction"
          value={
            data.lastTransactionAt ? formatDate(data.lastTransactionAt) : "N/A"
          }
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
