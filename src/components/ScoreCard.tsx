import { Card } from "@/components/ui/card";
import { ScoreGauge } from "./ScoreGauge";
import { shortenAddress } from "@/lib/utils/addresses";
import { getGradeColor } from "@/lib/utils/formatting";

interface ScoreCardProps {
  score: number;
  grade: string;
  name?: string | null;
  address: string;
  imageUrl?: string | null;
}

export function ScoreCard({
  score,
  grade,
  name,
  address,
  imageUrl,
}: ScoreCardProps) {
  const gradeColor = getGradeColor(grade);

  return (
    <Card className="p-8 bg-card">
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Agent Info */}
        <div className="flex items-center gap-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name || "Agent"}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{name || "Unknown Agent"}</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {shortenAddress(address)}
            </p>
          </div>
        </div>

        {/* Score Display */}
        <div className="flex-1 flex flex-col items-center">
          <ScoreGauge score={score} />
          <div className="mt-4 text-center">
            <div
              className="text-6xl font-bold score-number"
              style={{ color: gradeColor }}
            >
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
