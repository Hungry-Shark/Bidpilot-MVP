import { GoogleGenAI } from "@google/genai";
import { db, auth } from "../firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Generates an embedding for a piece of text.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const result = await ai.models.embedContent({
    model: "gemini-embedding-2-preview",
    content: text,
  });
  return result.embedding.values;
}

/**
 * Chunks text into smaller pieces.
 */
function chunkText(text: string, size = 1000, overlap = 200): string[] {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return chunks;
}

/**
 * Indexes a document for RAG.
 */
export async function indexDocument(docId: string, name: string, content: string) {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User not authenticated");

  const chunks = chunkText(content);
  const chunkCol = collection(db, "users", userId, "knowledge_chunks");

  for (const text of chunks) {
    const embedding = await getEmbedding(text);
    await addDoc(chunkCol, {
      text,
      embedding,
      docId,
      name,
      userId,
      createdAt: serverTimestamp()
    });
  }
}

/**
 * Performs cosine similarity search.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    mA += vecA[i] * vecA[i];
    mB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
}

/**
 * Retrieves relevant context for a query.
 */
export async function retrieveRelevantContext(queryText: string): Promise<string> {
  const userId = auth.currentUser?.uid;
  if (!userId) return "";

  const queryEmbedding = await getEmbedding(queryText);
  const chunkCol = collection(db, "users", userId, "knowledge_chunks");
  const q = query(chunkCol); // In a real large-scale app, we'd use a dedicated vector DB
  const snapshot = await getDocs(q);

  const scoredChunks = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      text: data.text,
      score: cosineSimilarity(queryEmbedding, data.embedding)
    };
  });

  // Sort by score and take top 3
  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(c => c.text)
    .join("\n\n---\n\n");
}

/**
 * Generates graph memory updates based on analysis.
 */
export async function updateGraphMemory(insight: string) {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    config: {
      systemInstruction: "Extract key concepts and their relationships from the provided insight. Format as JSON with 'nodes' (id, label, type) and 'links' (source, target). Types: 'Concept', 'Requirement', 'Entity', 'Risk'.",
      responseMimeType: "application/json"
    },
    contents: insight
  });

  const { nodes = [], links = [] } = JSON.parse(response.text);
  
  const nodesCol = collection(db, "users", userId, "graph_nodes");
  const linksCol = collection(db, "users", userId, "graph_links");

  for (const node of nodes) {
    await addDoc(nodesCol, { ...node, userId, createdAt: serverTimestamp() });
  }
  for (const link of links) {
    await addDoc(linksCol, { ...link, userId, createdAt: serverTimestamp() });
  }
}

/**
 * Fetches the memory graph data.
 */
export async function fetchMemoryGraph() {
  const userId = auth.currentUser?.uid;
  if (!userId) return { nodes: [], links: [] };

  const nodesSnap = await getDocs(collection(db, "users", userId, "graph_nodes"));
  const linksSnap = await getDocs(collection(db, "users", userId, "graph_links"));

  // Deduplicate nodes by ID
  const nodesMap = new Map();
  nodesSnap.docs.forEach(d => {
    const data = d.data();
    nodesMap.set(data.id, { id: data.id, label: data.label, type: data.type });
  });

  return {
    nodes: Array.from(nodesMap.values()),
    links: linksSnap.docs.map(d => ({ source: d.data().source, target: d.data().target }))
  };
}
