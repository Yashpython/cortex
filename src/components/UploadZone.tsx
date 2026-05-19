"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";

interface UploadZoneProps {
  onUploadComplete: (documentId: string, title: string, chunkCount: number) => void;
}

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [status, setStatus] = useState<
    "idle" | "uploading" | "extracting" | "processing" | "complete" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setFileName(file.name);
      setStatus("uploading");
      setErrorMsg("");

      try {
        const formData = new FormData();
        formData.append("file", file);

        setStatus("extracting");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        setStatus("processing");

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        setStatus("complete");

        setTimeout(() => {
          onUploadComplete(data.document_id, data.title, data.chunk_count);
        }, 1200);
      } catch (err) {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      }
    },
    [onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: ["uploading", "extracting", "processing"].includes(status),
  });

  const isProcessing = ["uploading", "extracting", "processing"].includes(status);

  return (
    <div
      {...getRootProps()}
      className={`
        relative overflow-hidden cursor-pointer
        flex flex-col items-center justify-center gap-4
        px-8 py-10 rounded-xl
        transition-all duration-300 ease-spring
        border
        ${
          isDragActive
            ? "border-accent bg-accent/5 shadow-[0_0_30px_rgba(99,102,241,0.15)]"
            : "border-edge hover:border-accent/50 bg-gradient-to-b from-[#111111] to-[#0a0a0a] hover:shadow-[0_0_20px_rgba(255,255,255,0.02)]"
        }
        ${isProcessing ? "pointer-events-none" : ""}
      `}
      style={{
        boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.05)",
      }}
    >
      <input {...getInputProps()} />

      {/* Decorative top reflection line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex flex-col items-center gap-3 z-10"
          >
            <div className="p-3 rounded-full bg-surface border border-edge shadow-inner mb-2 transition-transform duration-300 group-hover:scale-110">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isDragActive ? "text-accent" : "text-primary"}
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </div>
            <span className="font-mono text-sm font-medium text-primary tracking-wide">
              {isDragActive ? "Drop to upload" : "Upload Document"}
            </span>
            <span className="font-sans text-xs text-secondary">
              Drag & drop your PDF here
            </span>
          </motion.div>
        )}

        {isProcessing && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 z-10"
          >
            <div className="relative flex items-center justify-center w-12 h-12">
              <div className="absolute inset-0 border-2 border-edge rounded-full" />
              <div className="absolute inset-0 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-sm font-medium text-primary tracking-wide">{fileName}</span>
              <span className="font-mono text-xs text-secondary">
                {status === "uploading" && "Uploading to vector space..."}
                {status === "extracting" && "Extracting contents..."}
                {status === "processing" && "Chunking & embedding..."}
              </span>
            </div>
          </motion.div>
        )}

        {status === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 z-10"
          >
            <div className="p-3 rounded-full bg-accent/10 border border-accent/20 mb-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-accent"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="font-mono text-sm font-medium text-accent">Upload Complete</span>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 z-10"
          >
             <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-down"><path d="M18 6 6 18M6 6l12 12"/></svg>
             </div>
            <span className="font-mono text-sm text-down">{errorMsg}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStatus("idle");
                setErrorMsg("");
              }}
              className="font-sans text-xs text-secondary hover:text-primary transition-colors duration-150 px-4 py-1.5 border border-edge rounded-full bg-surface"
            >
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
