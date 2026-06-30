import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateEmbedding, generateAnswer } from "@/lib/gemini";
import type { RetrievedChunk, RerankedChunk, RetrievalTrace } from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * LLM-based re-ranking: uses Gemini to score each chunk's relevance
 * to the query on a scale of 0-1. This replaces Cohere for deployment
 * simplicity while demonstrating the same re-ranking concept.
 */
async function rerankChunks(
  query: string,
  chunks: RetrievedChunk[]
): Promise<RerankedChunk[]> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a relevance scoring system. Score how relevant each text chunk is to the given query.
Return ONLY a JSON array of numbers between 0 and 1, where 1 means perfectly relevant.

Query: "${query}"

Chunks:
${chunks.map((c, i) => `[${i}]: ${c.content.substring(0, 300)}`).join("\n\n")}

Return ONLY a JSON array like [0.9, 0.3, 0.7, ...] with exactly ${chunks.length} scores. No other text.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    // Extract JSON array from response
    const match = text.match(/\[[\d\s,.\n]+\]/);
    if (match) {
      const scores: number[] = JSON.parse(match[0]);

      return chunks
        .map((chunk, i) => ({
          ...chunk,
          original_rank: i + 1,
          new_rank: 0, // will be set after sorting
          relevance_score: scores[i] ?? chunk.similarity,
          movement: "stayed" as const,
        }))
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .map((chunk, i) => ({
          ...chunk,
          new_rank: i + 1,
          movement:
            chunk.original_rank > i + 1
              ? ("up" as const)
              : chunk.original_rank < i + 1
                ? ("down" as const)
                : ("stayed" as const),
        }));
    }
  } catch (e) {
    console.error("Re-ranking failed, falling back to similarity order:", e);
  }

  // Fallback: keep original order
  return chunks.map((chunk, i) => ({
    ...chunk,
    original_rank: i + 1,
    new_rank: i + 1,
    relevance_score: chunk.similarity,
    movement: "stayed" as const,
  }));
}

export async function POST(request: NextRequest) {
  const totalStart = performance.now();

  try {
    const { document_id, question } = await request.json();

    if (!document_id || !question) {
      return NextResponse.json(
        { error: "document_id and question are required" },
        { status: 400 }
      );
    }

    // Step 1: Embed the query
    const queryEmbedding = await generateEmbedding(question);

    // Step 2: Vector similarity search via Supabase RPC
    const retrievalStart = performance.now();
    const { data: matches, error } = await supabase.rpc("match_chunks", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_count: 8,
      filter_document_id: document_id,
    });

    if (error) {
      console.error("Vector search error:", error);
      return NextResponse.json(
        { error: "Vector search failed" },
        { status: 500 }
      );
    }

    const retrievalTimeMs = Math.round(performance.now() - retrievalStart);

    const retrievedChunks: RetrievedChunk[] = (matches || []).map(
      (m: { id: string; content: string; chunk_index: number; similarity: number }) => ({
        id: m.id,
        content: m.content,
        chunk_index: m.chunk_index,
        similarity: Math.round(m.similarity * 1000) / 1000,
      })
    );

    // Step 3: Re-rank using LLM
    const rerankedChunks = await rerankChunks(question, retrievedChunks);

    // Step 4: Build context from top 3 re-ranked chunks
    const topChunks = rerankedChunks.slice(0, 3);
    const finalContext = topChunks.map((c) => c.content).join("\n\n---\n\n");

    // Step 5: Generate answer
    const answer = await generateAnswer(question, finalContext);

    // Calculate confidence from top re-ranked score
    const confidence = Math.round(
      (topChunks[0]?.relevance_score ?? 0) * 100
    );

    const totalTimeMs = Math.round(performance.now() - totalStart);

    const trace: RetrievalTrace = {
      query: question,
      retrieved_chunks: retrievedChunks,
      reranked_chunks: rerankedChunks,
      final_context: finalContext,
      answer,
      confidence,
      retrieval_time_ms: retrievalTimeMs,
      total_time_ms: totalTimeMs,
    };

    return NextResponse.json({ trace });
  } catch (error) {
    console.error("Query error:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}
