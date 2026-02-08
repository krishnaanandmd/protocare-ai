"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8080";

const UPLOAD_PASSWORD = "CareGuide2025";

type Item = { file: File; status: string };
type Doctor = { id: string; name: string; specialty: string };
type UploadMode = "general" | "doctor_protocol";

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

export default function UploadPage() {
  const locale = useLocale();

  // Password gate state
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  // Check sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("cg_upload_auth") === "true") {
      setAuthenticated(true);
    }
  }, []);

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === UPLOAD_PASSWORD) {
      setAuthenticated(true);
      setPasswordError(false);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("cg_upload_auth", "true");
      }
    } else {
      setPasswordError(true);
    }
  }

  const [uploadMode, setUploadMode] = useState<UploadMode>("doctor_protocol");
  const [orgId, setOrgId] = useState("demo");
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  // Doctor protocol mode state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [protocolName, setProtocolName] = useState("Protocols");

  // Fetch doctors list
  useEffect(() => {
    if (!authenticated) return;
    const fetchDoctors = async () => {
      try {
        const res = await fetch(`${API_BASE}/rag/doctors`);
        if (res.ok) {
          const data = await res.json();
          setDoctors(data);
        }
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      }
    };
    fetchDoctors();
  }, [authenticated]);

  // Compute the effective org_id and source_type based on upload mode
  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
  const effectiveOrgId =
    uploadMode === "doctor_protocol" && selectedDoctorId
      ? `dr_${slugify(selectedDoctorId)}_${slugify(protocolName)}`
      : orgId;
  const effectiveSourceType =
    uploadMode === "doctor_protocol" ? "DOCTOR_PROTOCOL" : "AAOS";

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setItems(files.map((f) => ({ file: f, status: "Ready" })));
  }

  async function uploadAll() {
    setBusy(true);
    const next = [...items];

    for (let i = 0; i < next.length; i++) {
      const it = next[i];
      const set = (s: string) => {
        next[i] = { ...it, status: s };
        setItems([...next]);
      };

      try {
        set("Requesting presign...");
        const initRes = await fetch(`${API_BASE}/documents/upload:init`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: it.file.name,
            content_type: it.file.type || "application/pdf",
            org_id: effectiveOrgId,
          }),
        });
        if (!initRes.ok) throw new Error(`init ${it.file.name}: ${await initRes.text()}`);
        const init = await initRes.json();

        set("Uploading to S3...");
        const form = new FormData();
        Object.entries(init.fields).forEach(([k, v]: any) => form.append(k, v));
        form.append("file", it.file);
        const s3Res = await fetch(init.upload_url, { method: "POST", body: form });
        if (!s3Res.ok) throw new Error(`S3 ${it.file.name}: ${await s3Res.text()}`);

        set("Publishing...");
        const pub = await fetch(
          `${API_BASE}/documents/${encodeURIComponent(init.key)}/publish?source_type=${encodeURIComponent(effectiveSourceType)}&org_id=${encodeURIComponent(effectiveOrgId)}`,
          { method: "POST" }
        );
        if (!pub.ok) throw new Error(`publish ${it.file.name}: ${await pub.text()}`);

        set("Queued ✅");
      } catch (err: any) {
        set(`Failed: ${err?.message || "error"}`);
      }
    }

    setBusy(false);
  }

  const canUpload =
    items.length > 0 &&
    !busy &&
    (uploadMode === "general" || selectedDoctorId);

  // Password gate screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-cyan-500/50 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-teal-400 text-transparent bg-clip-text">
                CareGuide Team Access
              </h1>
              <p className="text-slate-400 text-sm">Enter the team password to access document uploads</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                  placeholder="Enter password"
                  autoFocus
                  className={`w-full rounded-xl bg-white/10 border-2 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-400 focus:ring-4 transition-all outline-none ${
                    passwordError
                      ? "border-red-500/50 focus:border-red-400 focus:ring-red-500/20"
                      : "border-white/20 focus:border-cyan-400 focus:ring-cyan-500/20"
                  }`}
                />
                {passwordError && (
                  <p className="text-sm text-red-400 mt-2">Incorrect password. Please try again.</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 hover:scale-105 active:scale-95 transition-all"
              >
                Enter
              </button>
            </form>

            <div className="text-center">
              <Link
                href={`/${locale}/app`}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Back to App
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-teal-400 text-transparent bg-clip-text">
              Upload Documents
            </h1>
            <p className="text-slate-400 mt-2">Upload guidelines and protocols for processing</p>
          </div>
          <Link
            href={`/${locale}/app`}
            className="text-slate-300 hover:text-white transition-colors font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to App
          </Link>
        </div>

        {/* Upload Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 space-y-6">
          {/* Upload Mode Toggle */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-white">Upload Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setUploadMode("doctor_protocol")}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  uploadMode === "doctor_protocol"
                    ? "bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/30"
                    : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                }`}
              >
                Doctor Protocol
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("general")}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  uploadMode === "general"
                    ? "bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/30"
                    : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                }`}
              >
                General Upload
              </button>
            </div>
          </div>

          {/* Doctor Protocol Mode Fields */}
          {uploadMode === "doctor_protocol" && (
            <>
              {/* Doctor Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-white">Doctor</label>
                <select
                  value={selectedDoctorId || ""}
                  onChange={(e) => setSelectedDoctorId(e.target.value || null)}
                  className="w-full rounded-xl bg-white/10 border-2 border-white/20 backdrop-blur-sm px-4 py-3 text-white focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all outline-none appearance-none"
                >
                  <option value="" className="bg-slate-900">Select a doctor...</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id} className="bg-slate-900">
                      {doc.name} — {doc.specialty}
                    </option>
                  ))}
                </select>
              </div>

              {/* Protocol Name */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-white">Protocol / Collection Name</label>
                <input
                  className="w-full rounded-xl bg-white/10 border-2 border-white/20 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all outline-none"
                  value={protocolName}
                  onChange={(e) => setProtocolName(e.target.value)}
                  placeholder="Protocols"
                />
                <p className="text-xs text-slate-400">
                  This groups documents into a collection. Use "Protocols" for general protocol docs, or a specific name like "UCL" or "ACL".
                </p>
              </div>

              {/* Computed Collection Preview */}
              {selectedDoctorId && (
                <div className="bg-white/5 rounded-xl border border-white/10 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Documents will be uploaded to:</p>
                  <p className="text-sm font-mono text-cyan-300">
                    Collection: {effectiveOrgId}
                  </p>
                  <p className="text-sm font-mono text-teal-300">
                    Source type: DOCTOR_PROTOCOL
                  </p>
                </div>
              )}
            </>
          )}

          {/* General Mode Fields */}
          {uploadMode === "general" && (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-white">Organization ID</label>
              <input
                className="w-full rounded-xl bg-white/10 border-2 border-white/20 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all outline-none"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                placeholder="demo"
              />
            </div>
          )}

          {/* File Input */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-white">Select Files</label>
            <div className="relative">
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                onChange={onPick}
                className="w-full text-slate-300 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-cyan-500 file:to-teal-600 file:text-white hover:file:from-cyan-600 hover:file:to-teal-700 file:cursor-pointer cursor-pointer"
              />
            </div>
            <p className="text-xs text-slate-400">Supported formats: PDF, DOCX, TXT</p>
          </div>

          {/* File List */}
          {items.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Selected Files ({items.length})</h3>
              <div className="border border-white/20 rounded-2xl divide-y divide-white/10 overflow-hidden">
                {items.map((it, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-all">
                    <span className="truncate mr-3 text-white font-medium text-sm">{it.file.name}</span>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
                      it.status.includes("✅")
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : it.status.includes("Failed")
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    }`}>
                      {it.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation Message */}
          {uploadMode === "doctor_protocol" && !selectedDoctorId && items.length > 0 && (
            <p className="text-sm text-amber-400">Please select a doctor before uploading.</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <button
              disabled={!canUpload}
              onClick={uploadAll}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform ${
                !canUpload
                  ? "bg-white/5 text-slate-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 hover:scale-105 active:scale-95"
              }`}
            >
              {busy ? (
                <span className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </span>
              ) : (
                `Upload ${items.length} file${items.length !== 1 ? "s" : ""}`
              )}
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-6 flex gap-4 backdrop-blur-sm">
          <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold text-cyan-300 mb-1">How it works</p>
            <p className="text-sm text-cyan-200">
              {uploadMode === "doctor_protocol" ? (
                <>
                  Select a doctor and protocol name, then pick your files. Documents upload directly to S3 and are automatically queued for parsing, chunking, and embedding into the doctor's protocol collection. This replaces the need for local CLI scripts.
                </>
              ) : (
                <>
                  Files upload directly to S3 via presigned POST. After upload, they're automatically queued for parsing, chunking, and embedding into the knowledge base.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
