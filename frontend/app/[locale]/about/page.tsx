'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface TeamMember {
  name: string;
  role: string;
  title: string;
  image: string;
  linkedin?: string;
  bio: string;
}

interface ClinicalAdvisor {
  name: string;
  title: string;
  image: string;
  affiliations?: string[];
}

const getTeamMembers = (t: any): TeamMember[] => [
  {
    name: t('about.team.members.kyle.name'),
    role: t('about.team.members.kyle.role'),
    title: t('about.team.members.kyle.title'),
    image: '/team/kyle-kunze.jpg',
    linkedin: 'https://www.linkedin.com/in/kylekunzemd/',
    bio: t('about.team.members.kyle.bio')
  },
  {
    name: t('about.team.members.krishna.name'),
    role: t('about.team.members.krishna.role'),
    title: t('about.team.members.krishna.title'),
    image: '/team/krishna-anand.jpg',
    linkedin: 'https://www.linkedin.com/in/krishna-anand',
    bio: t('about.team.members.krishna.bio')
  },
  {
    name: t('about.team.members.joshua.name'),
    role: t('about.team.members.joshua.role'),
    title: t('about.team.members.joshua.title'),
    image: '/team/joshua-dines.jpg',
    linkedin: 'https://www.linkedin.com/in/joshua-dines-md-7233b75/',
    bio: t('about.team.members.joshua.bio')
  }
];

const clinicalAdvisors: ClinicalAdvisor[] = [
  {
    name: 'William Long',
    title: 'Director of Adult Reconstruction and Joint Replacement',
    image: '/team/william-long.jpg',
    affiliations: [
      'Associate Attending Orthopaedic Surgeon HSS',
      'Associate Professor Orthopaedic Surgery, Weill Cornell'
    ]
  },
  {
    name: 'Asheesh Bedi',
    title: 'Director of Sports Medicine',
    image: '/team/asheesh-bedi.jpg',
    affiliations: [
      'Executive Director and Division Chief of Sports Medicine at University of Michigan',
      'Former Team Physician, Chicago Bears',
      'Former Team Physician, Detroit Lions',
      'Medical Director for NBA Players Association'
    ]
  },
  {
    name: 'Sheeraz Qureshi',
    title: 'Director of Spine Surgery',
    image: '/team/sheeraz-qureshi.jpg',
    affiliations: [
      'Co-Chief of Spine Surgery, HSS',
      'Chief Medical Officer, HSS Florida'
    ]
  },
  {
    name: 'Khalid Alkhelaifi',
    title: 'Director of International Musculoskeletal Health',
    image: '/team/khalid-alkhelaifi.jpg',
    affiliations: [
      'Knee and Shoulder Surgeon, Aspetar (Doha, Qatar)'
    ]
  }
];

export default function AboutUs() {
  const t = useTranslations();
  const teamMembers = getTeamMembers(t);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background blobs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full p-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link
              href="/"
              className="text-white hover:text-cyan-300 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('common.backToHome')}
            </Link>
            <LanguageSwitcher />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full px-6 pb-12">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                {t('about.title')} <span className="bg-gradient-to-r from-cyan-400 to-teal-400 text-transparent bg-clip-text">{t('about.careguide')}</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                {t('about.hero.description')}
              </p>
            </div>

            {/* Mission Statement */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 mb-16 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">{t('about.mission.title')}</h2>
              <p className="text-lg text-gray-200 leading-relaxed text-center max-w-4xl mx-auto">
                {t('about.mission.description')}
              </p>
            </div>

            {/* Team Section */}
            <div className="mb-16">
              <h2 className="text-4xl font-bold text-white mb-12 text-center">
                {t('about.team.title')} <span className="bg-gradient-to-r from-cyan-400 to-teal-400 text-transparent bg-clip-text">{t('about.team.subtitle')}</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {teamMembers.map((member) => (
                  <div
                    key={member.name}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-cyan-400/50 transition-all hover:transform hover:scale-105"
                  >
                    {/* Profile Image */}
                    <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-cyan-400/50">
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
                      <p className="text-cyan-300 font-semibold text-lg mb-1">
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
                          className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                          {t('about.team.connectLinkedIn')}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Advisor Board Section */}
            <div className="mb-16">
              <h2 className="text-4xl font-bold text-white mb-4 text-center">
                <span className="bg-gradient-to-r from-cyan-400 to-teal-400 text-transparent bg-clip-text">{t('about.advisors.title')}</span>
              </h2>
              <p className="text-gray-300 text-center mb-12 max-w-3xl mx-auto">
                {t('about.advisors.description')}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {clinicalAdvisors.map((advisor) => (
                  <div
                    key={advisor.name}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-cyan-400/50 transition-all hover:transform hover:scale-105"
                  >
                    {/* Profile Image */}
                    <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-cyan-400/50">
                      <Image
                        src={advisor.image}
                        alt={`${advisor.name}`}
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>

                    {/* Advisor Info */}
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-white mb-2">
                        {advisor.name}
                      </h3>
                      <p className="text-cyan-300 text-sm mb-3">
                        {advisor.title}
                      </p>
                      {advisor.affiliations && advisor.affiliations.length > 0 && (
                        <div className="space-y-1">
                          {advisor.affiliations.map((affiliation, index) => (
                            <p key={index} className="text-xs text-gray-400">
                              {affiliation}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Values Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{t('about.values.evidenceBased.title')}</h3>
                <p className="text-gray-300">
                  {t('about.values.evidenceBased.description')}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{t('about.values.fast.title')}</h3>
                <p className="text-gray-300">
                  {t('about.values.fast.description')}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{t('about.values.patientCentered.title')}</h3>
                <p className="text-gray-300">
                  {t('about.values.patientCentered.description')}
                </p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center bg-gradient-to-r from-cyan-500/20 to-teal-500/20 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-4">
                {t('about.cta.title')}
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                {t('about.cta.description')}
              </p>
              <Link
                href="/app"
                className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-700 transition-all transform hover:scale-105"
              >
                {t('about.cta.button')}
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full py-6 px-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
            <p>{t('about.footer.copyright')}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
