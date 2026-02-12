"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

/* ------------------------------------------------------------------ */
/*  Animated counter – rolls up from 0 to `end` when scrolled into view */
/* ------------------------------------------------------------------ */
function AnimatedCounter({
  end,
  suffix = "",
  duration = 2000,
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out quad
            const eased = 1 - (1 - progress) * (1 - progress);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Landing page                                                       */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  const t = useTranslations();
  const locale = useLocale();

  const title = t("landing.screens.welcome.title");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-x-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10">
        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-cyan-500/50">
                  <span className="text-white font-black text-2xl">C</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 text-transparent bg-clip-text">
                  {t("common.careguide")}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href={`/${locale}/about`}
                  className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  {t("common.aboutUs")}
                </Link>
                <Link
                  href={`/${locale}/app`}
                  className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  {t("common.skipToApp")}
                </Link>
                <Link
                  href={`/${locale}/demo`}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all"
                >
                  {t("common.requestDemo")}
                </Link>
                <Link
                  href={`/${locale}/upload`}
                  className="text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  For CareGuide Team
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ── Section 1 : Hero ───────────────────────────────────── */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 py-32">
          <div className="max-w-5xl w-full text-center space-y-10 animate-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-white">
                {t("common.poweredBy")}
              </span>
            </div>

            <h2 className="text-6xl md:text-7xl lg:text-8xl font-black leading-tight">
              <span className="block text-white mb-2">
                {title.split(" ")[0]}
              </span>
              <span className="block text-white mb-2">
                {title.split(" ")[1]}
              </span>
              <span className="block bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-400 text-transparent bg-clip-text animate-gradient">
                {title.split(" ").slice(2).join(" ")}
              </span>
            </h2>

            <p className="text-2xl md:text-3xl text-slate-300 font-light max-w-4xl mx-auto leading-relaxed">
              {t("landing.screens.welcome.subtitle")}
            </p>

            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto">
              {t("landing.screens.welcome.description")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link
                href={`/${locale}/app`}
                className="group px-10 py-5 rounded-2xl font-bold text-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 hover:scale-105 active:scale-95 transition-all"
              >
                <span className="flex items-center gap-3">
                  {t("common.getStarted")}
                  <svg
                    className="w-6 h-6 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </Link>
              <Link
                href={`/${locale}/demo`}
                className="px-10 py-5 rounded-2xl font-bold text-xl border border-white/20 text-white hover:bg-white/10 transition-all"
              >
                {t("common.requestDemo")}
              </Link>
            </div>

            {/* scroll hint */}
            <div className="pt-12 animate-bounce">
              <svg
                className="w-6 h-6 text-slate-500 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
        </section>

        {/* ── Section 2 : Impact Stats ───────────────────────────── */}
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-white">
                {t("landing.impact.title")}
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                {t("landing.impact.subtitle")}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Users */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-teal-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-10 text-center space-y-4 hover:border-cyan-500/40 transition-all">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-cyan-400 to-teal-400 text-transparent bg-clip-text">
                    <AnimatedCounter end={1200} suffix="+" />
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {t("landing.impact.users.label")}
                  </div>
                  <p className="text-sm text-slate-400">
                    {t("landing.impact.users.desc")}
                  </p>
                </div>
              </div>

              {/* Healthcare Systems */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-blue-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-10 text-center space-y-4 hover:border-teal-500/40 transition-all">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-teal-400 to-blue-400 text-transparent bg-clip-text">
                    <AnimatedCounter end={30} suffix="+" />
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {t("landing.impact.systems.label")}
                  </div>
                  <p className="text-sm text-slate-400">
                    {t("landing.impact.systems.desc")}
                  </p>
                </div>
              </div>

              {/* States & Countries */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-10 text-center space-y-4 hover:border-blue-500/40 transition-all">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
                    <AnimatedCounter end={14} suffix="" />
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {t("landing.impact.regions.label")}
                  </div>
                  <p className="text-sm text-slate-400">
                    {t("landing.impact.regions.desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 3 : How It Works ───────────────────────────── */}
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-white">
                {t("landing.screens.howItWorks.title")}
              </h2>
              <p className="text-xl text-slate-300 font-light">
                {t("landing.screens.howItWorks.subtitle")}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: "search",
                  titleKey:
                    "landing.screens.howItWorks.steps.findSurgeon.title",
                  descKey: "landing.screens.howItWorks.steps.findSurgeon.desc",
                },
                {
                  icon: "question",
                  titleKey:
                    "landing.screens.howItWorks.steps.askQuestion.title",
                  descKey: "landing.screens.howItWorks.steps.askQuestion.desc",
                },
                {
                  icon: "answer",
                  titleKey:
                    "landing.screens.howItWorks.steps.getAnswers.title",
                  descKey: "landing.screens.howItWorks.steps.getAnswers.desc",
                },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 space-y-6 hover:bg-white/10 transition-all hover:scale-105 hover:border-cyan-500/30"
                >
                  <div className="flex items-center justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                      {step.icon === "search" && (
                        <svg
                          className="w-10 h-10 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      )}
                      {step.icon === "question" && (
                        <svg
                          className="w-10 h-10 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                      {step.icon === "answer" && (
                        <svg
                          className="w-10 h-10 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 text-center">
                    <div className="text-sm font-bold text-cyan-400">
                      {t("landing.screens.howItWorks.steps.step")} {idx + 1}
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {t(step.titleKey)}
                    </h3>
                    <p className="text-slate-400 leading-relaxed">
                      {t(step.descKey)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 4 : Why Trust Us ───────────────────────────── */}
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-white">
                {t("landing.screens.trust.title")}
              </h2>
              <p className="text-xl text-slate-300 font-light">
                {t("landing.screens.trust.subtitle")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: "shield",
                  titleKey:
                    "landing.screens.trust.features.evidenceBased.title",
                  descKey:
                    "landing.screens.trust.features.evidenceBased.desc",
                },
                {
                  icon: "team",
                  titleKey:
                    "landing.screens.trust.features.expertBoard.title",
                  descKey:
                    "landing.screens.trust.features.expertBoard.desc",
                },
                {
                  icon: "team",
                  titleKey:
                    "landing.screens.trust.features.builtByDoctors.title",
                  descKey:
                    "landing.screens.trust.features.builtByDoctors.desc",
                },
                {
                  icon: "clock",
                  titleKey:
                    "landing.screens.trust.features.available247.title",
                  descKey:
                    "landing.screens.trust.features.available247.desc",
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 space-y-4 hover:bg-white/10 transition-all hover:border-cyan-500/30 text-left"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    {feature.icon === "shield" && (
                      <svg
                        className="w-7 h-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    )}
                    {feature.icon === "team" && (
                      <svg
                        className="w-7 h-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    )}
                    {feature.icon === "clock" && (
                      <svg
                        className="w-7 h-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {t(feature.descKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 5 : CTA Banner ─────────────────────────────── */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-blue-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-16 space-y-8">
                <h2 className="text-4xl md:text-5xl font-black text-white">
                  {t("landing.cta.title")}
                </h2>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                  {t("landing.cta.description")}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href={`/${locale}/app`}
                    className="group px-10 py-5 rounded-2xl font-bold text-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 hover:scale-105 active:scale-95 transition-all"
                  >
                    <span className="flex items-center gap-3">
                      {t("common.getStarted")}
                      <svg
                        className="w-6 h-6 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </span>
                  </Link>
                  <Link
                    href={`/${locale}/demo`}
                    className="px-10 py-5 rounded-2xl font-bold text-xl border border-white/20 text-white hover:bg-white/10 transition-all"
                  >
                    {t("common.requestDemo")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <footer className="border-t border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between text-sm">
              <p className="text-slate-400">
                {t("common.version")} &bull; {t("landing.footer.tagline")}
              </p>
              <div className="flex items-center gap-6">
                <Link
                  href={`/${locale}/demo`}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {t("common.requestDemo")}
                </Link>
                <Link
                  href={`/${locale}/about`}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {t("common.aboutUs")}
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
