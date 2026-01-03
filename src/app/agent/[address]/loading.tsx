import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function Loading() {
  return (
    <main className="min-h-screen bg-background py-8 px-4">
      {/* Header */}
      <header className="border-b mb-8">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">
            AgentScore
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-6 w-24 mb-8" />

        <Card className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center">
              <Skeleton className="h-24 w-48 rounded-lg" />
              <Skeleton className="h-16 w-24 mt-4" />
              <Skeleton className="h-6 w-20 mt-2" />
            </div>
          </div>
        </Card>

        <div className="mt-6 flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>

        <div className="mt-8">
          <Skeleton className="h-10 w-full mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </main>
  );
}
