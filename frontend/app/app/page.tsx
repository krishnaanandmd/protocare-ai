"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { DoctorAutocomplete } from "@/components/DoctorAutocomplete";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

type Citation = { title: string; document_id: string; page?: number; section?: string; };
type Answer = { answer: string; citations: Citation[]; guardrails: Record<string, any>; latency_ms: number; };
type Doctor = { id: string; name: string; specialty: string; };
type Condition = { name: string; description: string; procedures: string[]; };
type Category = { name: string; icon: string; conditions: Condition[]; };
type SurgeonSpecialties = { categories: Category[]; };

export default function PatientQA() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<"PATIENT" | "PROVIDER">("PATIENT");
  const [data, setData] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [doctors] = useState<Doctor[]>([
    { id: "joshua_dines", name: "Dr. Joshua Dines", specialty: "Orthopedic Surgery - Sports Medicine" }
  ]);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<SurgeonSpecialties | null>(null);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);

  // Fetch specialties when doctor is selected
  useEffect(() => {
    if (!selectedDoctor) {
      setSpecialties(null);
      return;
    }

    const fetchSpecialties = async () => {
      setLoadingSpecialties(true);
      try {
        const res = await fetch(`${API_BASE}/rag/doctors/${selectedDoctor}/specialties`);
        if (res.ok) {
          const data = await res.json();
          setSpecialties(data);
        }
      } catch (e) {
        console.error("Failed to fetch specialties:", e);
      } finally {
        setLoadingSpecialties(false);
      }
    };

    fetchSpecialties();
  }, [selectedDoctor]);

  const canAsk = useMemo(() =>
    question.trim().length > 3 && !loading && selectedDoctor,
    [question, loading, selectedDoctor]
  );

  const ask = useCallback(async () => {
    if (!canAsk) return;
    setLoading(true); setError(null); setData(null);
    try {
      const res = await fetch(`${API_BASE}/rag/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          actor: mode,
          doctor_id: selectedDoctor
        }),
      });
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
      const json: Answer = await res.json();
      setData(json);
    } catch (e: any) { setError(e?.message || "Something went wrong"); }
    finally { setLoading(false); }
  }, [question, mode, canAsk, selectedDoctor]);

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
                  <Link href="/">
                    <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 text-transparent bg-clip-text hover:from-cyan-300 hover:to-teal-300 transition-all cursor-pointer">
                      CareGuide
                    </h1>
                  </Link>
                  <p className="text-sm text-cyan-300">Personalized Clinical Intelligence</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Link
                  href="/about"
                  className="text-slate-300 hover:text-white transition-colors font-semibold"
                >
                  About Us
                </Link>
                <ModeToggle mode={mode} onChange={setMode} />
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="pt-20 pb-16 px-6">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">Instant</div>
                <div className="text-sm text-slate-400">Responses</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center">
                <div className="text-3xl font-bold text-white">100%</div>
                <div className="text-sm text-slate-400">Evidence-Based</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center">
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-sm text-slate-400">Available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-5xl mx-auto px-6 pb-20 space-y-8">

          <Disclaimer mode={mode} />

          {/* Doctor Selection */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Find Your Surgeon</h3>
            </div>

            <DoctorAutocomplete
              doctors={doctors}
              selectedDoctorId={selectedDoctor}
              onSelect={setSelectedDoctor}
            />

            {selectedDoctorName && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-white/20">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-white">
                  Connected to <span className="font-bold">{selectedDoctorName}'s</span> protocols
                </p>
              </div>
            )}
          </div>

          {/* Conditions Display */}
          {selectedDoctor && (
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Conditions</h3>
                  <p className="text-sm text-slate-400">Topics you can ask {selectedDoctorName} about</p>
                </div>
              </div>

              {selectedDoctor === "joshua_dines" ? (
                <div className="grid gap-3">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    <h5 className="font-semibold text-white">Rotator Cuff</h5>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    <h5 className="font-semibold text-white">Ulnar Collateral Ligament</h5>
                  </div>
                </div>
              ) : loadingSpecialties ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-cyan-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : specialties && specialties.categories.length > 0 ? (
                <div className="space-y-6">
                  {specialties.categories.map((category, catIdx) => (
                    <div key={catIdx} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                          {category.icon === "shoulder" && (
                            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                          {category.icon === "elbow" && (
                            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                            </svg>
                          )}
                          {category.icon === "knee" && (
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          )}
                        </div>
                        <h4 className="text-lg font-bold text-white">{category.name}</h4>
                      </div>

                      <div className="grid gap-3">
                        {category.conditions.map((condition, condIdx) => (
                          <div
                            key={condIdx}
                            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-white text-sm">{condition.name}</h5>
                                <p className="text-xs text-slate-400 mt-1">{condition.description}</p>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {condition.procedures.map((proc, procIdx) => (
                                <span
                                  key={procIdx}
                                  className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-white/10 text-xs font-medium text-slate-300"
                                >
                                  {proc}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No specialty information available</p>
              )}
            </div>
          )}

          {/* Question Input */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Ask Your Question</h3>
            </div>

            <textarea
              className="w-full rounded-2xl bg-white/10 border-2 border-white/20 backdrop-blur-sm px-4 py-4 text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all outline-none resize-none disabled:opacity-30"
              rows={4}
              placeholder={selectedDoctorName
                ? `Ask ${selectedDoctorName} anything about your treatment...`
                : "Select your surgeon first to ask questions..."}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canAsk) ask(); }}
              disabled={!selectedDoctor}
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Press ⌘/Ctrl + Enter to send</span>
              <button
                disabled={!canAsk}
                onClick={ask}
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
                    Analyzing...
                  </span>
                ) : (
                  "Ask Question"
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
                <p className="font-bold text-red-300">Error</p>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          )}

          {data && <AnswerCard mode={mode} data={data} doctorName={selectedDoctorName} />}

        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/20 backdrop-blur-xl mt-20">
          <div className="max-w-5xl mx-auto px-6 py-8 text-center">
            <p className="text-sm text-slate-400">
              CareGuide v0.2 • Personalized Clinical Decision Support
            </p>
            <p className="text-xs text-slate-500 mt-2">
              This tool provides information based on your surgeon's protocols. Always consult with your healthcare team.
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
          {m === "PATIENT" ? "Patient" : "Provider"}
        </button>
      ))}
    </div>
  );
}

function Disclaimer({ mode }: { mode: "PATIENT" | "PROVIDER" }) {
  if (mode === "PATIENT") {
    return (
      <div className="bg-amber-500/20 border-2 border-amber-500/50 rounded-2xl p-6 flex gap-4 backdrop-blur-sm">
        <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p className="font-bold text-amber-300 mb-1">For informational purposes only</p>
          <p className="text-sm text-amber-200">
            This tool provides information about your surgeon's protocols. It does not give medical advice or handle emergencies.
            If you have urgent symptoms, call your clinic or emergency services.
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
        <p className="font-bold text-cyan-300 mb-1">Provider Mode</p>
        <p className="text-sm text-cyan-200">
          Clinical view with explicit citations and detailed protocols.
        </p>
      </div>
    </div>
  );
}

function AnswerCard({
  mode, data, doctorName
}: {
  mode: "PATIENT" | "PROVIDER";
  data: Answer;
  doctorName?: string;
}) {
  const { answer, citations, latency_ms } = data;

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
              {doctorName ? `${doctorName}'s Protocols` : "Answer"}
            </h3>
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-400 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
          {latency_ms}ms
        </span>
      </div>

      <div className="prose prose-invert max-w-none">
        <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap">{answer}</p>
      </div>

      <div className="border-t border-white/20 pt-6">
        <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Sources
        </h4>
        {citations.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No sources cited</p>
        ) : (
          <div className="space-y-3">
            {citations.map((c, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 text-white text-xs font-bold flex-shrink-0 shadow-lg">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-sm">{c.title}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {c.section && <span>{c.section} • </span>}
                    {typeof c.page === "number" && <span>Page {c.page}</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {mode === "PATIENT" && (
        <div className="border-t border-white/20 pt-4">
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Always discuss your specific situation with {doctorName || "your surgeon"} before making medical decisions.
          </p>
        </div>
      )}
    </div>
  );
}
