export type Doctor = {
  id: string;
  name: string;
  specialty: string;
};

export type BodyPart = {
  id: string;
  name: string;
  description: string;
};

export type Citation = {
  title: string;
  document_id: string;
  page?: number;
  section?: string;
  author?: string;
  publication_year?: number;
  document_url?: string;
  display_label?: string;
};

export type Answer = {
  answer: string;
  citations: Citation[];
  guardrails: Record<string, unknown>;
  latency_ms: number;
  follow_up_question?: string;
};

export type QueryRequest = {
  question: string;
  actor: "PATIENT" | "PROVIDER";
  doctor_id?: string | null;
  body_part?: string | null;
};

export type Mode = "PATIENT" | "PROVIDER";
