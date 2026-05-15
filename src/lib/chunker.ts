/**
 * Text chunking utility for splitting extracted PDF text
 * into overlapping chunks for vector embedding.
 */

export function chunkText(
  text: string,
  chunkSize: number = 800,
  chunkOverlap: number = 150
): string[] {
  // Clean the text
  const cleaned = text
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (cleaned.length <= chunkSize) {
    return [cleaned];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    // Determine the end of this chunk
    const end = Math.min(start + chunkSize, cleaned.length);
    const chunk = cleaned.substring(start, end).trim();

    if (chunk.length > 50) {
      chunks.push(chunk);
    }

    // If we've reached the end of the text, stop
    if (end >= cleaned.length) {
      break;
    }

    // Move forward by (chunkSize - overlap) to create overlapping windows
    start += chunkSize - chunkOverlap;
  }

  return chunks;
}
