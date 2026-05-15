"use client";

import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Minus, Clock, Search, Filter, MessageSquare } from "lucide-react";
import type { RetrievalTrace } from "@/lib/types";

interface RetrievalPanelProps {
  trace: RetrievalTrace;
}

function ConfidenceMeter({ confidence }: { confidence: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (confidence / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 80) return "var(--success)";
    if (score >= 50) return "var(--warning)";
    return "var(--error)";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40" cy="40" r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="4"
          />
          <motion.circle
            cx="40" cy="40" r={radius}
            fill="none"
            stroke={getColor(confidence)}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-xl font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ color: getColor(confidence) }}
          >
            {confidence}%
          </motion.span>
        </div>
      </div>
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>Confidence</span>
    </div>
  );
}

function ScoreBar({ score, maxScore = 1 }: { score: number; maxScore?: number }) {
  const percentage = Math.min((score / maxScore) * 100, 100);
  return (
    <div className="w-full rounded-full" style={{ background: "var(--border)", height: "6px" }}>
      <motion.div
        className="score-bar"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

function MovementIcon({ movement }: { movement: "up" | "down" | "stayed" }) {
  if (movement === "up")
    return <ArrowUp size={14} className="movement-up" />;
  if (movement === "down")
    return <ArrowDown size={14} className="movement-down" />;
  return <Minus size={14} className="movement-stayed" />;
}

export default function RetrievalPanel({ trace }: RetrievalPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-5 h-full overflow-y-auto pr-1"
    >
      {/* Header with confidence + timing */}
      <div className="glass-card p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold mb-1 gradient-text">Retrieval Trace</h3>
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {trace.retrieval_time_ms}ms search
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {trace.total_time_ms}ms total
            </span>
          </div>
        </div>
        <ConfidenceMeter confidence={trace.confidence} />
      </div>

      {/* Step 1: Retrieved Chunks */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="step-badge">1</span>
          <Search size={14} style={{ color: "var(--accent)" }} />
          <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Vector Search
          </h4>
          <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
            {trace.retrieved_chunks.length} chunks found
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {trace.retrieved_chunks.map((chunk, i) => (
            <motion.div
              key={chunk.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-3 rounded-lg"
              style={{ background: "var(--bg-secondary)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  Chunk #{chunk.chunk_index}
                </span>
                <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                  {(chunk.similarity * 100).toFixed(1)}%
                </span>
              </div>
              <ScoreBar score={chunk.similarity} />
              <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {chunk.content.substring(0, 120)}...
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Step 2: Re-ranked Chunks */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="step-badge">2</span>
          <Filter size={14} style={{ color: "var(--accent)" }} />
          <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Re-Ranked by AI
          </h4>
          <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
            {trace.reranked_chunks.length} re-scored
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {trace.reranked_chunks.slice(0, 5).map((chunk, i) => (
            <motion.div
              key={chunk.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="p-3 rounded-lg"
              style={{ background: "var(--bg-secondary)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                    Chunk #{chunk.chunk_index}
                  </span>
                  <MovementIcon movement={chunk.movement} />
                  <span className="text-xs" style={{
                    color: chunk.movement === "up" ? "var(--success)"
                         : chunk.movement === "down" ? "var(--error)"
                         : "var(--text-muted)"
                  }}>
                    {chunk.movement === "up" && `↑ ${chunk.original_rank} → ${chunk.new_rank}`}
                    {chunk.movement === "down" && `↓ ${chunk.original_rank} → ${chunk.new_rank}`}
                    {chunk.movement === "stayed" && `— #${chunk.new_rank}`}
                  </span>
                </div>
                <span className="text-xs font-semibold" style={{ color: "var(--accent-secondary)" }}>
                  {(chunk.relevance_score * 100).toFixed(1)}%
                </span>
              </div>
              <ScoreBar score={chunk.relevance_score} />
              <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {chunk.content.substring(0, 120)}...
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Step 3: Final Context */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="step-badge">3</span>
          <MessageSquare size={14} style={{ color: "var(--accent)" }} />
          <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Context Sent to LLM
          </h4>
        </div>
        <div
          className="p-3 rounded-lg text-xs leading-relaxed max-h-40 overflow-y-auto"
          style={{
            background: "var(--bg-secondary)",
            color: "var(--text-secondary)",
            fontFamily: "monospace",
          }}
        >
          {trace.final_context.substring(0, 600)}
          {trace.final_context.length > 600 && "..."}
        </div>
      </div>
    </motion.div>
  );
}
