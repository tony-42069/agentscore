"use client";

import { Card } from "@/components/ui/card";
import { formatDate, getScoreColor } from "@/lib/utils/formatting";

interface ScoreHistoryProps {
  history: Array<{ date: string; score: number }>;
}

export function ScoreHistory({ history }: ScoreHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Score History</h3>
        <p className="text-muted-foreground text-sm">
          No score history available yet. Scores are tracked over time as data is refreshed.
        </p>
      </Card>
    );
  }

  // Reverse to show oldest first for the chart
  const chartData = [...history].reverse();

  // Find min/max for scaling
  const scores = chartData.map((d) => d.score);
  const minScore = Math.min(...scores, 300);
  const maxScore = Math.max(...scores, 850);
  const range = maxScore - minScore || 1;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Score History</h3>

      {/* Simple line chart */}
      <div className="h-48 flex items-end gap-1">
        {chartData.map((item, i) => {
          const height = ((item.score - minScore) / range) * 100;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
              title={`${formatDate(item.date)}: ${item.score}`}
            >
              <div
                className="w-full rounded-t transition-all hover:opacity-80"
                style={{
                  height: `${Math.max(height, 5)}%`,
                  backgroundColor: getScoreColor(item.score),
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-between mt-4 text-xs text-muted-foreground">
        <span>{chartData.length > 0 ? formatDate(chartData[0].date) : ""}</span>
        <span>
          {chartData.length > 0
            ? formatDate(chartData[chartData.length - 1].date)
            : ""}
        </span>
      </div>

      {/* Recent entries table */}
      <div className="mt-6 space-y-2">
        {history.slice(0, 5).map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{formatDate(item.date)}</span>
            <span className="font-medium" style={{ color: getScoreColor(item.score) }}>
              {item.score}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
