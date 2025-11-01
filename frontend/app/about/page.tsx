'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface TeamMember {
  name: string;
  role: string;
  title: string;
  image: string;
  linkedin?: string;
  bio: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Kyle Kunze',
    role: 'CEO',
    title: 'Chief Executive Officer',
    image: '/team/kyle-kunze.svg',
    linkedin: 'https://www.linkedin.com/in/kylekunzemd/',
    bio: 'Leading ProtoCare AI\'s vision to revolutionize healthcare through artificial intelligence and evidence-based medicine.'
  },
  {
    name: 'Krishna Anand',
    role: 'CTO',
    title: 'Chief Technology Officer',
    image: '/team/krishna-anand.svg',
    linkedin: 'https://www.linkedin.com/in/krishna-anand',
    bio: 'Driving technological innovation and architecting cutting-edge AI solutions for healthcare providers and patients.'
  },
  {
    name: 'Joshua Dines',
    role: 'CSO',
    title: 'Chief Scientific Officer',
    image: '/team/joshua-dines.svg',
    linkedin: 'https://www.linkedin.com/in/joshua-dines-md-7233b75/',
    bio: 'Shaping strategic direction and fostering partnerships to advance AI-powered healthcare delivery.'
  }
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background blobs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full p-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link
              href="/"
              className="text-white hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full px-6 pb-12">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                About <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">ProtoCare AI</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                We're building the future of healthcare with AI-powered, evidence-based medical assistance
                that empowers both patients and providers with instant, reliable answers.
              </p>
            </div>

            {/* Mission Statement */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 mb-16 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">Our Mission</h2>
              <p className="text-lg text-gray-200 leading-relaxed text-center max-w-4xl mx-auto">
                To democratize access to high-quality medical information by combining cutting-edge artificial
                intelligence with evidence-based medicine, ensuring that everyone—from patients seeking clarity
                to healthcare providers making critical decisions—has instant access to trusted, accurate medical knowledge.
              </p>
            </div>

            {/* Team Section */}
            <div className="mb-16">
              <h2 className="text-4xl font-bold text-white mb-12 text-center">
                Meet Our <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">Leadership Team</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {teamMembers.map((member) => (
                  <div
                    key={member.name}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-purple-400/50 transition-all hover:transform hover:scale-105"
                  >
                    {/* Profile Image */}
                    <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-purple-400/50">
                      <Image
                        src={member.image}
                        alt={`${member.name} - ${member.role}`}
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>

                    {/* Member Info */}
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-1">
                        {member.name}
                      </h3>
                      <p className="text-purple-300 font-semibold text-lg mb-1">
                        {member.role}
                      </p>
                      <p className="text-gray-400 text-sm mb-4">
                        {member.title}
                      </p>

                      {/* Bio */}
                      <p className="text-gray-300 leading-relaxed mb-6">
                        {member.bio}
                      </p>

                      {/* LinkedIn Link */}
                      {member.linkedin && (
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                          Connect on LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Values Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Evidence-Based</h3>
                <p className="text-gray-300">
                  Every answer is grounded in peer-reviewed medical literature and clinical guidelines.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Lightning Fast</h3>
                <p className="text-gray-300">
                  Get comprehensive medical answers in seconds, not hours of research.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Patient-Centered</h3>
                <p className="text-gray-300">
                  Designed to empower both patients and providers with accessible medical knowledge.
                </p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Experience AI-Powered Healthcare?
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                Join thousands of patients and providers who trust ProtoCare AI for medical answers.
              </p>
              <Link
                href="/"
                className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full py-6 px-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
            <p>&copy; 2025 ProtoCare AI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
