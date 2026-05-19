"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Brain, Search, Eye, X } from "lucide-react";
import type { RetrievalTrace } from "@/lib/types";
import RetrievalPanel from "./RetrievalPanel";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  trace?: RetrievalTrace;
}

interface ChatInterfaceProps {
  documentId: string;
  documentTitle: string;
  chunkCount: number;
}

export default function ChatInterface({
  documentId,
  documentTitle,
  chunkCount,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTrace, setActiveTrace] = useState<RetrievalTrace | null>(null);
  const [showMobileTrace, setShowMobileTrace] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const question = input.trim();
    setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setActiveTrace(null);
    setShowMobileTrace(false);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentId, question }),
      });

      if (!res.ok) {
        throw new Error("Query failed");
      }

      const data = await res.json();
      const trace: RetrievalTrace = data.trace;

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: trace.answer,
        trace,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setActiveTrace(trace);
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex gap-6 h-[calc(100vh-140px)] max-w-7xl mx-auto"
    >
      {/* Left: Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Document info header */}
        <div className="glass-card p-4 mb-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--accent-glow)" }}
          >
            <Brain size={20} style={{ color: "var(--accent)" }} />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className="text-sm font-semibold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {documentTitle}
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {chunkCount} chunks indexed • Ready to query
            </p>
          </div>
          {/* Mobile trace toggle */}
          {activeTrace && (
            <button
              onClick={() => setShowMobileTrace(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: "var(--accent-glow)",
                color: "var(--accent)",
                border: "1px solid var(--border-active)",
              }}
            >
              <Eye size={14} />
              Trace
            </button>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto mb-4 px-1 flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Brain
                  size={48}
                  className="mx-auto mb-4"
                  style={{ color: "var(--text-muted)", opacity: 0.3 }}
                />
                <p style={{ color: "var(--text-muted)" }}>
                  Ask a question about your paper
                </p>
                <p className="text-xs mt-1 hidden lg:block" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                  Watch the retrieval process unfold in real-time →
                </p>
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                    msg.role === "user" ? "msg-user" : "msg-assistant"
                  }`}
                  onClick={() => {
                    if (msg.trace) {
                      setActiveTrace(msg.trace);
                      // On mobile, auto-open the panel
                      if (window.innerWidth < 1024) {
                        setShowMobileTrace(true);
                      }
                    }
                  }}
                >
                  {msg.content}
                  {msg.trace && (
                    <p
                      className="text-xs mt-2 cursor-pointer underline"
                      style={{
                        color: msg.role === "user" ? "rgba(255,255,255,0.7)" : "var(--accent)",
                      }}
                    >
                      View retrieval trace →
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 p-4"
            >
              <Loader2
                size={16}
                className="animate-spin"
                style={{ color: "var(--accent)" }}
              />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Searching, re-ranking, generating...
              </span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the paper..."
            className="chat-input flex-1 px-4 py-3"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm"
            style={{
              background: input.trim() ? "var(--accent)" : "var(--bg-secondary)",
              color: input.trim() ? "white" : "var(--text-muted)",
              cursor: input.trim() ? "pointer" : "default",
              border: "1px solid var(--border)"
            }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Right: Retrieval Transparency Panel (Desktop) */}
      <div className="w-[420px] flex-shrink-0 hidden lg:block">
        {activeTrace ? (
          <RetrievalPanel trace={activeTrace} />
        ) : (
          <div className="h-full flex items-center justify-center glass-card p-8">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--accent-glow)" }}
              >
                <Search size={24} style={{ color: "var(--accent)", opacity: 0.5 }} />
              </div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Retrieval trace will appear here
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                Ask a question to see how the AI finds its answer
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile: Retrieval Panel Overlay */}
      <AnimatePresence>
        {showMobileTrace && activeTrace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setShowMobileTrace(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md overflow-y-auto p-4"
              style={{ background: "var(--bg-primary)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowMobileTrace(false)}
                className="mb-4 flex items-center gap-2 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                <X size={16} /> Close trace
              </button>
              <RetrievalPanel trace={activeTrace} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
