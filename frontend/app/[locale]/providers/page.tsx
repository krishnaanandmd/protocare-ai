"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

type Collection = {
  name: string;
  points_count: number;
  display_name: string;
  error?: string;
};

type DoctorWithDocuments = {
  id: string;
  name: string;
  specialty: string;
  procedures: string[];
  collections: Collection[];
  total_collections: number;
};

type ProvidersResponse = {
  total_doctors: number;
  doctors: DoctorWithDocuments[];
};

export default function ProvidersPage() {
  const t = useTranslations();
  const [data, setData] = useState<ProvidersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDoctor, setExpandedDoctor] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch(`${API_BASE}/rag/doctors/with-documents`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ProvidersResponse = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err?.message || "Failed to load providers");
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, []);

  const toggleDoctor = (doctorId: string) => {
    setExpandedDoctor(expandedDoctor === doctorId ? null : doctorId);
  };

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
                      {t('common.careguide')}
                    </h1>
                  </Link>
                  <p className="text-sm text-cyan-300">Provider Document Collections</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <Link
                  href="/app"
                  className="px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all"
                >
                  Back to Q&A
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-12">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-r-transparent"></div>
              <p className="mt-4 text-slate-400">Loading providers...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-red-400">
              <h3 className="font-semibold text-lg mb-2">Error Loading Providers</h3>
              <p>{error}</p>
            </div>
          )}

          {data && (
            <>
              <div className="mb-8">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 text-transparent bg-clip-text mb-2">
                  Our Providers
                </h2>
                <p className="text-slate-400 text-lg">
                  {data.total_doctors} orthopedic surgeons with comprehensive document collections
                </p>
              </div>

              <div className="space-y-4">
                {data.doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all"
                  >
                    {/* Doctor Header */}
                    <button
                      onClick={() => toggleDoctor(doctor.id)}
                      className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-800/30 transition-all"
                    >
                      <div className="flex-1 text-left">
                        <h3 className="text-2xl font-bold text-white mb-1">{doctor.name}</h3>
                        <p className="text-cyan-400 text-sm mb-2">{doctor.specialty}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-slate-400">
                            <span className="font-semibold text-teal-400">{doctor.total_collections}</span> document collections
                          </span>
                          <span className="text-slate-400">
                            <span className="font-semibold text-teal-400">{doctor.procedures.length}</span> procedures
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <svg
                          className={`w-6 h-6 text-cyan-400 transition-transform ${
                            expandedDoctor === doctor.id ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {expandedDoctor === doctor.id && (
                      <div className="px-6 pb-6 border-t border-slate-700/50">
                        {/* Procedures */}
                        <div className="mt-4 mb-6">
                          <h4 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                            Specialized Procedures
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {doctor.procedures.map((proc) => (
                              <span
                                key={proc}
                                className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full text-sm"
                              >
                                {proc.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Document Collections */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                            Document Collections ({doctor.collections.length})
                          </h4>
                          {doctor.collections.length === 0 ? (
                            <p className="text-slate-500 italic">No document collections available</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {doctor.collections.map((collection) => (
                                <div
                                  key={collection.name}
                                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-teal-500/30 transition-all"
                                >
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <h5 className="text-sm font-semibold text-white flex-1">
                                      {collection.display_name}
                                    </h5>
                                    {collection.error && (
                                      <span className="text-xs text-red-400" title={collection.error}>
                                        ⚠️
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 mb-2 font-mono truncate" title={collection.name}>
                                    {collection.name}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-teal-400 font-semibold">
                                      {collection.points_count.toLocaleString()}
                                    </span>
                                    <span className="text-slate-500">document chunks</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/30 rounded-xl p-6">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">
                    {data.doctors.length}
                  </div>
                  <div className="text-slate-300 font-medium">Total Providers</div>
                </div>
                <div className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/30 rounded-xl p-6">
                  <div className="text-3xl font-bold text-teal-400 mb-2">
                    {data.doctors.reduce((sum, doc) => sum + doc.total_collections, 0)}
                  </div>
                  <div className="text-slate-300 font-medium">Total Collections</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-xl p-6">
                  <div className="text-3xl font-bold text-emerald-400 mb-2">
                    {data.doctors.reduce(
                      (sum, doc) => sum + doc.collections.reduce((s, col) => s + col.points_count, 0),
                      0
                    ).toLocaleString()}
                  </div>
                  <div className="text-slate-300 font-medium">Total Document Chunks</div>
                </div>
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 mt-16 py-8">
          <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
            <p>CareGuide - Clinical Intelligence Platform</p>
            <p className="mt-2">Providing evidence-based orthopedic care guidance</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
