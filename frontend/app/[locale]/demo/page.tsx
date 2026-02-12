"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

export default function DemoPage() {
  const t = useTranslations();
  const locale = useLocale();

  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    role: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate network call — replace with real endpoint later
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-x-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href={`/${locale}`} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-cyan-500/50">
                  <span className="text-white font-black text-2xl">C</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 text-transparent bg-clip-text">
                  {t("common.careguide")}
                </h1>
              </Link>
              <div className="flex items-center gap-4">
                <Link
                  href={`/${locale}`}
                  className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  {t("common.backToHome")}
                </Link>
                <Link
                  href={`/${locale}/about`}
                  className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  {t("common.aboutUs")}
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* ── Left : Value prop ──────────────────────────── */}
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-medium text-white">
                    {t("demo.badge")}
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
                  {t("demo.title")}
                </h2>
                <p className="text-xl text-slate-300 leading-relaxed">
                  {t("demo.subtitle")}
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-6">
                {[
                  {
                    icon: (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ),
                    titleKey: "demo.benefits.evidence.title",
                    descKey: "demo.benefits.evidence.desc",
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    ),
                    titleKey: "demo.benefits.instant.title",
                    descKey: "demo.benefits.instant.desc",
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    ),
                    titleKey: "demo.benefits.team.title",
                    descKey: "demo.benefits.team.desc",
                  },
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {t(benefit.titleKey)}
                      </h3>
                      <p className="text-slate-400 mt-1">
                        {t(benefit.descKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social proof line */}
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-3">
                  {["from-cyan-400 to-teal-500", "from-teal-400 to-blue-500", "from-blue-400 to-cyan-500", "from-emerald-400 to-teal-500"].map((grad, i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${grad} border-2 border-slate-900 flex items-center justify-center`}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-400">
                  {t("demo.socialProof")}
                </p>
              </div>
            </div>

            {/* ── Right : Form ───────────────────────────────── */}
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-blue-500/20 rounded-3xl blur-xl" />
              <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-10">
                {submitted ? (
                  /* Success state */
                  <div className="text-center py-12 space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-black text-white">
                      {t("demo.success.title")}
                    </h3>
                    <p className="text-lg text-slate-300 max-w-md mx-auto">
                      {t("demo.success.description")}
                    </p>
                    <Link
                      href={`/${locale}/app`}
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-xl shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all"
                    >
                      {t("demo.success.cta")}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                ) : (
                  /* Form */
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-white">
                        {t("demo.form.title")}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {t("demo.form.subtitle")}
                      </p>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-semibold text-slate-300">
                        {t("demo.form.name")} <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                        placeholder={t("demo.form.namePlaceholder")}
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-semibold text-slate-300">
                        {t("demo.form.email")} <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                        placeholder={t("demo.form.emailPlaceholder")}
                      />
                    </div>

                    {/* Organization */}
                    <div className="space-y-2">
                      <label htmlFor="organization" className="text-sm font-semibold text-slate-300">
                        {t("demo.form.organization")} <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        id="organization"
                        name="organization"
                        type="text"
                        required
                        value={form.organization}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                        placeholder={t("demo.form.organizationPlaceholder")}
                      />
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                      <label htmlFor="role" className="text-sm font-semibold text-slate-300">
                        {t("demo.form.role")}
                      </label>
                      <select
                        id="role"
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all appearance-none"
                      >
                        <option value="" className="bg-slate-900">{t("demo.form.rolePlaceholder")}</option>
                        <option value="physician" className="bg-slate-900">{t("demo.form.roles.physician")}</option>
                        <option value="administrator" className="bg-slate-900">{t("demo.form.roles.administrator")}</option>
                        <option value="nurse" className="bg-slate-900">{t("demo.form.roles.nurse")}</option>
                        <option value="pa_np" className="bg-slate-900">{t("demo.form.roles.paNp")}</option>
                        <option value="it" className="bg-slate-900">{t("demo.form.roles.it")}</option>
                        <option value="other" className="bg-slate-900">{t("demo.form.roles.other")}</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-semibold text-slate-300">
                        {t("demo.form.message")}
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={form.message}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none"
                        placeholder={t("demo.form.messagePlaceholder")}
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-xl shadow-cyan-500/40 hover:shadow-cyan-500/60 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {sending ? (
                        <span className="flex items-center justify-center gap-3">
                          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          {t("demo.form.sending")}
                        </span>
                      ) : (
                        t("demo.form.submit")
                      )}
                    </button>

                    <p className="text-xs text-slate-500 text-center">
                      {t("demo.form.privacy")}
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between text-sm">
              <p className="text-slate-400">
                {t("common.version")} &bull; {t("landing.footer.tagline")}
              </p>
              <Link
                href={`/${locale}/about`}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {t("common.aboutUs")}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
