// Shared types used across the entire Cortex application

export interface Document {
  id: string;
  title: string;
  file_url: string | null;
  created_at: string;
}

export interface Chunk {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  embedding: number[];
  created_at: string;
}

// Retrieval transparency types — the star of the show
export interface RetrievedChunk {
  id: string;
  content: string;
  chunk_index: number;
  similarity: number;
}

export interface RerankedChunk extends RetrievedChunk {
  original_rank: number;
  new_rank: number;
  relevance_score: number;
  movement: "up" | "down" | "stayed";
}

export interface RetrievalTrace {
  query: string;
  // Step 1: Raw vector search results
  retrieved_chunks: RetrievedChunk[];
  // Step 2: After re-ranking
  reranked_chunks: RerankedChunk[];
  // Step 3: Final context sent to LLM
  final_context: string;
  // Step 4: The answer
  answer: string;
  // Confidence score (based on top similarity)
  confidence: number;
  // Timing
  retrieval_time_ms: number;
  total_time_ms: number;
}

export interface UploadProgress {
  stage: "uploading" | "extracting" | "chunking" | "embedding" | "storing" | "complete";
  progress: number; // 0-100
  message: string;
}

export interface QueryRequest {
  document_id: string;
  question: string;
}

export interface QueryResponse {
  trace: RetrievalTrace;
}
