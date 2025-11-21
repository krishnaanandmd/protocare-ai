"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [currentScreen, setCurrentScreen] = useState(0);

  const screens = [
    {
      title: "Welcome to CareGuide",
      subtitle: "Personalized Clinical Intelligence",
      description: "Get instant answers based on our artificial intelligence model trained and curated by your doctors clinical expertise.",
      cta: "Learn How It Works",
    },
    {
      title: "How It Works",
      subtitle: "Three Simple Steps",
      description: null,
      steps: [
        {
          icon: "search",
          title: "Find Your Surgeon",
          desc: "Select your doctor from our network of top orthopedic specialists",
        },
        {
          icon: "question",
          title: "Ask Your Question",
          desc: "Type any question about your condition, injury, treatment, or recovery",
        },
        {
          icon: "answer",
          title: "Get Personalized Answers",
          desc: "Receive on-demand, evidence-based responses from your doctor",
        },
      ],
      cta: "Why Trust Us?",
    },
    {
      title: "Evidence-Based Care",
      subtitle: "Backed by Clinical Expertise",
      description: null,
      features: [
        {
          icon: "shield",
          title: "100% Evidence-Based",
          desc: "All responses sourced from verified clinical protocols and research",
        },
        {
          icon: "team",
          title: "Expert Advisory Board",
          desc: "Guided by leading orthopedic surgeons and specialists",
        },
        {
          icon: "team",
          title: "Built by Doctors",
          desc: "A company built by and ran by doctors who understand patient care",
        },
        {
          icon: "clock",
          title: "24/7 Availability",
          desc: "Get answers anytime, without waiting for office hours",
        },
      ],
      cta: "Get Started",
    },
  ];

  const currentScreenData = screens[currentScreen];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-cyan-500/50">
                  <span className="text-white font-black text-2xl">C</span>
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 text-transparent bg-clip-text">
                    CareGuide
                  </h1>
                </div>
              </div>
              <Link
                href="/app"
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Skip to App →
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
          <div className="max-w-5xl w-full">
            {/* Screen Content */}
            <div className="text-center space-y-12 animate-in">
              {/* Screen 0: Welcome */}
              {currentScreen === 0 && (
                <>
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-sm font-medium text-white">Powered by Advanced AI</span>
                    </div>

                    <h2 className="text-6xl md:text-7xl lg:text-8xl font-black leading-tight">
                      <span className="block text-white mb-2">{currentScreenData.title.split(" ")[0]}</span>
                      <span className="block text-white mb-2">{currentScreenData.title.split(" ")[1]}</span>
                      <span className="block bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-400 text-transparent bg-clip-text animate-gradient">
                        {currentScreenData.title.split(" ").slice(2).join(" ")}
                      </span>
                    </h2>

                    <p className="text-2xl md:text-3xl text-slate-300 font-light max-w-4xl mx-auto leading-relaxed">
                      {currentScreenData.subtitle}
                    </p>

                    <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto">
                      {currentScreenData.description}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-center gap-8 pt-8">
                    <div className="text-center">
                      <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 text-transparent bg-clip-text">
                        Instant
                      </div>
                      <div className="text-sm text-slate-400 mt-2">Responses</div>
                    </div>
                    <div className="w-px h-16 bg-white/20" />
                    <div className="text-center">
                      <div className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-blue-400 text-transparent bg-clip-text">
                        100%
                      </div>
                      <div className="text-sm text-slate-400 mt-2">Evidence-Based</div>
                    </div>
                    <div className="w-px h-16 bg-white/20" />
                    <div className="text-center">
                      <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
                        24/7
                      </div>
                      <div className="text-sm text-slate-400 mt-2">Available</div>
                    </div>
                  </div>
                </>
              )}

              {/* Screen 1: How It Works */}
              {currentScreen === 1 && (
                <>
                  <div className="space-y-6">
                    <h2 className="text-6xl md:text-7xl font-black text-white leading-tight">
                      {currentScreenData.title}
                    </h2>
                    <p className="text-2xl text-slate-300 font-light">
                      {currentScreenData.subtitle}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-8 mt-16">
                    {currentScreenData.steps?.map((step, idx) => (
                      <div
                        key={idx}
                        className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 space-y-6 hover:bg-white/10 transition-all hover:scale-105 hover:border-cyan-500/30"
                      >
                        <div className="flex items-center justify-center">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                            {step.icon === "search" && (
                              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            )}
                            {step.icon === "question" && (
                              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            {step.icon === "answer" && (
                              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="text-sm font-bold text-cyan-400">Step {idx + 1}</div>
                          <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                          <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Screen 2: Why Trust Us */}
              {currentScreen === 2 && (
                <>
                  <div className="space-y-6">
                    <h2 className="text-6xl md:text-7xl font-black text-white leading-tight">
                      {currentScreenData.title}
                    </h2>
                    <p className="text-2xl text-slate-300 font-light">
                      {currentScreenData.subtitle}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mt-16">
                    {currentScreenData.features?.map((feature, idx) => (
                      <div
                        key={idx}
                        className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 space-y-4 hover:bg-white/10 transition-all hover:border-cyan-500/30 text-left"
                      >
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                          {feature.icon === "shield" && (
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          )}
                          {feature.icon === "team" && (
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          )}
                          {feature.icon === "lock" && (
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                          {feature.icon === "clock" && (
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                        <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Navigation */}
              <div className="flex flex-col items-center gap-8 pt-16">
                {/* CTA Button */}
                {currentScreen < screens.length - 1 ? (
                  <button
                    onClick={() => setCurrentScreen(currentScreen + 1)}
                    className="group px-10 py-5 rounded-2xl font-bold text-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 hover:scale-105 active:scale-95 transition-all"
                  >
                    <span className="flex items-center gap-3">
                      {currentScreenData.cta}
                      <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>
                ) : (
                  <Link
                    href="/app"
                    className="group px-12 py-6 rounded-2xl font-bold text-2xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 hover:scale-105 active:scale-95 transition-all"
                  >
                    <span className="flex items-center gap-3">
                      {currentScreenData.cta}
                      <svg className="w-7 h-7 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </Link>
                )}

                {/* Progress Dots */}
                <div className="flex items-center gap-3">
                  {screens.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentScreen(idx)}
                      className={`transition-all rounded-full ${
                        idx === currentScreen
                          ? "w-12 h-3 bg-gradient-to-r from-cyan-500 to-teal-600"
                          : "w-3 h-3 bg-white/20 hover:bg-white/40"
                      }`}
                      aria-label={`Go to screen ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Back button (except on first screen) */}
                {currentScreen > 0 && (
                  <button
                    onClick={() => setCurrentScreen(currentScreen - 1)}
                    className="text-slate-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between text-sm">
              <p className="text-slate-400">
                CareGuide v0.2 • Personalized Clinical Intelligence
              </p>
              <Link href="/about" className="text-slate-400 hover:text-white transition-colors">
                About Us
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
