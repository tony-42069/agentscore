import { Badge } from "@/components/ui/badge";
import { REASON_CODES } from "@/lib/scoring/reason-codes";
import type { ReasonCode } from "@/lib/scoring/types";

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
      {sortedCodes.map((code) => {
        const info = REASON_CODES[code];
        const variant =
          info.impact === "positive"
            ? "success"
            : info.impact === "negative"
            ? "destructive"
            : "secondary";

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
