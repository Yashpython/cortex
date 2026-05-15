import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "@/lib/gemini";
import { chunkText } from "@/lib/chunker";

// Route segment config
export const maxDuration = 60;

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Extract text from a PDF buffer using unpdf.
 * unpdf is built for serverless environments — no web workers needed.
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const { extractText } = await import("unpdf");
  const result = await extractText(new Uint8Array(buffer));
  return Array.isArray(result.text) ? result.text.join("\n\n") : result.text;
}

export async function POST(request: NextRequest) {
  try {
    console.log("[UPLOAD] Starting upload...");
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("[UPLOAD] File received:", file.name, file.size, "bytes");

    if (!file.name.endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Step 1: Extract text from PDF
    console.log("[UPLOAD] Step 1: Extracting text...");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extractedText = await extractTextFromPDF(buffer);
    console.log("[UPLOAD] Text extracted:", extractedText.length, "chars");

    if (!extractedText || extractedText.trim().length < 100) {
      return NextResponse.json(
        { error: "Could not extract enough text from this PDF. It may be image-based." },
        { status: 400 }
      );
    }

    // Step 2: Create document record
    const title = file.name.replace(".pdf", "");
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({ title, file_url: null })
      .select()
      .single();

    if (docError) {
      console.error("Document insert error:", docError);
      return NextResponse.json(
        { error: "Failed to save document" },
        { status: 500 }
      );
    }

    // Step 3: Chunk the text
    const chunks = chunkText(extractedText, 800, 150);

    // Step 4: Embed each chunk and store in Supabase
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      const embeddings = await Promise.all(
        batch.map((chunk) => generateEmbedding(chunk))
      );

      const rows = batch.map((content, idx) => ({
        document_id: doc.id,
        content,
        chunk_index: i + idx,
        embedding: JSON.stringify(embeddings[idx]),
      }));

      const { error: chunkError } = await supabase
        .from("chunks")
        .insert(rows);

      if (chunkError) {
        console.error("Chunk insert error:", chunkError);
        // Clean up the document if chunks fail
        await supabase.from("documents").delete().eq("id", doc.id);
        return NextResponse.json(
          { error: "Failed to process document chunks" },
          { status: 500 }
        );
      }

      // Small delay between batches to respect rate limits
      if (i + batchSize < chunks.length) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    return NextResponse.json({
      document_id: doc.id,
      title: doc.title,
      chunk_count: chunks.length,
      text_length: extractedText.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
}
