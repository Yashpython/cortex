"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { RetrievalTrace } from "@/lib/types";

interface RetrievalPanelProps {
  trace: RetrievalTrace;
}

const springEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ─── Confidence Counter ─── */
function ConfidenceCounter({
  value,
  delay = 0,
}: {
  value: number;
  delay?: number;
}) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    setDisplay(0);

    const timeout = setTimeout(() => {
      let start: number | null = null;
      const duration = 600;

      const step = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        // easeOut cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * value));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        }
      };

      rafRef.current = requestAnimationFrame(step);
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [value, delay]);

  return (
    <div className="text-right shrink-0">
      <div className="font-mono text-5xl font-bold text-accent leading-none tabular-nums">
        {display}%
      </div>
      <div className="font-mono text-[10px] uppercase text-secondary tracking-widest mt-1">
        confidence
      </div>
    </div>
  );
}

/* ─── Main Panel ─── */
export default function RetrievalPanel({ trace }: RetrievalPanelProps) {
  const [contextExpanded, setContextExpanded] = useState(false);

  // Reset expand state when trace changes
  useEffect(() => {
    setContextExpanded(false);
  }, [trace]);

  return (
    <div className="flex flex-col gap-0 h-full overflow-y-auto">
      {/* ─── Header: timing + confidence ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0, duration: 0.4, ease: springEase }}
        className="flex items-start justify-between px-8 pt-6 pb-4"
      >
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-secondary tabular-nums">
            {trace.retrieval_time_ms}ms search · {trace.total_time_ms}ms total
          </span>
        </div>
        <ConfidenceCounter value={trace.confidence} delay={1.2} />
      </motion.div>

      <div className="px-8 pb-8 flex flex-col gap-8">
        {/* ═══ STEP 1 — VECTOR SEARCH ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease: springEase }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[#fafafa]">
              Vector Search
            </h3>
            <span className="font-mono text-[11px] text-secondary ml-auto tabular-nums">
              {trace.retrieved_chunks.length} chunks
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {trace.retrieved_chunks.map((chunk, i) => (
              <div key={chunk.id} className="group">
                {/* Row: Chunk label ·········· Score */}
                <div className="flex items-baseline gap-2 px-3 py-2 -mx-3 rounded-md border border-transparent group-hover:border-white/[0.05] group-hover:bg-white/[0.02] group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-200">
                  <span className="font-mono text-xs text-secondary group-hover:text-primary transition-colors duration-200 whitespace-nowrap">
                    Chunk #{chunk.chunk_index}
                  </span>
                  <span className="flex-1 border-b border-dotted border-[#333] self-end mb-1" />
                  <span className="font-mono text-xs font-semibold text-accent tabular-nums whitespace-nowrap">
                    {(chunk.similarity * 100).toFixed(1)}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1 bg-[#222] rounded-full overflow-hidden mt-2">
                  <motion.div
                    className="h-full rounded-full bg-accent shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${chunk.similarity * 100}%` }}
                    transition={{
                      delay: 0.15 + i * 0.05,
                      duration: 0.4,
                      ease: springEase,
                    }}
                    style={{ opacity: Math.max(0.3, 1 - i * 0.15) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ═══ STEP 2 — RE-RANKING ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4, ease: springEase }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[#fafafa]">
              Re-Ranking
            </h3>
            <span className="font-mono text-[11px] text-secondary ml-auto tabular-nums">
              top {trace.reranked_chunks.length}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {trace.reranked_chunks.slice(0, 5).map((chunk, i) => {
              const delta = chunk.original_rank - chunk.new_rank;

              return (
                <motion.div
                  key={chunk.id}
                  initial={{
                    opacity: 0,
                    y: chunk.movement === "up" ? 8 : 0,
                  }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    chunk.movement === "up"
                      ? {
                          delay: 0.7 + i * 0.06,
                          type: "spring",
                          stiffness: 400,
                          damping: 15,
                        }
                      : {
                          delay: 0.7 + i * 0.06,
                          duration: 0.3,
                          ease: springEase,
                        }
                  }
                  className="group"
                >
                  <div className="flex items-baseline gap-2 px-3 py-2 -mx-3 rounded-md border border-transparent group-hover:border-white/[0.05] group-hover:bg-white/[0.02] group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-200">
                    <span className="font-mono text-xs text-secondary group-hover:text-primary transition-colors duration-200 whitespace-nowrap">
                      Chunk #{chunk.chunk_index}
                    </span>

                    {/* Movement indicator */}
                    <span
                      className={`font-mono text-[11px] font-medium tabular-nums whitespace-nowrap ${
                        chunk.movement === "up"
                          ? "text-accent"
                          : chunk.movement === "down"
                            ? "text-secondary"
                            : "text-muted"
                      }`}
                    >
                      {chunk.movement === "up" && `↑ +${delta}`}
                      {chunk.movement === "down" && `↓ ${delta}`}
                      {chunk.movement === "stayed" && "—"}
                    </span>

                    <span className="flex-1 border-b border-dotted border-[#333] self-end mb-1" />
                    <span className="font-mono text-xs font-semibold text-accent tabular-nums whitespace-nowrap">
                      {(chunk.relevance_score * 100).toFixed(1)}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* ═══ STEP 3 — CONTEXT WINDOW ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.4, ease: springEase }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[#fafafa]">
              Context Window
            </h3>
          </div>

          <div className="border border-edge rounded-xl bg-gradient-to-b from-[#0a0a0a] to-[#050505] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] p-5 overflow-hidden">
            <pre className="font-mono text-[11px] text-[#a3a3a3] whitespace-pre-wrap break-words leading-relaxed">
              {contextExpanded
                ? trace.final_context
                : trace.final_context.substring(0, 300)}
              {!contextExpanded && trace.final_context.length > 300 && "..."}
            </pre>
          </div>

          {trace.final_context.length > 300 && (
            <button
              onClick={() => setContextExpanded(!contextExpanded)}
              className="font-mono text-xs text-secondary hover:text-primary transition-colors duration-150 mt-2"
            >
              {contextExpanded ? "collapse" : "show full context"}
            </button>
          )}
        </motion.section>
      </div>
    </div>
  );
}
