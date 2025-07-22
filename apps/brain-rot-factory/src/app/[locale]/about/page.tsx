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
                {(Array.isArray(t.raw('collaboration.highlights'))
                  ? t.raw('collaboration.highlights')
                  : []
                ).map((highlight: string, i: number) => (
                  <div key={i} className="flex items-start">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-3 mr-3 flex-shrink-0"></div>
                    <p className="text-white/80">{highlight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI Journey Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <Sparkles className="w-8 h-8 text-indigo-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">
                  {t('aiJourney.title')}
                </h2>
              </div>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                {t('aiJourney.description')}
              </p>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Claude 3.7 Section */}
                <div className="bg-white/5 rounded-xl p-6 border border-orange-400/30">
                  <h3 className="text-xl font-bold text-orange-300 mb-3">
                    {t('aiJourney.claude37.title')}
                  </h3>
                  <p className="text-white/80 mb-4 text-sm">
                    {t('aiJourney.claude37.description')}
                  </p>
                  <div className="space-y-2">
                    {t
                      .raw('aiJourney.claude37.challenges')
                      ?.map((challenge: string, i: number) => (
                        <div key={i} className="flex items-start">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-white/70 text-sm">{challenge}</p>
                        </div>
                      ))}
                  </div>
                  <div className="mt-4 p-3 bg-orange-400/10 rounded-lg border-l-2 border-orange-400">
                    <p className="text-white/80 text-sm italic">
                      {t('aiJourney.claude37.learnings')}
                    </p>
                  </div>
                </div>

                {/* Claude 4 Section */}
                <div className="bg-white/5 rounded-xl p-6 border border-green-400/30">
                  <h3 className="text-xl font-bold text-green-300 mb-3">
                    {t('aiJourney.claude4.title')}
                  </h3>
                  <p className="text-white/80 mb-4 text-sm">
                    {t('aiJourney.claude4.description')}
                  </p>
                  <div className="space-y-2">
                    {t
                      .raw('aiJourney.claude4.achievements')
                      .map((achievement: string, i: number) => (
                        <div key={i} className="flex items-start">
                          <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-white/70 text-sm">{achievement}</p>
                        </div>
                      ))}
                  </div>
                  <div className="mt-4 p-3 bg-green-400/10 rounded-lg border-l-2 border-green-400">
                    <p className="text-white/80 text-sm italic">
                      {t('aiJourney.claude4.breakthrough')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Creative Process Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <Target className="w-8 h-8 text-cyan-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">
                  {t('creativeProcess.title')}
                </h2>
              </div>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                {t('creativeProcess.description')}
              </p>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Technical Discoveries */}
                <div className="bg-white/5 rounded-xl p-6 border border-blue-400/30">
                  <h3 className="text-lg font-bold text-blue-300 mb-3">
                    {t('creativeProcess.technicalDiscoveries.title')}
                  </h3>
                  <div className="space-y-2">
                    {t
                      .raw('creativeProcess.technicalDiscoveries.examples')
                      .map((example: string, i: number) => (
                        <div key={i} className="flex items-start">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-white/70 text-sm">{example}</p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Design Journey */}
                <div className="bg-white/5 rounded-xl p-6 border border-purple-400/30">
                  <h3 className="text-lg font-bold text-purple-300 mb-3">
                    {t('creativeProcess.designJourney.title')}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-purple-200 text-xs font-medium">
                        Visão:
                      </p>
                      <p className="text-white/70 text-sm">
                        {t('creativeProcess.designJourney.vision')}
                      </p>
                    </div>
                    <div>
                      <p className="text-purple-200 text-xs font-medium">
                        Resultado:
                      </p>
                      <p className="text-white/70 text-sm">
                        {t('creativeProcess.designJourney.result')}
                      </p>
                    </div>
                    <div>
                      <p className="text-purple-200 text-xs font-medium">
                        Ícone:
                      </p>
                      <p className="text-white/70 text-sm">
                        {t('creativeProcess.designJourney.iconAnimation')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Paradigm Shift */}
                <div className="bg-white/5 rounded-xl p-6 border border-pink-400/30">
                  <h3 className="text-lg font-bold text-pink-300 mb-3">
                    {t('creativeProcess.paradigmShift.title')}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-pink-200 text-xs font-medium">
                        Antes:
                      </p>
                      <p className="text-white/70 text-sm">
                        {t('creativeProcess.paradigmShift.before')}
                      </p>
                    </div>
                    <div>
                      <p className="text-pink-200 text-xs font-medium">
                        Depois:
                      </p>
                      <p className="text-white/70 text-sm">
                        {t('creativeProcess.paradigmShift.after')}
                      </p>
                    </div>
                    <div className="mt-3 p-3 bg-pink-400/10 rounded-lg">
                      <p className="text-white/80 text-sm italic">
                        {t('creativeProcess.paradigmShift.confidence')}
                      </p>
                    </div>
                  </div>
                </div>
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
                {t
                  .raw('development.features')
                  .map((feature: string, i: number) => (
                    <div key={i} className="flex items-start">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-3 mr-3 flex-shrink-0"></div>
                      <p className="text-white/80">{feature}</p>
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
                {t
                  .raw('philosophy.principles')
                  .map((principle: string, i: number) => (
                    <div key={i} className="flex items-start">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-3 mr-3 flex-shrink-0"></div>
                      <p className="text-white/80">{principle}</p>
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
                {t.raw('impact.lessons').map((lesson: string, i: number) => (
                  <div key={i} className="flex items-start">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-3 mr-3 flex-shrink-0"></div>
                    <p className="text-white/80">{lesson}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Practical Advice Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 backdrop-blur-sm rounded-2xl p-8 border border-amber-400/30">
              <div className="flex items-center mb-6">
                <Target className="w-8 h-8 text-amber-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">
                  {t('practicalAdvice.title')}
                </h2>
              </div>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                {t('practicalAdvice.description')}
              </p>

              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                {/* Guidelines */}
                <div className="bg-white/5 rounded-xl p-6 border border-red-400/30">
                  <h3 className="text-lg font-bold text-red-300 mb-4">
                    {t('practicalAdvice.guidelines.title')}
                  </h3>
                  <div className="space-y-3">
                    {t
                      .raw('practicalAdvice.guidelines.rules')
                      .map((rule: string, i: number) => (
                        <div key={i} className="flex items-start">
                          <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-white/80 text-sm">{rule}</p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Red Flags */}
                <div className="bg-white/5 rounded-xl p-6 border border-yellow-400/30">
                  <h3 className="text-lg font-bold text-yellow-300 mb-3">
                    {t('practicalAdvice.redFlags.title')}
                  </h3>
                  <p className="text-white/70 text-sm mb-4">
                    {t('practicalAdvice.redFlags.description')}
                  </p>
                  <div className="space-y-2">
                    {t
                      .raw('practicalAdvice.redFlags.signs')
                      .map((sign: string, i: number) => (
                        <div key={i} className="flex items-start">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-white/70 text-sm">{sign}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Best Practices */}
                <div className="bg-white/5 rounded-xl p-6 border border-green-400/30">
                  <h3 className="text-lg font-bold text-green-300 mb-4">
                    {t('practicalAdvice.bestPractices.title')}
                  </h3>
                  <div className="space-y-3">
                    {t
                      .raw('practicalAdvice.bestPractices.tips')
                      .map((tip: string, i: number) => (
                        <div key={i} className="flex items-start">
                          <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-white/80 text-sm">{tip}</p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Breakthrough Moments */}
                <div className="bg-white/5 rounded-xl p-6 border border-blue-400/30">
                  <h3 className="text-lg font-bold text-blue-300 mb-3">
                    {t('practicalAdvice.breakthrough.title')}
                  </h3>
                  <p className="text-white/70 text-sm mb-4">
                    {t('practicalAdvice.breakthrough.description')}
                  </p>
                  <div className="space-y-2">
                    {t
                      .raw('practicalAdvice.breakthrough.examples')
                      .map((example: string, i: number) => (
                        <div key={i} className="flex items-start">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-white/70 text-sm">{example}</p>
                        </div>
                      ))}
                  </div>
                </div>
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

        {/* Development Setbacks Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 backdrop-blur-sm rounded-2xl p-8 border border-red-400/30">
              <div className="flex items-center mb-6">
                <Target className="w-8 h-8 text-red-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">
                  {t('practicalAdvice.developmentSetbacks.title')}
                </h2>
              </div>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                {t('practicalAdvice.developmentSetbacks.description')}
              </p>

              <div className="space-y-8">
                {/* Contract Breach */}
                <div className="bg-white/5 rounded-xl p-6 border border-red-400/30">
                  <h3 className="text-xl font-bold text-red-300 mb-4">
                    {t(
                      'practicalAdvice.developmentSetbacks.contractBreach.title',
                    )}
                  </h3>
                  <p className="text-white/80 mb-4 text-sm leading-relaxed">
                    {t(
                      'practicalAdvice.developmentSetbacks.contractBreach.description',
                    )}
                  </p>
                  <div className="space-y-2 mb-4">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="flex items-start">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-white/70 text-sm">
                          {t(
                            `practicalAdvice.developmentSetbacks.contractBreach.timeline.${i}`,
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4">
                    <p className="text-red-100 text-sm italic">
                      {t(
                        'practicalAdvice.developmentSetbacks.contractBreach.legalIssues',
                      )}
                    </p>
                  </div>
                </div>

                {/* Rate Limiting Problem */}
                <div className="bg-white/5 rounded-xl p-6 border border-orange-400/30">
                  <h3 className="text-xl font-bold text-orange-300 mb-4">
                    {t(
                      'practicalAdvice.developmentSetbacks.rateLimitingProblem.title',
                    )}
                  </h3>
                  <p className="text-white/80 mb-4 text-sm leading-relaxed">
                    {t(
                      'practicalAdvice.developmentSetbacks.rateLimitingProblem.description',
                    )}
                  </p>
                  <div className="mb-4">
                    <a
                      href="https://github.com/microsoft/vscode/issues/253124"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline text-sm"
                    >
                      {t(
                        'practicalAdvice.developmentSetbacks.rateLimitingProblem.issueLink',
                      )}
                    </a>
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div key={i} className="flex items-start">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-white/70 text-sm">
                          {t(
                            `practicalAdvice.developmentSetbacks.rateLimitingProblem.impact.${i}`,
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Impact */}
                <div className="bg-white/5 rounded-xl p-6 border border-yellow-400/30">
                  <h3 className="text-xl font-bold text-yellow-300 mb-4">
                    {t(
                      'practicalAdvice.developmentSetbacks.financialImpact.title',
                    )}
                  </h3>
                  <p className="text-white/80 mb-4 text-sm leading-relaxed">
                    {t(
                      'practicalAdvice.developmentSetbacks.financialImpact.description',
                    )}
                  </p>
                  <div className="space-y-2 mb-4">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="flex items-start">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-white/70 text-sm">
                          {t(
                            `practicalAdvice.developmentSetbacks.financialImpact.costs.${i}`,
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4">
                    <p className="text-yellow-100 text-sm italic">
                      {t(
                        'practicalAdvice.developmentSetbacks.financialImpact.businessImpact',
                      )}
                    </p>
                  </div>
                </div>

                {/* Why It's Absurd */}
                <div className="bg-white/5 rounded-xl p-6 border border-purple-400/30">
                  <h3 className="text-xl font-bold text-purple-300 mb-4">
                    {t(
                      'practicalAdvice.developmentSetbacks.whyItsAbsurd.title',
                    )}
                  </h3>
                  <p className="text-white/80 mb-4 text-sm leading-relaxed">
                    {t(
                      'practicalAdvice.developmentSetbacks.whyItsAbsurd.description',
                    )}
                  </p>
                  <div className="space-y-2">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div key={i} className="flex items-start">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-white/70 text-sm">
                          {t(
                            `practicalAdvice.developmentSetbacks.whyItsAbsurd.problems.${i}`,
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Microsoft Gaslighting */}
                <div className="bg-white/5 rounded-xl p-6 border border-pink-400/30">
                  <h3 className="text-xl font-bold text-pink-300 mb-4">
                    {t(
                      'practicalAdvice.developmentSetbacks.microsoftGaslighting.title',
                    )}
                  </h3>
                  <p className="text-white/80 mb-4 text-sm leading-relaxed">
                    {t(
                      'practicalAdvice.developmentSetbacks.microsoftGaslighting.description',
                    )}
                  </p>
                  <div className="space-y-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="flex items-start">
                        <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-white/70 text-sm">
                          {t(
                            `practicalAdvice.developmentSetbacks.microsoftGaslighting.tactics.${i}`,
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real World Impact */}
                <div className="bg-white/5 rounded-xl p-6 border border-blue-400/30">
                  <h3 className="text-xl font-bold text-blue-300 mb-4">
                    {t(
                      'practicalAdvice.developmentSetbacks.realWorldImpact.title',
                    )}
                  </h3>
                  <p className="text-white/80 mb-4 text-sm leading-relaxed">
                    {t(
                      'practicalAdvice.developmentSetbacks.realWorldImpact.description',
                    )}
                  </p>
                  <div className="space-y-2">
                    {Array.from({ length: 6 }, (_, i) => (
                      <div key={i} className="flex items-start">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-white/70 text-sm">
                          {t(
                            `practicalAdvice.developmentSetbacks.realWorldImpact.consequences.${i}`,
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Microsoft Fail */}
                <div className="bg-white/5 rounded-xl p-6 border border-indigo-400/30">
                  <h3 className="text-xl font-bold text-indigo-300 mb-4">
                    {t(
                      'practicalAdvice.developmentSetbacks.microsoftFail.title',
                    )}
                  </h3>
                  <p className="text-white/80 mb-4 text-sm leading-relaxed">
                    {t(
                      'practicalAdvice.developmentSetbacks.microsoftFail.description',
                    )}
                  </p>
                  <div className="space-y-2">
                    {Array.from({ length: 6 }, (_, i) => (
                      <div key={i} className="flex items-start">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-white/70 text-sm">
                          {t(
                            `practicalAdvice.developmentSetbacks.microsoftFail.failurePoints.${i}`,
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Platform Risk */}
                <div className="bg-white/5 rounded-xl p-6 border border-cyan-400/30">
                  <h3 className="text-xl font-bold text-cyan-300 mb-4">
                    {t(
                      'practicalAdvice.developmentSetbacks.platformRisk.title',
                    )}
                  </h3>
                  <p className="text-white/80 mb-4 text-sm leading-relaxed">
                    {t(
                      'practicalAdvice.developmentSetbacks.platformRisk.description',
                    )}
                  </p>
                  <div className="space-y-2">
                    {Array.from({ length: 4 }, (_, i) => (
                      <div key={i} className="flex items-start">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-white/70 text-sm">
                          {t(
                            `practicalAdvice.developmentSetbacks.platformRisk.lessons.${i}`,
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
