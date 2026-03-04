"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
const CONSENT_PASSWORD = "CareGuideConsent2025";

// ── Types ──────────────────────────────────────────────────────────────

type Physician = { id: string; name: string; specialty: string };
type Procedure = { id: string; name: string };
type Diagnosis = { id: string; name: string; procedures: Procedure[] };
type TranscriptEntry = { role: string; message: string; timestamp: string };
type ChatResponse = {
  response: string;
  phase: string;
  understanding_score: number | null;
  topics_covered: string[];
  ready_to_complete: boolean;
};

// ── Password Gate ──────────────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const locale = useLocale();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === CONSENT_PASSWORD) {
      setError(false);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("cg_consent_auth", "true");
      }
      onAuth();
    } else {
      setError(true);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/50 mb-4">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-400 text-transparent bg-clip-text">
            Informed Consent Tool
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            CareGuide &bull; Work in Progress
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 space-y-6"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Enter access password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className="w-full rounded-xl bg-white/10 border-2 border-white/20 px-4 py-3 text-white placeholder-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/20 transition-all outline-none"
              placeholder="Password"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-sm mt-2">
                Incorrect password. Please try again.
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 active:scale-95 transition-all"
          >
            Access Tool
          </button>
          <div className="text-center">
            <Link
              href={`/${locale}/`}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Back to CareGuide
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Physician Selection Step ───────────────────────────────────────────

function PhysicianSelector({
  physicians,
  selected,
  onSelect,
}: {
  physicians: Physician[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">Select Your Physician</h3>
        <p className="text-sm text-slate-400">Choose the surgeon performing your procedure</p>
      </div>

      <div className="grid gap-3">
        {physicians.map((doc) => (
          <button
            key={doc.id}
            onClick={() => onSelect(doc.id)}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
              selected === doc.id
                ? "border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/20"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            }`}
          >
            <div className="font-bold text-white text-lg">{doc.name}</div>
            <div className="text-sm text-slate-400 mt-1">{doc.specialty}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Diagnosis Selection Step ───────────────────────────────────────────

function DiagnosisSelector({
  diagnoses,
  selected,
  onSelect,
}: {
  diagnoses: Diagnosis[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">Select Your Diagnosis</h3>
        <p className="text-sm text-slate-400">Choose the condition you have been diagnosed with</p>
      </div>

      <div className="grid gap-3">
        {diagnoses.map((diag) => (
          <button
            key={diag.id}
            onClick={() => onSelect(diag.id)}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
              selected === diag.id
                ? "border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/20"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            }`}
          >
            <div className="font-semibold text-white">{diag.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Procedure Selection Step ───────────────────────────────────────────

function ProcedureSelector({
  procedures,
  selected,
  onSelect,
}: {
  procedures: Procedure[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">Select Your Procedure</h3>
        <p className="text-sm text-slate-400">Choose the surgical procedure planned for you</p>
      </div>

      <div className="grid gap-3">
        {procedures.map((proc) => (
          <button
            key={proc.id}
            onClick={() => onSelect(proc.id)}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
              selected === proc.id
                ? "border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/20"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            }`}
          >
            <div className="font-semibold text-white">{proc.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Chat Message Bubble ────────────────────────────────────────────────

function ChatBubble({ entry }: { entry: TranscriptEntry }) {
  const isAssistant = entry.role === "assistant";

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"} mb-4`}>
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-4 ${
          isAssistant
            ? "bg-white/10 border border-white/10 text-white"
            : "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
        }`}
      >
        {isAssistant ? (
          <div className="prose prose-invert prose-sm max-w-none prose-p:text-white prose-p:leading-relaxed prose-li:text-white prose-strong:text-white prose-headings:text-white prose-h1:text-base prose-h2:text-sm prose-h3:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.message}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{entry.message}</p>
        )}
        <div className={`text-xs mt-2 ${isAssistant ? "text-slate-500" : "text-amber-200"}`}>
          {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

// ── Progress Indicator ─────────────────────────────────────────────────

function ConsentProgress({
  topicsCovered,
  understandingScore,
  phase,
}: {
  topicsCovered: string[];
  understandingScore: number | null;
  phase: string;
}) {
  const allTopics = [
    { id: "procedure", label: "Procedure" },
    { id: "risks", label: "Risks" },
    { id: "benefits", label: "Benefits" },
    { id: "alternatives", label: "Alternatives" },
    { id: "recovery", label: "Recovery" },
    { id: "right_to_refuse", label: "Right to Refuse" },
  ];

  const coveredSet = new Set(topicsCovered.map((t) => t.toLowerCase().replace(/\s+/g, "_")));

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-300">Consent Progress</h4>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
          phase === "complete"
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : phase === "verification"
            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
        }`}>
          {phase === "complete" ? "Complete" : phase === "verification" ? "Reviewing" : "In Progress"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {allTopics.map((topic) => {
          const covered = coveredSet.has(topic.id);
          return (
            <div
              key={topic.id}
              className={`text-center p-2 rounded-lg text-xs font-medium transition-all ${
                covered
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/5 text-slate-500 border border-white/5"
              }`}
            >
              {covered && (
                <svg className="w-3 h-3 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {topic.label}
            </div>
          );
        })}
      </div>

      {understandingScore !== null && understandingScore > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Understanding</span>
            <span className={`font-bold ${understandingScore >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
              {understandingScore}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                understandingScore >= 70
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                  : "bg-gradient-to-r from-amber-500 to-orange-500"
              }`}
              style={{ width: `${Math.min(understandingScore, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Completion Summary View ────────────────────────────────────────────

function CompletionView({
  summary,
  emailed,
  physicianName,
  patientConsented,
  onStartNew,
}: {
  summary: string;
  emailed: boolean;
  physicianName: string;
  patientConsented: boolean;
  onStartNew: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              Consent Verification Complete
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {patientConsented
                ? "You have confirmed your understanding and consent to proceed."
                : "You have chosen not to proceed at this time."}
            </p>
          </div>
        </div>

        {emailed && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
            <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-emerald-300">
              A transcript has been emailed to <span className="font-bold">{physicianName}</span>.
            </p>
          </div>
        )}

        {!emailed && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/15 border border-amber-500/30">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-amber-300">
              The transcript has been saved and will be shared with {physicianName}&apos;s office.
            </p>
          </div>
        )}

        <div className="border-t border-white/10 pt-6">
          <h3 className="text-lg font-bold text-white mb-3">Summary Report</h3>
          <div className="bg-white/5 rounded-2xl p-6 prose prose-invert prose-sm max-w-none prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-headings:text-white">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
          </div>
        </div>

        <button
          onClick={onStartNew}
          className="w-full px-6 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Start New Session
        </button>
      </div>
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────────────

export default function InformedConsentPage() {
  const locale = useLocale();

  // Auth state
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("cg_consent_auth") === "true") {
      setAuthenticated(true);
    }
  }, []);

  // Setup wizard state
  const [step, setStep] = useState<"physician" | "diagnosis" | "procedure" | "name" | "chat" | "completed">("physician");
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [selectedPhysician, setSelectedPhysician] = useState<string | null>(null);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [phase, setPhase] = useState("education");
  const [topicsCovered, setTopicsCovered] = useState<string[]>([]);
  const [understandingScore, setUnderstandingScore] = useState<number | null>(null);
  const [readyToComplete, setReadyToComplete] = useState(false);

  // Completion state
  const [completionSummary, setCompletionSummary] = useState("");
  const [completionEmailed, setCompletionEmailed] = useState(false);
  const [patientConsented, setPatientConsented] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Resolved names for display
  const [physicianName, setPhysicianName] = useState("");
  const [diagnosisName, setDiagnosisName] = useState("");
  const [procedureName, setProcedureName] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Fetch physicians
  useEffect(() => {
    if (!authenticated) return;
    fetch(`${API_BASE}/consent/physicians`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(setPhysicians)
      .catch((e) => setError(`Failed to load physicians: ${e}`));
  }, [authenticated]);

  // Fetch diagnoses when physician selected
  useEffect(() => {
    if (!selectedPhysician) return;
    setDiagnoses([]);
    setSelectedDiagnosis(null);
    setSelectedProcedure(null);
    fetch(`${API_BASE}/consent/physicians/${selectedPhysician}/diagnoses`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(setDiagnoses)
      .catch((e) => setError(`Failed to load diagnoses: ${e}`));
  }, [selectedPhysician]);

  // Handle physician selection
  const handlePhysicianSelect = (id: string) => {
    setSelectedPhysician(id);
    const doc = physicians.find((p) => p.id === id);
    if (doc) setPhysicianName(doc.name);
    setStep("diagnosis");
  };

  // Handle diagnosis selection
  const handleDiagnosisSelect = (id: string) => {
    setSelectedDiagnosis(id);
    const diag = diagnoses.find((d) => d.id === id);
    if (diag) setDiagnosisName(diag.name);
    setStep("procedure");
  };

  // Handle procedure selection
  const handleProcedureSelect = (id: string) => {
    setSelectedProcedure(id);
    const diag = diagnoses.find((d) => d.id === selectedDiagnosis);
    const proc = diag?.procedures.find((p) => p.id === id);
    if (proc) setProcedureName(proc.name);
    setStep("name");
  };

  // Start the consent session
  const startSession = async () => {
    if (!selectedPhysician || !selectedDiagnosis || !selectedProcedure || !patientName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/consent/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          physician_id: selectedPhysician,
          diagnosis_id: selectedDiagnosis,
          procedure_id: selectedProcedure,
          patient_name: patientName.trim(),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setSessionId(data.session_id);
      setTranscript([
        {
          role: "assistant",
          message: data.greeting,
          timestamp: new Date().toISOString(),
        },
      ]);
      setStep("chat");
    } catch (e: any) {
      setError(e?.message || "Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  // Send chat message
  const sendMessage = useCallback(async () => {
    if (!chatInput.trim() || !sessionId || chatLoading) return;
    const userMessage = chatInput.trim();
    setChatInput("");
    setChatLoading(true);

    const userEntry: TranscriptEntry = {
      role: "patient",
      message: userMessage,
      timestamp: new Date().toISOString(),
    };
    setTranscript((prev) => [...prev, userEntry]);

    try {
      const res = await fetch(`${API_BASE}/consent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: userMessage }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data: ChatResponse = await res.json();
      const assistantEntry: TranscriptEntry = {
        role: "assistant",
        message: data.response,
        timestamp: new Date().toISOString(),
      };
      setTranscript((prev) => [...prev, assistantEntry]);
      setPhase(data.phase);
      setTopicsCovered(data.topics_covered);
      setUnderstandingScore(data.understanding_score);
      setReadyToComplete(data.ready_to_complete);
    } catch (e: any) {
      const errorEntry: TranscriptEntry = {
        role: "assistant",
        message: "I'm sorry, I had a temporary issue. Please try sending your message again.",
        timestamp: new Date().toISOString(),
      };
      setTranscript((prev) => [...prev, errorEntry]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, sessionId, chatLoading]);

  // Complete session
  const completeSession = async (consents: boolean) => {
    if (!sessionId) return;
    setCompleting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/consent/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          patient_confirms_consent: consents,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setCompletionSummary(data.summary);
      setCompletionEmailed(data.emailed);
      setPatientConsented(data.patient_consented);
      setStep("completed");
    } catch (e: any) {
      setError(e?.message || "Failed to complete session");
    } finally {
      setCompleting(false);
    }
  };

  // Reset for new session
  const resetAll = () => {
    setStep("physician");
    setSelectedPhysician(null);
    setSelectedDiagnosis(null);
    setSelectedProcedure(null);
    setPatientName("");
    setSessionId(null);
    setTranscript([]);
    setChatInput("");
    setPhase("education");
    setTopicsCovered([]);
    setUnderstandingScore(null);
    setReadyToComplete(false);
    setCompletionSummary("");
    setCompletionEmailed(false);
    setPatientConsented(false);
    setError(null);
  };

  // ── Password gate ────────────────────────────────────────────────────
  if (!authenticated) {
    return <PasswordGate onAuth={() => setAuthenticated(true)} />;
  }

  // ── Resolved procedure list for current diagnosis ────────────────────
  const currentDiagnosis = diagnoses.find((d) => d.id === selectedDiagnosis);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <Link href={`/${locale}/`}>
                  <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 text-transparent bg-clip-text hover:from-amber-300 hover:to-orange-300 transition-all cursor-pointer">
                    Informed Consent
                  </h1>
                </Link>
                <p className="text-xs text-amber-300/70">CareGuide</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {step === "chat" && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  phase === "complete"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}>
                  {phase === "complete" ? "Ready" : "In Progress"}
                </span>
              )}
              <Link
                href={`/${locale}/app`}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                CareGuide Q&A
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-300">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Setup Wizard ────────────────────────────────────────── */}
        {step !== "chat" && step !== "completed" && (
          <div className="max-w-xl mx-auto space-y-6">
            {/* Breadcrumb / Step indicator */}
            <div className="flex items-center justify-center gap-2 text-sm">
              {["Physician", "Diagnosis", "Procedure", "Your Name"].map((label, i) => {
                const stepMap = ["physician", "diagnosis", "procedure", "name"];
                const stepIdx = stepMap.indexOf(step);
                const isActive = i === stepIdx;
                const isDone = i < stepIdx;
                return (
                  <React.Fragment key={label}>
                    {i > 0 && (
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full font-medium transition-all ${
                        isActive
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : isDone
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-pointer"
                          : "text-slate-500"
                      }`}
                      onClick={() => {
                        if (isDone) setStep(stepMap[i] as any);
                      }}
                    >
                      {isDone ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          {label}
                        </span>
                      ) : (
                        label
                      )}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 flex gap-3">
              <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-amber-200">
                This tool supplements your informed consent discussion with your surgeon. It does not replace the in-person conversation with your physician.
              </p>
            </div>

            {/* Step content */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
              {step === "physician" && (
                <PhysicianSelector
                  physicians={physicians}
                  selected={selectedPhysician}
                  onSelect={handlePhysicianSelect}
                />
              )}

              {step === "diagnosis" && (
                <>
                  <DiagnosisSelector
                    diagnoses={diagnoses}
                    selected={selectedDiagnosis}
                    onSelect={handleDiagnosisSelect}
                  />
                  <button
                    onClick={() => setStep("physician")}
                    className="mt-4 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to physician
                  </button>
                </>
              )}

              {step === "procedure" && currentDiagnosis && (
                <>
                  <ProcedureSelector
                    procedures={currentDiagnosis.procedures}
                    selected={selectedProcedure}
                    onSelect={handleProcedureSelect}
                  />
                  <button
                    onClick={() => setStep("diagnosis")}
                    className="mt-4 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to diagnosis
                  </button>
                </>
              )}

              {step === "name" && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">Enter Your Name</h3>
                    <p className="text-sm text-slate-400">This will be included in the consent documentation</p>
                  </div>

                  {/* Summary of selections */}
                  <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Physician</span>
                      <span className="text-white font-medium">{physicianName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Diagnosis</span>
                      <span className="text-white font-medium">{diagnosisName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Procedure</span>
                      <span className="text-white font-medium">{procedureName}</span>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full rounded-xl bg-white/10 border-2 border-white/20 px-4 py-3 text-white placeholder-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/20 transition-all outline-none"
                    placeholder="Your full name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && patientName.trim()) startSession();
                    }}
                  />

                  <button
                    onClick={startSession}
                    disabled={!patientName.trim() || loading}
                    className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all transform ${
                      patientName.trim() && !loading
                        ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 hover:scale-[1.02] active:scale-95"
                        : "bg-white/5 text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Starting session...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Begin Informed Consent Review
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setStep("procedure")}
                    className="w-full text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to procedure
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Chat Interface ──────────────────────────────────────── */}
        {step === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
              {/* Session info */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 space-y-3">
                <h4 className="text-sm font-bold text-slate-300">Session Details</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500">Patient</span>
                    <p className="text-white font-medium">{patientName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Physician</span>
                    <p className="text-white font-medium">{physicianName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Diagnosis</span>
                    <p className="text-white font-medium">{diagnosisName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Procedure</span>
                    <p className="text-white font-medium">{procedureName}</p>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <ConsentProgress
                topicsCovered={topicsCovered}
                understandingScore={understandingScore}
                phase={phase}
              />

              {/* Complete button */}
              {readyToComplete && (
                <div className="space-y-2">
                  <button
                    onClick={() => completeSession(true)}
                    disabled={completing}
                    className="w-full px-4 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {completing ? "Completing..." : "I Consent & Understand"}
                  </button>
                  <button
                    onClick={() => completeSession(false)}
                    disabled={completing}
                    className="w-full px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all disabled:opacity-50"
                  >
                    I do not wish to proceed
                  </button>
                </div>
              )}
            </div>

            {/* Chat area */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 flex flex-col" style={{ height: "calc(100vh - 180px)" }}>
                {/* Chat messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-2">
                  {transcript.map((entry, i) => (
                    <ChatBubble key={i} entry={entry} />
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start mb-4">
                      <div className="bg-white/10 border border-white/10 rounded-2xl px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                          <span className="text-xs text-slate-500">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input area */}
                <div className="border-t border-white/10 p-4">
                  <div className="flex gap-3">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="flex-1 rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white text-sm placeholder-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none resize-none"
                      placeholder="Type your response..."
                      rows={2}
                      disabled={chatLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!chatInput.trim() || chatLoading}
                      className={`px-5 rounded-xl font-bold transition-all ${
                        chatInput.trim() && !chatLoading
                          ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 active:scale-95"
                          : "bg-white/5 text-slate-600 cursor-not-allowed"
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Completion View ─────────────────────────────────────── */}
        {step === "completed" && (
          <div className="max-w-3xl mx-auto">
            <CompletionView
              summary={completionSummary}
              emailed={completionEmailed}
              physicianName={physicianName}
              patientConsented={patientConsented}
              onStartNew={resetAll}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-xl mt-12">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center">
          <p className="text-xs text-slate-500">
            CareGuide Informed Consent Tool &bull; Work in Progress &bull; This tool supplements but does not replace your in-person informed consent discussion with your physician.
          </p>
        </div>
      </footer>
    </div>
  );
}
