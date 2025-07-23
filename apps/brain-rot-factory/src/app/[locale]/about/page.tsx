import { Calendar, Code, Cpu, Github, Heart, Target } from 'lucide-react'
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

        {/* Overview Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <Target className="w-8 h-8 text-blue-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">
                  {t('overview.title')}
                </h2>
              </div>
              <p className="text-white/90 text-lg leading-relaxed">
                {t('overview.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <Calendar className="w-8 h-8 text-green-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">
                  {t('timeline.title')}
                </h2>
              </div>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                {t('timeline.description')}
              </p>

              <div className="space-y-6">
                {t.raw('timeline.events').map(
                  (
                    event: {
                      date: string
                      title: string
                      description: string
                    },
                    i: number,
                  ) => (
                    <div
                      key={i}
                      className="bg-white/5 rounded-xl p-6 border border-white/10"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-white">
                          {event.title}
                        </h3>
                        <span className="text-purple-300 text-sm font-medium">
                          {event.date}
                        </span>
                      </div>
                      <p className="text-white/80">{event.description}</p>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        {/* AI Journey Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <Cpu className="w-8 h-8 text-indigo-400 mr-3" />
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
                  <div className="mb-4">
                    <h4 className="text-orange-200 text-sm font-medium mb-2">
                      Desafios:
                    </h4>
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
                  </div>
                  <div className="mt-4 p-3 bg-orange-400/10 rounded-lg border-l-2 border-orange-400">
                    <h4 className="text-orange-200 text-sm font-medium mb-2">
                      Aprendizados:
                    </h4>
                    <div className="space-y-1">
                      {t
                        .raw('aiJourney.claude37.learnings')
                        ?.map((learning: string, i: number) => (
                          <p key={i} className="text-white/80 text-sm">
                            • {learning}
                          </p>
                        ))}
                    </div>
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
                  <div className="mb-4">
                    <h4 className="text-green-200 text-sm font-medium mb-2">
                      Conquistas:
                    </h4>
                    <div className="space-y-2">
                      {t
                        .raw('aiJourney.claude4.achievements')
                        .map((achievement: string, i: number) => (
                          <div key={i} className="flex items-start">
                            <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <p className="text-white/70 text-sm">
                              {achievement}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-400/10 rounded-lg border-l-2 border-green-400">
                    <h4 className="text-green-200 text-sm font-medium mb-2">
                      Breakthrough:
                    </h4>
                    <div className="space-y-1">
                      {t
                        .raw('aiJourney.claude4.breakthrough')
                        ?.map((breakthrough: string, i: number) => (
                          <p key={i} className="text-white/80 text-sm">
                            • {breakthrough}
                          </p>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Design Journey */}
              <div className="mt-8 bg-white/5 rounded-xl p-6 border border-purple-400/30">
                <h3 className="text-xl font-bold text-purple-300 mb-3">
                  {t('aiJourney.designJourney.title')}
                </h3>
                <p className="text-white/80 text-sm">
                  {t('aiJourney.designJourney.description')}
                </p>
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

        {/* Architecture Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <Cpu className="w-8 h-8 text-blue-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">
                  {t('architecture.title')}
                </h2>
              </div>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                {t('architecture.description')}
              </p>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Stats */}
                <div className="bg-white/5 rounded-xl p-6 border border-blue-400/30">
                  <h3 className="text-xl font-bold text-blue-300 mb-3">
                    {t('architecture.stats.title')}
                  </h3>
                  <div className="space-y-2">
                    {t
                      .raw('architecture.stats.metrics')
                      .map((metric: string, i: number) => (
                        <div key={i} className="flex items-start">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-white/70 text-sm">{metric}</p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Monorepo */}
                <div className="bg-white/5 rounded-xl p-6 border border-purple-400/30">
                  <h3 className="text-xl font-bold text-purple-300 mb-3">
                    {t('architecture.monorepo.title')}
                  </h3>
                  <p className="text-white/80 mb-4 text-sm">
                    {t('architecture.monorepo.description')}
                  </p>
                  <div className="space-y-2">
                    {t
                      .raw('architecture.monorepo.packages')
                      .map((pkg: string, i: number) => (
                        <div key={i} className="flex items-start">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-white/70 text-sm">{pkg}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Testing */}
              <div className="mt-8 bg-white/5 rounded-xl p-6 border border-green-400/30">
                <h3 className="text-xl font-bold text-green-300 mb-3">
                  {t('architecture.testing.title')}
                </h3>
                <p className="text-white/80 mb-4 text-sm">
                  {t('architecture.testing.description')}
                </p>
                <div className="bg-green-400/10 rounded-lg p-4">
                  <h4 className="text-green-200 text-sm font-medium mb-2">
                    {t('architecture.testing.aiTestingStats.title')}
                  </h4>
                  <div className="space-y-1">
                    {t
                      .raw('architecture.testing.aiTestingStats.results')
                      .map((result: string, i: number) => (
                        <p key={i} className="text-white/80 text-sm">
                          • {result}
                        </p>
                      ))}
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="mt-8 bg-white/5 rounded-xl p-6 border border-yellow-400/30">
                <h3 className="text-xl font-bold text-yellow-300 mb-3">
                  {t('architecture.highlights.title')}
                </h3>
                <p className="text-white/80 mb-4 text-sm">
                  {t('architecture.highlights.description')}
                </p>
                <div className="space-y-2">
                  {t
                    .raw('architecture.highlights.achievements')
                    .map((achievement: string, i: number) => (
                      <div key={i} className="flex items-start">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-white/70 text-sm">{achievement}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <Heart className="w-8 h-8 text-purple-400 mr-3" />
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
                    {t
                      .raw(
                        'practicalAdvice.developmentSetbacks.contractBreach.timeline',
                      )
                      .map((item: string, i: number) => (
                        <div key={i} className="flex items-start">
                          <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-white/70 text-sm">{item}</p>
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
                    {t
                      .raw(
                        'practicalAdvice.developmentSetbacks.rateLimitingProblem.impact',
                      )
                      .map((impact: string, i: number) => (
                        <div key={i} className="flex items-start">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-white/70 text-sm">{impact}</p>
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
                    {t
                      .raw(
                        'practicalAdvice.developmentSetbacks.financialImpact.costs',
                      )
                      .map((cost: string, i: number) => (
                        <div key={i} className="flex items-start">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-white/70 text-sm">{cost}</p>
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
              </div>
            </div>
          </div>
        </section>

        {/* Future & Open Source Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-400/30">
              <div className="flex items-center mb-6">
                <Github className="w-8 h-8 text-white mr-3" />
                <h2 className="text-3xl font-bold text-white">
                  {t('future.title')}
                </h2>
              </div>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                {t('future.description')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Link
                  href="https://github.com/rodrigogs/vibecode-playground"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-6 py-3 text-white font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <Github className="w-5 h-5" />
                  {t('future.githubLink')}
                </Link>
                <span className="text-white/70">{t('future.licenseText')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tooling Support Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <Code className="w-8 h-8 text-cyan-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">
                  {t('toolingSupport.title')}
                </h2>
              </div>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                {t('toolingSupport.description')}
              </p>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Script Purpose */}
                <div className="bg-white/5 rounded-xl p-6 border border-cyan-400/30">
                  <h3 className="text-lg font-bold text-cyan-300 mb-3">
                    {t('toolingSupport.scriptPurpose.title')}
                  </h3>
                  <p className="text-white/80 mb-4 text-sm">
                    {t('toolingSupport.scriptPurpose.description')}
                  </p>
                  <div className="space-y-2">
                    {t
                      .raw('toolingSupport.scriptPurpose.capabilities')
                      .map((capability: string, i: number) => (
                        <div key={i} className="flex items-start">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-white/70 text-sm">{capability}</p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Technical Implementation */}
                <div className="bg-white/5 rounded-xl p-6 border border-blue-400/30">
                  <h3 className="text-lg font-bold text-blue-300 mb-3">
                    {t('toolingSupport.technicalImplementation.title')}
                  </h3>
                  <p className="text-white/80 mb-4 text-sm">
                    {t('toolingSupport.technicalImplementation.description')}
                  </p>
                  <div className="space-y-2">
                    {t
                      .raw('toolingSupport.technicalImplementation.features')
                      .map((feature: string, i: number) => (
                        <div key={i} className="flex items-start">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-white/70 text-sm">{feature}</p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Development Impact */}
                <div className="bg-white/5 rounded-xl p-6 border border-green-400/30">
                  <h3 className="text-lg font-bold text-green-300 mb-3">
                    {t('toolingSupport.developmentImpact.title')}
                  </h3>
                  <p className="text-white/80 mb-4 text-sm">
                    {t('toolingSupport.developmentImpact.description')}
                  </p>
                  <div className="space-y-2">
                    {t
                      .raw('toolingSupport.developmentImpact.achievements')
                      .map((achievement: string, i: number) => (
                        <div key={i} className="flex items-start">
                          <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-white/70 text-sm">{achievement}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
