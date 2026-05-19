"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles, Eye, Zap } from "lucide-react";
import UploadZone from "@/components/UploadZone";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [chunkCount, setChunkCount] = useState(0);

  const handleUploadComplete = (id: string, title: string, chunks: number) => {
    setDocumentId(id);
    setDocumentTitle(title);
    setChunkCount(chunks);
  };

  if (documentId) {
    return (
      <main className="min-h-screen p-6">
        {/* Minimal header in chat mode */}
        <div className="flex items-center gap-3 mb-6 max-w-7xl mx-auto">
          <Brain size={24} style={{ color: "var(--accent)" }} />
          <h1 className="text-lg font-bold gradient-text">Cortex</h1>
          <button
            onClick={() => {
              setDocumentId(null);
              setDocumentTitle("");
              setChunkCount(0);
            }}
            className="text-[13px] font-medium ml-auto rounded-lg transition-all duration-200"
            style={{
              padding: "8px 16px",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            Upload new paper
          </button>
        </div>
        <ChatInterface
          documentId={documentId}
          documentTitle={documentTitle}
          chunkCount={chunkCount}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20"
          style={{ background: "var(--accent)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-10"
          style={{ background: "var(--accent-secondary)" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-3xl">
        {/* Logo + Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center glow"
              style={{ background: "var(--accent-glow)", border: "1px solid var(--border-active)" }}
            >
              <Brain size={28} style={{ color: "var(--accent)" }} />
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-3">
            <span className="gradient-text">Cortex</span>
          </h1>
          <p
            className="text-lg max-w-lg mx-auto leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            AI research paper analysis with{" "}
            <span style={{ color: "var(--text-primary)" }}>
              transparent retrieval
            </span>
            . See exactly how the AI finds its answers.
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-3"
        >
          {[
            { icon: Sparkles, label: "Vector Search" },
            { icon: Eye, label: "Transparent Retrieval" },
            { icon: Zap, label: "AI Re-Ranking" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full text-[13px] font-medium shadow-sm transition-all duration-300 hover:border-[var(--accent)] hover:shadow-md cursor-default"
              style={{
                padding: "8px 16px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              <Icon size={14} style={{ color: "var(--accent)" }} />
              {label}
            </div>
          ))}
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="w-full"
        >
          <UploadZone onUploadComplete={handleUploadComplete} />
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-xs text-center"
          style={{ color: "var(--text-muted)" }}
        >
          Built with Next.js • Supabase pgvector • Google Gemini
        </motion.p>
      </div>
    </main>
  );
}
