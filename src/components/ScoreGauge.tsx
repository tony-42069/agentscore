"use client";

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

export function ScoreGauge({ score, size = 200 }: ScoreGaugeProps) {
  // Score range is 300-850 (550 point range)
  const percentage = ((score - 300) / 550) * 100;

  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;

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
        d={describeArc(
          size / 2,
          size / 2,
          radius,
          -180,
          -180 + (percentage / 100) * 180
        )}
        fill="none"
        stroke={getScoreColor(score)}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Score labels */}
      <text
        x="10"
        y={size / 2 + 15}
        className="text-xs fill-muted-foreground"
        style={{ fontFamily: "inherit" }}
      >
        300
      </text>
      <text
        x={size - 25}
        y={size / 2 + 15}
        className="text-xs fill-muted-foreground"
        style={{ fontFamily: "inherit" }}
      >
        850
      </text>
    </svg>
  );
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(
    " "
  );
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function getScoreColor(score: number): string {
  if (score >= 800) return "#22c55e";
  if (score >= 740) return "#84cc16";
  if (score >= 670) return "#eab308";
  if (score >= 580) return "#f97316";
  return "#ef4444";
}
