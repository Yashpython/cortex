"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle, Loader2, AlertCircle } from "lucide-react";

interface UploadZoneProps {
  onUploadComplete: (documentId: string, title: string, chunkCount: number) => void;
}

const STAGES = [
  { key: "uploading", label: "Uploading PDF...", icon: Upload },
  { key: "extracting", label: "Extracting text...", icon: FileText },
  { key: "processing", label: "Chunking & embedding...", icon: Loader2 },
  { key: "complete", label: "Ready to query!", icon: CheckCircle },
];

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [status, setStatus] = useState<"idle" | "uploading" | "extracting" | "processing" | "complete" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
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

      // Small delay so the user sees the success state
      setTimeout(() => {
        onUploadComplete(data.document_id, data.title, data.chunk_count);
      }, 1200);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: status === "uploading" || status === "extracting" || status === "processing",
  });

  const isProcessing = ["uploading", "extracting", "processing"].includes(status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div
        {...getRootProps()}
        className={`dropzone p-12 text-center transition-all duration-300 ${
          isDragActive ? "active" : ""
        } ${isProcessing ? "pointer-events-none" : ""}`}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                   style={{ background: "var(--accent-glow)" }}>
                <Upload size={28} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
                  {isDragActive ? "Drop your paper here" : "Drop a research paper here"}
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                  or click to browse • PDF only
                </p>
              </div>
            </motion.div>
          )}

          {isProcessing && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2
                size={32}
                className="animate-spin"
                style={{ color: "var(--accent)" }}
              />
              <div>
                <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
                  Processing {fileName}
                </p>
                <div className="flex items-center gap-2 justify-center mt-3">
                  {STAGES.slice(0, 3).map((stage, i) => {
                    const stageIndex = STAGES.findIndex(s => s.key === status);
                    const isActive = i <= stageIndex;
                    return (
                      <div key={stage.key} className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                            isActive ? "pulse-glow" : ""
                          }`}
                          style={{
                            background: isActive ? "var(--accent)" : "var(--text-muted)",
                          }}
                        />
                        <span
                          className="text-xs"
                          style={{
                            color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                          }}
                        >
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {status === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <CheckCircle size={40} style={{ color: "var(--success)" }} />
              <p className="text-lg font-medium" style={{ color: "var(--success)" }}>
                Paper processed successfully!
              </p>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <AlertCircle size={40} style={{ color: "var(--error)" }} />
              <p className="text-lg font-medium" style={{ color: "var(--error)" }}>
                {errorMsg}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStatus("idle");
                  setErrorMsg("");
                }}
                className="text-sm underline mt-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
