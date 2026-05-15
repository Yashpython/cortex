import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const embeddingModel = genAI.getGenerativeModel({
  model: "gemini-embedding-001",
});

export const chatModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

export async function generateAnswer(
  question: string,
  context: string
): Promise<string> {
  const prompt = `You are a precise research assistant. Answer the following question based ONLY on the provided context. If the context doesn't contain enough information to answer, say so clearly. Be concise and cite specific parts of the context.

CONTEXT:
${context}

QUESTION: ${question}

ANSWER:`;

  const result = await chatModel.generateContent(prompt);
  return result.response.text();
}
