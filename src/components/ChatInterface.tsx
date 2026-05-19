"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
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
  const [traceVersion, setTraceVersion] = useState(0);
  const [showMobileTrace, setShowMobileTrace] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suppress unused prop warnings — props preserved for interface compatibility
  void documentTitle;
  void chunkCount;

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
      setTraceVersion((v) => v + 1);
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
      transition={{ duration: 0.4 }}
      className="flex-1 grid grid-cols-1 lg:grid-cols-4 min-h-0"
    >
      {/* ─── Left: Chat ─── */}
      <div className="flex flex-col min-h-0 lg:col-span-3 lg:border-r lg:border-edge">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="flex flex-col items-center gap-4 bg-gradient-to-b from-[#111111] to-[#0a0a0a] border border-edge rounded-xl px-12 py-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                <div className="p-3 rounded-full bg-surface border border-edge shadow-inner mb-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div className="text-center">
                  <p className="font-mono text-sm text-primary tracking-wide">
                    Ask about the paper...
                  </p>
                  <p className="font-sans text-xs text-secondary mt-2 max-w-[200px] leading-relaxed mx-auto">
                    Watch the retrieval process unfold in real-time.
                  </p>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className={`mb-6 ${msg.role === "user" ? "text-right" : "text-left"}`}
              >
                {msg.role === "user" ? (
                  <div className="bg-gradient-to-b from-[#161616] to-[#0f0f0f] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-edge rounded-xl px-5 py-3 text-primary text-[15px] leading-relaxed inline-block text-left max-w-[85%]">
                    {msg.content}
                  </div>
                ) : (
                  <div className="pl-3 border-l border-accent/30 max-w-[90%]">
                    <div className="text-[#fafafa] font-light text-[15px] leading-[1.7] [&>p]:mb-4 last:[&>p]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&_strong]:font-semibold [&_strong]:text-white">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.trace && (
                      <button
                        onClick={() => {
                          setActiveTrace(msg.trace!);
                          setTraceVersion((v) => v + 1);
                          if (window.innerWidth < 1024) {
                            setShowMobileTrace(true);
                          }
                        }}
                        className="mt-4 flex items-center gap-2 font-mono text-[11px] text-accent tracking-widest uppercase px-4 py-1.5 border border-accent/20 rounded-full bg-accent/5 hover:bg-accent/10 transition-colors duration-150"
                      >
                        view trace →
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 mb-6"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
              <span className="font-mono text-xs text-secondary">
                Searching, re-ranking, generating...
              </span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="px-8 py-4 border-t border-edge">
          {/* Mobile trace shortcut */}
          {activeTrace && (
            <button
              onClick={() => setShowMobileTrace(true)}
              className="lg:hidden font-mono text-xs text-accent mb-3 block"
            >
              view trace →
            </button>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-3 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={isLoading}
              className="flex-1 bg-gradient-to-b from-[#111111] to-[#0a0a0a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-edge rounded-lg pl-4 pr-12 py-3.5 font-mono text-sm text-primary placeholder:text-secondary outline-none transition-all duration-300 focus:border-accent/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.1),inset_0_1px_1px_rgba(255,255,255,0.05)]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md bg-accent/20 text-accent hover:text-white hover:bg-accent/80 transition-all duration-150 disabled:opacity-30 disabled:hover:bg-accent/20 disabled:hover:text-accent"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* ─── Right: Retrieval Panel (Desktop) ─── */}
      <div className="hidden lg:block overflow-y-auto lg:col-span-1 bg-[#0c0c0c]">
        {activeTrace ? (
          <RetrievalPanel key={traceVersion} trace={activeTrace} />
        ) : (
          <div className="h-full flex items-center justify-center p-8 text-center">
            <p className="font-mono text-sm text-secondary leading-relaxed">
              Ask a question to see the retrieval trace
            </p>
          </div>
        )}
      </div>

      {/* ─── Mobile Trace Overlay ─── */}
      <AnimatePresence>
        {showMobileTrace && activeTrace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
            style={{ background: "rgba(0,0,0,0.8)" }}
            onClick={() => setShowMobileTrace(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md overflow-y-auto bg-canvas"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowMobileTrace(false)}
                className="sticky top-0 z-10 w-full px-8 py-4 font-mono text-xs text-secondary hover:text-primary transition-colors duration-150 text-left bg-canvas border-b border-edge"
              >
                ← close trace
              </button>
              <RetrievalPanel key={`mobile-${traceVersion}`} trace={activeTrace} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
