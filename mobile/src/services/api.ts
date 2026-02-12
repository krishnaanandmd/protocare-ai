import { Doctor, Answer, QueryRequest } from "../types";

// Update this to your backend URL
// For local development with iOS simulator, use your machine's IP
// For production, use your deployed backend URL
const API_BASE = "https://protocare-ai.onrender.com";

export async function fetchDoctors(): Promise<Doctor[]> {
  const res = await fetch(`${API_BASE}/rag/doctors`);
  if (!res.ok) throw new Error(`Failed to fetch doctors: ${res.status}`);
  return res.json();
}

export async function queryRAG(request: QueryRequest): Promise<Answer> {
  const res = await fetch(`${API_BASE}/rag/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}
