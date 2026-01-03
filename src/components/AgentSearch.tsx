"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function AgentSearch() {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = () => {
    const trimmed = address.trim();

    if (!trimmed) {
      setError("Please enter an address");
      return;
    }

    // Check if valid Base address
    const isBase = trimmed.startsWith("0x") && trimmed.length === 42;

    // Check if valid Solana address (base58, 32-44 chars)
    const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);

    if (!isBase && !isSolana) {
      setError("Invalid address. Enter a Base (0x...) or Solana address.");
      return;
    }

    setError("");
    setLoading(true);
    router.push(`/agent/${trimmed}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
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
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter wallet address..."
            className="pl-10 h-12 text-base"
          />
        </div>
        <Button onClick={handleSearch} size="lg" className="h-12" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
