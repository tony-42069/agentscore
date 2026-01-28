"use client";

import { motion } from "framer-motion";

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-4 bg-secondary rounded w-3/4 mb-4" />
      <div className="h-3 bg-secondary rounded w-1/2 mb-2" />
      <div className="h-3 bg-secondary rounded w-2/3" />
    </div>
  );
}

export function SkeletonScore() {
  return (
    <div className="animate-pulse flex flex-col items-center">
      <div className="w-32 h-32 rounded-full bg-secondary mb-4" />
      <div className="h-8 bg-secondary rounded w-24 mb-2" />
      <div className="h-4 bg-secondary rounded w-16" />
    </div>
  );
}

export function SkeletonMetrics() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-6">
          <div className="h-10 bg-secondary rounded w-20 mb-2" />
          <div className="h-4 bg-secondary rounded w-24 mb-1" />
          <div className="h-3 bg-secondary rounded w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonAgentCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="premium-card rounded-2xl p-6 animate-pulse"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-secondary" />
          <div>
            <div className="h-5 bg-secondary rounded w-32 mb-2" />
            <div className="h-3 bg-secondary rounded w-24" />
          </div>
        </div>
        <div className="w-16 h-8 bg-secondary rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-secondary rounded w-full" />
        <div className="h-3 bg-secondary rounded w-5/6" />
      </div>
    </motion.div>
  );
}
