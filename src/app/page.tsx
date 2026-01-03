import { AgentSearch } from "@/components/AgentSearch";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-bold text-xl">AgentScore</div>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/docs" className="text-muted-foreground hover:text-foreground">
              Docs
            </a>
            <a href="/api" className="text-muted-foreground hover:text-foreground">
              API
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-24">
        <h1 className="text-5xl md:text-6xl font-bold text-center mb-4">
          AgentScore
        </h1>
        <p className="text-xl text-muted-foreground text-center mb-8 max-w-2xl">
          The Credit Bureau for AI Agents. Get unified credit scores for autonomous
          AI agents based on ERC-8004 identity and x402 transaction history.
        </p>

        <AgentSearch />

        <p className="text-sm text-muted-foreground mt-4">
          Search by Base or Solana wallet address
        </p>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="text-4xl mb-4">🪪</div>
              <h3 className="font-semibold mb-2">ERC-8004 Identity</h3>
              <p className="text-sm text-muted-foreground">
                We verify agent identity and fetch reputation and validation data
                from the ERC-8004 registries.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-semibold mb-2">x402 Transactions</h3>
              <p className="text-sm text-muted-foreground">
                We analyze transaction history from x402 on both Base and Solana
                to measure commercial activity.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-semibold mb-2">300-850 Score</h3>
              <p className="text-sm text-muted-foreground">
                We compute a unified credit score with transparent factor
                breakdown and reason codes.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Scoring Factors */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Scoring Factors</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <FactorRow
              name="Transaction History"
              weight="27%"
              description="Total volume processed on x402"
            />
            <FactorRow
              name="Activity Level"
              weight="18%"
              description="Transaction frequency and recency"
            />
            <FactorRow
              name="Reputation"
              weight="18%"
              description="ERC-8004 feedback scores"
            />
            <FactorRow
              name="Buyer Diversity"
              weight="14%"
              description="Number of unique buyers"
            />
            <FactorRow
              name="Validation"
              weight="9%"
              description="Third-party verification status"
            />
            <FactorRow
              name="Longevity"
              weight="9%"
              description="Time since first transaction"
            />
            <FactorRow
              name="Cross-Chain"
              weight="5%"
              description="Activity on multiple chains"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-card">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Check an Agent?</h2>
          <p className="text-muted-foreground mb-8">
            Enter any Base or Solana wallet address to get a comprehensive credit
            report for the agent.
          </p>
          <AgentSearch />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Built on ERC-8004 + x402
          </div>
          <div className="flex gap-4 text-sm">
            <a
              href="https://eips.ethereum.org/EIPS/eip-8004"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              ERC-8004
            </a>
            <a
              href="https://x402scan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              x402scan
            </a>
            <a
              href="https://github.com/tony-42069/agentscore"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FactorRow({
  name,
  weight,
  description,
}: {
  name: string;
  weight: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-card">
      <div className="text-lg font-bold text-primary w-12">{weight}</div>
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}
