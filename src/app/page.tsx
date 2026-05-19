"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import UploadZone from "@/components/UploadZone";
import ChatInterface from "@/components/ChatInterface";
import Hero3D from "@/components/Hero3D";

const springEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function Home() {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [chunkCount, setChunkCount] = useState(0);

  const handleUploadComplete = (id: string, title: string, chunks: number) => {
    setDocumentId(id);
    setDocumentTitle(title);
    setChunkCount(chunks);
  };

  /* ─── Chat Mode ─── */
  if (documentId) {
    return (
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="h-screen w-full flex flex-col bg-canvas"
      >
        {/* Top bar */}
        <div className="flex items-center gap-4 px-8 h-14 border-b border-edge shrink-0 bg-surface/50 backdrop-blur-md">
          <span className="font-mono font-bold text-sm text-primary tracking-tight">
            cortex
          </span>
          <span className="font-mono text-xs text-secondary px-3 py-1 border border-edge rounded-full bg-canvas shadow-inner">
            {documentTitle} · {chunkCount} chunks
          </span>
          <button
            onClick={() => {
              setDocumentId(null);
              setDocumentTitle("");
              setChunkCount(0);
            }}
            className="ml-auto font-mono text-xs text-secondary hover:text-primary transition-colors duration-150 px-3 py-1.5 rounded-md hover:bg-white/5"
          >
            ← new paper
          </button>
        </div>

        <ChatInterface
          documentId={documentId}
          documentTitle={documentTitle}
          chunkCount={chunkCount}
        />
      </motion.main>
    );
  }

  /* ─── Landing ─── */
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative h-screen w-full flex items-center justify-center bg-canvas overflow-hidden"
    >
      {/* 3D Background */}
      <Hero3D />

      {/* Subtle radial gradient to ensure text readability over 3D */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#080808_100%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1000px] mx-auto px-8 flex flex-col items-center text-center">
        {/* Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: springEase }}
          className="mb-8 font-mono text-[11px] font-medium text-accent tracking-widest uppercase px-4 py-1.5 border border-accent/20 rounded-full bg-accent/5 backdrop-blur-md shadow-[0_0_15px_rgba(99,102,241,0.1)]"
        >
          Intelligence, visualized
        </motion.div>

        <h1 className="text-5xl md:text-6xl lg:text-[80px] font-extrabold leading-[0.9] text-primary tracking-tighter mb-6 drop-shadow-2xl">
          <motion.span
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.3, duration: 0.8, ease: springEase }}
            className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60"
          >
            Know exactly
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.45, duration: 0.8, ease: springEase }}
            className="block text-transparent bg-clip-text bg-gradient-to-b from-white/90 to-white/30"
          >
            how it thinks.
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: springEase }}
          className="text-base md:text-lg text-[#a3a3a3] max-w-xl font-light leading-relaxed"
        >
          Upload a research paper and interrogate it. Cortex reveals the complete vector search and re-ranking pipeline in real-time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: springEase }}
          className="mt-10 w-full max-w-md"
        >
          <UploadZone onUploadComplete={handleUploadComplete} />
        </motion.div>
        
        {/* Features Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-6 mt-12 text-muted font-mono text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-accent" /> Vector Search
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-accent" /> Cross-Encoder Re-ranking
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-accent" /> Transparent Context
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-12 pointer-events-none"
        >
          <p className="font-mono text-[10px] text-muted tracking-wider uppercase">
            Built with Next.js · Supabase pgvector · Gemini 2.5
          </p>
        </motion.div>
      </div>
    </motion.main>
  );
}
