import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center px-4">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold mb-4">Agent Not Found</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          We couldn&apos;t find any data for this address. The agent may not have any
          x402 transactions yet, or the address format may be invalid.
        </p>
        <Button asChild>
          <Link href="/">Search Another Agent</Link>
        </Button>
      </div>
    </main>
  );
}
