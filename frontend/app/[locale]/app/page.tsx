"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { DoctorAutocomplete } from "@/components/DoctorAutocomplete";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

type Citation = { title: string; document_id: string; page?: number; section?: string; author?: string; publication_year?: number; document_url?: string; display_label?: string; };
type Answer = { answer: string; citations: Citation[]; guardrails: Record<string, any>; latency_ms: number; follow_up_question?: string; clarifying_questions?: string[]; };
type Doctor = { id: string; name: string; specialty: string; };
type BodyPart = { id: string; name: string; description: string; };

export default function PatientQA() {
  const t = useTranslations();
  const locale = useLocale();
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<"PATIENT" | "PROVIDER">("PATIENT");
  const [data, setData] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clarification flow state: tracks the original question and the user's
  // inline answers to each selected clarifying question (question -> answer text).
  const [originalQuestion, setOriginalQuestion] = useState<string | null>(null);
  const [selectedClarifications, setSelectedClarifications] = useState<Map<string, string>>(new Map());

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);

  // Fetch all doctors from the API
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch(`${API_BASE}/rag/doctors`);
        if (res.ok) {
          const doctorsData = await res.json();
          setDoctors(doctorsData);
        }
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      }
    };
    fetchDoctors();
  }, []);

  const bodyParts = useMemo<BodyPart[]>(() => [
    { id: "shoulder", name: t('qa.selection.bodyParts.shoulder'), description: "Shoulder joint and rotator cuff" },
    { id: "elbow", name: t('qa.selection.bodyParts.elbow'), description: "Elbow joint and surrounding structures" },
    { id: "hand_wrist", name: t('qa.selection.bodyParts.handWrist'), description: "Hand, wrist, and finger joints" },
    { id: "hip", name: t('qa.selection.bodyParts.hip'), description: "Hip joint and surrounding structures" },
    { id: "knee", name: t('qa.selection.bodyParts.knee'), description: "Knee joint including ACL, MCL, meniscus" },
    { id: "ankle_foot", name: t('qa.selection.bodyParts.ankleFoot'), description: "Ankle, foot, and toe joints" },
    { id: "spine", name: t('qa.selection.bodyParts.spine'), description: "Cervical, thoracic, and lumbar spine" },
  ], [t]);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);

  // Handlers that enforce mutual exclusivity
  const handleDoctorSelect = (doctorId: string | null) => {
    setSelectedDoctor(doctorId);
    if (doctorId) {
      setSelectedBodyPart(null); // Clear body part when doctor is selected
    }
  };

  const handleBodyPartSelect = (bodyPartId: string) => {
    setSelectedBodyPart(bodyPartId);
    setSelectedDoctor(null); // Clear doctor when body part is selected
  };

  const canAsk = useMemo(() =>
    question.trim().length > 3 && !loading && (selectedDoctor || selectedBodyPart),
    [question, loading, selectedDoctor, selectedBodyPart]
  );

  const ask = useCallback(async (skipClarification = false) => {
    if (!canAsk) return;
    setLoading(true); setError(null); setData(null);
    try {
      const res = await fetch(`${API_BASE}/rag/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          actor: mode,
          doctor_id: selectedDoctor,
          body_part: selectedBodyPart,
          skip_clarification: skipClarification,
        }),
      });
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
      const json: Answer = await res.json();

      // If clarifying questions are returned, save the original question
      // so we can preserve context when the user responds.
      if (json.clarifying_questions && json.clarifying_questions.length > 0) {
        setOriginalQuestion(question.trim());
        setSelectedClarifications(new Map());
      } else {
        // Clear clarification state on a successful full answer
        setOriginalQuestion(null);
        setSelectedClarifications(new Map());
      }

      setData(json);
    } catch (e: any) { setError(e?.message || "Something went wrong"); }
    finally { setLoading(false); }
  }, [question, mode, canAsk, selectedDoctor, selectedBodyPart]);

  // Submit clarification responses: combines the original question with
  // the selected clarifying details and their inline answers, then runs the full RAG pipeline.
  const submitWithClarifications = useCallback(async (clarifications: Map<string, string>) => {
    if (!originalQuestion) return;
    const parts = [originalQuestion];
    if (clarifications.size > 0) {
      parts.push("\nAdditional details:");
      clarifications.forEach((answer, question) => {
        if (answer.trim()) {
          parts.push(`- ${question}: ${answer.trim()}`);
        } else {
          parts.push(`- ${question}`);
        }
      });
    }
    const combined = parts.join("\n");
    setQuestion(combined);
    // We need to send the request directly since setQuestion is async
    setLoading(true); setError(null); setData(null);
    try {
      const res = await fetch(`${API_BASE}/rag/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: combined,
          actor: mode,
          doctor_id: selectedDoctor,
          body_part: selectedBodyPart,
          skip_clarification: true,  // Already went through clarification
        }),
      });
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
      const json: Answer = await res.json();
      setOriginalQuestion(null);
      setSelectedClarifications(new Map());
      setData(json);
    } catch (e: any) { setError(e?.message || "Something went wrong"); }
    finally { setLoading(false); }
  }, [originalQuestion, mode, selectedDoctor, selectedBodyPart]);

  // Toggle a clarifying question selection on/off
  const toggleClarification = useCallback((q: string) => {
    setSelectedClarifications((prev) => {
      const next = new Map(prev);
      if (next.has(q)) {
        next.delete(q);
      } else {
        next.set(q, "");
      }
      return next;
    });
  }, []);

  // Update the inline answer for a selected clarifying question
  const updateClarificationAnswer = useCallback((q: string, answer: string) => {
    setSelectedClarifications((prev) => {
      const next = new Map(prev);
      next.set(q, answer);
      return next;
    });
  }, []);

  const selectedDoctorName = doctors.find(d => d.id === selectedDoctor)?.name;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="relative">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-cyan-500/50">
                  <span className="text-white font-black text-3xl">C</span>
                </div>
                <div>
                  <Link href={`/${locale}/`}>
                    <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 text-transparent bg-clip-text hover:from-cyan-300 hover:to-teal-300 transition-all cursor-pointer">
                      {t('common.careguide')}
                    </h1>
                  </Link>
                  <p className="text-sm text-cyan-300">{t('qa.header.tagline')}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Link
                  href={`/${locale}/about`}
                  className="text-slate-300 hover:text-white transition-colors font-semibold"
                >
                  {t('qa.header.aboutUs')}
                </Link>
                <ModeToggle mode={mode} onChange={setMode} />
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="pt-20 pb-16 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-cyan-500/50">
                <span className="text-white font-black text-4xl">C</span>
              </div>
              <h2 className="text-5xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 text-transparent bg-clip-text">
                {t('common.careguide')}
              </h2>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-5xl mx-auto px-6 pb-20 space-y-8">

          <Disclaimer mode={mode} />

          {/* Selection Section */}
          <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 space-y-6">
            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-bold text-white">{t('qa.selection.title')}</h3>
              <p className="text-sm text-slate-400">{t('qa.selection.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Surgeon Section */}
              <div
                className={`relative rounded-2xl border-2 p-6 transition-all duration-300 ${
                  selectedDoctor
                    ? "border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20"
                    : selectedBodyPart
                    ? "border-white/10 bg-white/5 opacity-40 pointer-events-none"
                    : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/[0.07]"
                }`}
              >
                {/* Active indicator */}
                {selectedDoctor && (
                  <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full bg-cyan-500 text-white text-xs font-bold shadow-lg">
                    Active
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-white">{t('qa.selection.surgeon.title')}</h4>
                    </div>
                    {selectedDoctor && (
                      <button
                        onClick={() => { handleDoctorSelect(null); }}
                        className="text-xs text-slate-400 hover:text-white border border-white/20 hover:border-white/40 rounded-lg px-3 py-1.5 transition-all"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  <DoctorAutocomplete
                    doctors={doctors}
                    selectedDoctorId={selectedDoctor}
                    onSelect={handleDoctorSelect}
                    disabled={!!selectedBodyPart}
                  />

                  {selectedDoctorName && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-white/20">
                      <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium text-white">
                        {t('qa.selection.surgeon.connected')} <span className="font-bold">{selectedDoctorName}</span> {t('qa.selection.surgeon.protocols')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* OR Divider - visible on mobile between the cards */}
              <div className="flex md:hidden items-center justify-center -my-3">
                <div className="flex-1 border-t border-white/20"></div>
                <span className="px-4 text-sm font-bold text-slate-300 bg-transparent">{t('qa.selection.or')}</span>
                <div className="flex-1 border-t border-white/20"></div>
              </div>

              {/* Body Part Section */}
              <div
                className={`relative rounded-2xl border-2 p-6 transition-all duration-300 ${
                  selectedBodyPart
                    ? "border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                    : selectedDoctor
                    ? "border-white/10 bg-white/5 opacity-40 pointer-events-none"
                    : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/[0.07]"
                }`}
              >
                {/* Active indicator */}
                {selectedBodyPart && (
                  <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full bg-purple-500 text-white text-xs font-bold shadow-lg">
                    Active
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30 text-2xl">
                        🦴
                      </div>
                      <h4 className="text-lg font-bold text-white">{t('qa.selection.bodyPart.title')}</h4>
                    </div>
                    {selectedBodyPart && (
                      <button
                        onClick={() => { setSelectedBodyPart(null); }}
                        className="text-xs text-slate-400 hover:text-white border border-white/20 hover:border-white/40 rounded-lg px-3 py-1.5 transition-all"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {bodyParts.map((bodyPart) => (
                      <button
                        key={bodyPart.id}
                        onClick={() => handleBodyPartSelect(bodyPart.id)}
                        disabled={!!selectedDoctor}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          selectedBodyPart === bodyPart.id
                            ? "bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-400 shadow-lg shadow-purple-500/30"
                            : selectedDoctor
                            ? "bg-white/5 border-white/10 cursor-not-allowed"
                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="font-semibold text-white text-sm">{bodyPart.name}</div>
                      </button>
                    ))}
                  </div>

                  {selectedBodyPart && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-white/20">
                      <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium text-white">
                        {t('qa.selection.bodyPart.using')} <span className="font-bold">{bodyParts.find(b => b.id === selectedBodyPart)?.name}</span> {t('qa.selection.bodyPart.model')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop OR overlay - centered between the two cards */}
            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center shadow-xl">
                <span className="text-sm font-bold text-slate-300">{t('qa.selection.or')}</span>
              </div>
            </div>
          </div>

          {/* Question Input */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">{t('qa.question.title')}</h3>
            </div>

            <textarea
              className="w-full rounded-2xl bg-white/10 border-2 border-white/20 backdrop-blur-sm px-4 py-4 !text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all outline-none resize-none disabled:opacity-30"
              style={{ color: '#ffffff' }}
              rows={4}
              placeholder={
                selectedDoctorName
                  ? t('qa.question.placeholder.doctor', { doctorName: selectedDoctorName })
                  : selectedBodyPart
                  ? t('qa.question.placeholder.bodyPart', { bodyPart: bodyParts.find(b => b.id === selectedBodyPart)?.name.toLowerCase() })
                  : t('qa.question.placeholder.default')
              }
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canAsk) ask(); }}
              disabled={!selectedDoctor && !selectedBodyPart}
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{t('qa.question.shortcut')}</span>
              <button
                disabled={!canAsk}
                onClick={() => ask()}
                className={`group relative px-8 py-4 rounded-xl font-bold text-lg transition-all transform ${
                  canAsk
                    ? "bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 hover:scale-105 active:scale-95"
                    : "bg-white/5 text-slate-600 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('qa.question.button.analyzing')}
                  </span>
                ) : (
                  t('qa.question.button.ask')
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-6 flex items-start gap-4 backdrop-blur-sm">
              <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-bold text-red-300">{t('qa.error.title')}</p>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          )}

          {data && data.clarifying_questions && data.clarifying_questions.length > 0 ? (
            <ClarifyingCard
              data={data}
              originalQuestion={originalQuestion}
              doctorName={selectedDoctorName}
              selectedClarifications={selectedClarifications}
              onToggleQuestion={toggleClarification}
              onUpdateAnswer={updateClarificationAnswer}
              onSubmitClarifications={submitWithClarifications}
              onSkip={() => submitWithClarifications(new Map())}
              loading={loading}
            />
          ) : data ? (
            <AnswerCard mode={mode} data={data} doctorName={selectedDoctorName} onFollowUp={(q) => { setQuestion(q); }} />
          ) : null}

        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/20 backdrop-blur-xl mt-20">
          <div className="max-w-5xl mx-auto px-6 py-8 text-center">
            <p className="text-sm text-slate-400">
              {t('qa.footer.version')}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {t('qa.footer.disclaimer')}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ModeToggle({
  mode, onChange,
}: { mode: "PATIENT" | "PROVIDER"; onChange: (m: "PATIENT" | "PROVIDER") => void; }) {
  const t = useTranslations();
  return (
    <div className="inline-flex items-center rounded-xl bg-white/10 backdrop-blur-sm p-1 border border-white/20">
      {(["PATIENT", "PROVIDER"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            mode === m
              ? "bg-white text-slate-900 shadow-lg"
              : "text-slate-300 hover:text-white"
          }`}
        >
          {m === "PATIENT" ? t('qa.mode.patient') : t('qa.mode.provider')}
        </button>
      ))}
    </div>
  );
}

function Disclaimer({ mode }: { mode: "PATIENT" | "PROVIDER" }) {
  const t = useTranslations();
  if (mode === "PATIENT") {
    return (
      <div className="bg-amber-500/20 border-2 border-amber-500/50 rounded-2xl p-6 flex gap-4 backdrop-blur-sm">
        <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p className="font-bold text-amber-300 mb-1">{t('qa.disclaimer.patient.title')}</p>
          <p className="text-sm text-amber-200">
            {t('qa.disclaimer.patient.description')}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-cyan-500/20 border-2 border-cyan-500/50 rounded-2xl p-6 flex gap-4 backdrop-blur-sm">
      <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p className="font-bold text-cyan-300 mb-1">{t('qa.disclaimer.provider.title')}</p>
        <p className="text-sm text-cyan-200">
          {t('qa.disclaimer.provider.description')}
        </p>
      </div>
    </div>
  );
}

function ClarifyingCard({
  data, originalQuestion, doctorName, selectedClarifications, onToggleQuestion, onUpdateAnswer, onSubmitClarifications, onSkip, loading,
}: {
  data: Answer;
  originalQuestion: string | null;
  doctorName?: string;
  selectedClarifications: Map<string, string>;
  onToggleQuestion: (question: string) => void;
  onUpdateAnswer: (question: string, answer: string) => void;
  onSubmitClarifications: (clarifications: Map<string, string>) => void;
  onSkip: () => void;
  loading: boolean;
}) {
  const { answer, clarifying_questions } = data;
  const inputRefs = useRef<Map<number, HTMLTextAreaElement>>(new Map());

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border-2 border-amber-500/40 shadow-2xl p-8 space-y-6">
      {/* Original question context */}
      {originalQuestion && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
          <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1">Your question</p>
            <p className="text-sm text-white">{originalQuestion}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">
            A few quick questions
          </h3>
          <p className="text-sm text-slate-300 mt-1">{answer}</p>
          <p className="text-xs text-slate-400 mt-2">Select a question to answer it inline, then click &quot;Get my answer&quot; below.</p>
        </div>
      </div>

      {/* Clarifying questions — multi-select toggles with inline answer inputs */}
      <div className="space-y-3">
        {clarifying_questions?.map((q, idx) => {
          const isSelected = selectedClarifications.has(q);
          const currentAnswer = selectedClarifications.get(q) ?? "";
          return (
            <div key={idx} className="space-y-0">
              <button
                onClick={() => {
                  onToggleQuestion(q);
                  // Auto-focus the input when selecting
                  if (!isSelected) {
                    setTimeout(() => inputRefs.current.get(idx)?.focus(), 50);
                  }
                }}
                className={`group w-full text-left px-5 py-4 border transition-all ${
                  isSelected
                    ? "bg-gradient-to-r from-amber-500/25 to-orange-500/25 border-amber-400/60 shadow-lg shadow-amber-500/10 rounded-t-xl rounded-b-none border-b-0"
                    : "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 hover:border-amber-400/50 hover:from-amber-500/20 hover:to-orange-500/20 rounded-xl"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`flex items-center justify-center w-7 h-7 rounded-lg border-2 flex-shrink-0 transition-all ${
                    isSelected
                      ? "bg-amber-500 border-amber-400 text-white"
                      : "border-amber-500/50 text-transparent group-hover:border-amber-400/70"
                  }`}>
                    {isSelected && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className={`font-medium transition-colors ${
                    isSelected ? "text-amber-100" : "text-white group-hover:text-amber-100"
                  }`}>{q}</span>
                </span>
              </button>
              {/* Inline answer input — appears when question is selected */}
              {isSelected && (
                <div className="bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-400/60 border-t-0 rounded-b-xl px-5 pb-4 pt-2">
                  <textarea
                    ref={(el) => {
                      if (el) inputRefs.current.set(idx, el);
                      else inputRefs.current.delete(idx);
                    }}
                    value={currentAnswer}
                    onChange={(e) => onUpdateAnswer(q, e.target.value)}
                    placeholder="Type your answer here..."
                    rows={2}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/60 resize-none transition-all"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="space-y-3 border-t border-white/20 pt-4">
        <button
          onClick={() => onSubmitClarifications(selectedClarifications)}
          disabled={loading}
          className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all transform ${
            loading
              ? "bg-white/5 text-slate-600 cursor-not-allowed"
              : "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 hover:scale-[1.02] active:scale-95"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </span>
          ) : (
            selectedClarifications.size > 0
              ? `Get my answer with ${selectedClarifications.size} detail${selectedClarifications.size > 1 ? "s" : ""}`
              : "Get my answer"
          )}
        </button>
        <button
          onClick={onSkip}
          disabled={loading}
          className="w-full text-sm text-slate-400 hover:text-white transition-colors underline underline-offset-2 disabled:opacity-50"
        >
          Answer my question without these details
        </button>
      </div>
    </div>
  );
}

function AnswerCard({
  mode, data, doctorName, onFollowUp
}: {
  mode: "PATIENT" | "PROVIDER";
  data: Answer;
  doctorName?: string;
  onFollowUp?: (question: string) => void;
}) {
  const t = useTranslations();
  const { answer, citations, latency_ms, follow_up_question } = data;

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">
              {doctorName ? t('qa.answer.title.doctor', { doctorName }) : t('qa.answer.title.default')}
            </h3>
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-400 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
          {latency_ms}ms
        </span>
      </div>

      <div className="text-white prose prose-invert prose-lg max-w-none prose-headings:text-white prose-h1:text-xl prose-h1:font-bold prose-h1:mb-3 prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-5 prose-h2:mb-2 prose-p:text-white prose-p:leading-relaxed prose-li:text-white prose-strong:text-white prose-strong:font-bold prose-ul:my-2 prose-li:my-0.5 prose-a:text-cyan-300 prose-a:no-underline hover:prose-a:text-cyan-200">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
      </div>

      <div className="border-t border-white/20 pt-6">
        <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t('qa.answer.sources')}
        </h4>
        {citations.length === 0 ? (
          <p className="text-sm text-slate-400 italic">{t('qa.answer.noSources')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {citations.map((c, idx) => {
              const label = c.display_label || c.title;

              const badge = (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all text-sm text-slate-200">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-600 text-white text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  {label}
                  {c.document_url && (
                    <svg className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  )}
                </span>
              );

              if (c.document_url) {
                return (
                  <a
                    key={idx}
                    href={c.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer"
                  >
                    {badge}
                  </a>
                );
              }

              return <span key={idx}>{badge}</span>;
            })}
          </div>
        )}
      </div>

      {mode === "PATIENT" && (
        <div className="border-t border-white/20 pt-4">
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('qa.answer.disclaimer', { doctorName: doctorName || t('qa.answer.title.default') })}
          </p>
        </div>
      )}

      {/* Follow-up Question */}
      {follow_up_question && (
        <div className="border-t border-white/20 pt-6">
          <p className="text-sm font-semibold text-slate-300 mb-3">Want to dive deeper?</p>
          <button
            onClick={() => onFollowUp?.(follow_up_question)}
            className="group w-full text-left px-5 py-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/30 hover:border-cyan-400/50 hover:from-cyan-500/20 hover:to-teal-500/20 transition-all"
          >
            <span className="flex items-center gap-3">
              <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white font-medium group-hover:text-cyan-100 transition-colors">{follow_up_question}</span>
            </span>
          </button>
        </div>
      )}

      {/* Feedback Button */}
      <div className="border-t border-white/20 pt-6">
        <a
          href="https://forms.gle/Eve2QFNknvkLzWwS9"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-center gap-3 w-full px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border-2 border-cyan-500/30 hover:border-cyan-400/50 hover:from-cyan-500/30 hover:to-teal-500/30 transition-all shadow-lg hover:shadow-cyan-500/20"
        >
          <svg className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <span className="text-sm font-semibold text-white group-hover:text-cyan-100 transition-colors">
            Enjoyed your experience? Share your feedback!
          </span>
          <svg className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
