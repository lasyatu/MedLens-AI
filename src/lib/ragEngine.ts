/**
 * Real RAG (Retrieval-Augmented Generation) Pipeline
 * - Text chunking with configurable window and overlap
 * - Term-frequency / Vector embedding calculation
 * - Cosine similarity semantic search
 * - Wrong-medicine rejection and strict metadata filtering
 * - Abstention handling when evidence is insufficient
 */

import { AUTHORITATIVE_MEDICINES, MedicineRecord, SourceCitation } from './authoritativeData';

export interface DocumentChunk {
  id: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  sectionTitle: string;
  content: string;
  chunkIndex: number;
  wordCount: number;
  source: SourceCitation;
  vector?: number[];
}

export interface RetrievalResult {
  chunk: DocumentChunk;
  similarityScore: number;
  relevanceExplanation: string;
}

export interface RAGSearchResponse {
  query: string;
  confirmedMedicine: string;
  matchedChunks: RetrievalResult[];
  abstain: boolean;
  abstentionReason?: string;
  sourcesUsed: SourceCitation[];
}

/**
 * Split text into chunks with sliding overlap window
 */
export function chunkTextWithOverlap(
  text: string,
  chunkSize: number = 250, // character target
  overlap: number = 50
): string[] {
  if (!text || text.trim().length === 0) return [];
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks: string[] = [];
  const wordsPerChunk = Math.max(15, Math.floor(chunkSize / 6));
  const wordsOverlap = Math.max(4, Math.floor(overlap / 6));

  let startIndex = 0;
  while (startIndex < words.length) {
    const chunkWords = words.slice(startIndex, startIndex + wordsPerChunk);
    chunks.push(chunkWords.join(' '));
    startIndex += (wordsPerChunk - wordsOverlap);
    if (startIndex >= words.length - wordsOverlap && startIndex < words.length) {
      // Avoid tiny trailing chunk
      break;
    }
  }

  return chunks;
}

/**
 * Tokenize text and build frequency vector over vocabulary
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

/**
 * Build vocabulary from chunks
 */
export function buildVocabulary(chunks: string[]): string[] {
  const vocabSet = new Set<string>();
  for (const chunk of chunks) {
    for (const token of tokenize(chunk)) {
      vocabSet.add(token);
    }
  }
  return Array.from(vocabSet).sort();
}

/**
 * Create vector for text against fixed vocabulary
 */
export function createVector(text: string, vocabulary: string[]): number[] {
  const tokens = tokenize(text);
  const counts: Record<string, number> = {};
  for (const t of tokens) {
    counts[t] = (counts[t] || 0) + 1;
  }
  return vocabulary.map(word => counts[word] || 0);
}

/**
 * Calculate cosine similarity between two numeric vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * In-memory searchable Vector Index for authoritative medicine monographs
 */
export class MedicineVectorIndex {
  private chunks: DocumentChunk[] = [];
  private vocabulary: string[] = [];

  constructor() {
    this.ingestAllMedicines();
  }

  /**
   * Ingest all verified medicine monographs, chunk them, and build the vector index
   */
  public ingestAllMedicines(medicines: MedicineRecord[] = AUTHORITATIVE_MEDICINES): void {
    this.chunks = [];
    const allChunkTexts: string[] = [];

    for (const med of medicines) {
      for (const sec of med.monographSections) {
        const sourceCitation = med.sources[sec.citationIndex] || med.sources[0];
        const rawChunks = chunkTextWithOverlap(sec.content, 220, 40);

        rawChunks.forEach((chunkContent, idx) => {
          const chunkId = `${med.id}_${sec.sectionTitle.replace(/[^A-Za-z0-9]/g, '')}_${idx}`;
          const chunkObj: DocumentChunk = {
            id: chunkId,
            medicineId: med.id,
            medicineName: med.medicineName,
            genericName: med.genericName,
            sectionTitle: sec.sectionTitle,
            content: chunkContent,
            chunkIndex: idx,
            wordCount: chunkContent.split(/\s+/).length,
            source: sourceCitation
          };
          this.chunks.push(chunkObj);
          allChunkTexts.push(`${sec.sectionTitle} ${chunkContent}`);
        });
      }
    }

    // Build vector vocabulary
    this.vocabulary = buildVocabulary(allChunkTexts);

    // Compute vectors
    for (const chunk of this.chunks) {
      const fullText = `${chunk.medicineName} ${chunk.genericName} ${chunk.sectionTitle} ${chunk.content}`;
      chunk.vector = createVector(fullText, this.vocabulary);
    }
  }

  public getChunkCount(): number {
    return this.chunks.length;
  }

  public getChunks(): DocumentChunk[] {
    return this.chunks;
  }

  /**
   * Search for evidence matching a user question and verified medicine
   * Strictly filters out wrong-medicine chunks
   */
  public search(
    query: string,
    targetMedicineId?: string,
    topK: number = 3,
    minSimilarityThreshold: number = 0.08
  ): RAGSearchResponse {
    if (!query || query.trim().length === 0) {
      return {
        query,
        confirmedMedicine: targetMedicineId || 'Unknown',
        matchedChunks: [],
        abstain: true,
        abstentionReason: 'Empty query submitted. Please provide a question or label query to retrieve evidence.',
        sourcesUsed: []
      };
    }

    const queryVector = createVector(query, this.vocabulary);
    const scoredChunks: RetrievalResult[] = [];

    for (const chunk of this.chunks) {
      // WRONG MEDICINE FILTER: If target medicine is specified, discard all other medicines' chunks!
      if (targetMedicineId && chunk.medicineId !== targetMedicineId) {
        continue;
      }

      if (!chunk.vector) continue;
      const score = cosineSimilarity(queryVector, chunk.vector);

      if (score >= minSimilarityThreshold) {
        scoredChunks.push({
          chunk,
          similarityScore: Math.round(score * 1000) / 1000,
          relevanceExplanation: `Matched on section "${chunk.sectionTitle}" in verified ${chunk.source.publisher} monograph with similarity score ${score.toFixed(3)}.`
        });
      }
    }

    // Sort descending by score
    scoredChunks.sort((a, b) => b.similarityScore - a.similarityScore);
    const topResults = scoredChunks.slice(0, topK);

    // ABSTENTION RULE: If no chunks cleared threshold, abstain explicitly
    if (topResults.length === 0) {
      return {
        query,
        confirmedMedicine: targetMedicineId || 'All',
        matchedChunks: [],
        abstain: true,
        abstentionReason: `No authoritative evidence was found with sufficient confidence matching "${query}". MedLens AI abstains from answering rather than hallucinating medicine facts.`,
        sourcesUsed: []
      };
    }

    // Deduplicate sources
    const sourcesMap = new Map<string, SourceCitation>();
    for (const res of topResults) {
      sourcesMap.set(res.chunk.source.documentId, res.chunk.source);
    }

    return {
      query,
      confirmedMedicine: targetMedicineId || topResults[0].chunk.medicineName,
      matchedChunks: topResults,
      abstain: false,
      sourcesUsed: Array.from(sourcesMap.values())
    };
  }
}

// Global singleton vector index for fast in-process retrieval
export const globalVectorIndex = new MedicineVectorIndex();
