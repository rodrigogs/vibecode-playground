import { Code, Github, Heart, Sparkles, Target, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'

import PageNavigation from '@/components/PageNavigation'

interface AboutPageProps {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'About' })

  return {
    title: t('title'),
    description: t('introduction'),
  }
}

export default function AboutPage() {
  const t = useTranslations('About')
  const tLegal = useTranslations('Legal')

  const rightNavigationLinks = [
    { href: '/terms', label: tLegal('termsTitle') },
    { href: '/privacy', label: tLegal('privacyTitle') },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900">
      <div className="container mx-auto px-4 py-16">
        <PageNavigation rightLinks={rightNavigationLinks} />

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-xl md:text-2xl text-purple-300 mb-8">
            {t('subtitle')}
          </p>
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-white/80">{t('introduction')}</p>
          </div>
        </div>

        {/* Journey Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <Sparkles className="w-8 h-8 text-yellow-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">
                  {t('journey.title')}
                </h2>
              </div>
              <p className="text-white/90 text-lg leading-relaxed">
                {t('journey.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Collaboration Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <Users className="w-8 h-8 text-blue-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">
                  {t('collaboration.title')}
                </h2>
              </div>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                {t('collaboration.description')}
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex items-start">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-3 mr-3 flex-shrink-0"></div>
                    <p className="text-white/80">
                      {t(`collaboration.highlights.${i}`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Development Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <Code className="w-8 h-8 text-green-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">
                  {t('development.title')}
                </h2>
              </div>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                {t('development.description')}
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="flex items-start">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-3 mr-3 flex-shrink-0"></div>
                    <p className="text-white/80">
                      {t(`development.features.${i}`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <Target className="w-8 h-8 text-purple-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">
                  {t('philosophy.title')}
                </h2>
              </div>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                {t('philosophy.description')}
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex items-start">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-3 mr-3 flex-shrink-0"></div>
                    <p className="text-white/80">
                      {t(`philosophy.principles.${i}`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-8">
                <Heart className="w-8 h-8 text-red-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">
                  {t('team.title')}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Human Team Member */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {t('team.human.name')}
                  </h3>
                  <p className="text-purple-300 mb-4">{t('team.human.role')}</p>
                  <p className="text-white/80">{t('team.human.description')}</p>
                </div>

                {/* AI Team Member */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {t('team.ai.name')}
                  </h3>
                  <p className="text-blue-300 mb-4">{t('team.ai.role')}</p>
                  <p className="text-white/80">{t('team.ai.description')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6">
                {t('impact.title')}
              </h2>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                {t('impact.description')}
              </p>

              <div className="grid md:grid-cols-1 gap-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex items-start">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-3 mr-3 flex-shrink-0"></div>
                    <p className="text-white/80">{t(`impact.lessons.${i}`)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Future Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6">
                {t('future.title')}
              </h2>
              <p className="text-white/90 text-lg leading-relaxed">
                {t('future.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Acknowledgments */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6">
                {t('acknowledgments.title')}
              </h2>
              <p className="text-white/90 text-lg leading-relaxed">
                {t('acknowledgments.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Open Source Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-400/30">
              <div className="flex items-center mb-6">
                <Github className="w-8 h-8 text-white mr-3" />
                <h2 className="text-3xl font-bold text-white">
                  {t('openSource.title')}
                </h2>
              </div>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                {t('openSource.description')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Link
                  href="https://github.com/rodrigogs/vibecode-playground"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-6 py-3 text-white font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <Github className="w-5 h-5" />
                  {t('openSource.githubLink')}
                </Link>
                <span className="text-white/70">
                  {t('openSource.licenseText')}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
