'use client'

import { useTranslations } from 'next-intl'

import PageNavigation from '@/components/PageNavigation'

export default function TermsOfService() {
  const t = useTranslations('Legal')

  const rightNavigationLinks = [{ href: '/privacy', label: t('privacyTitle') }]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        <PageNavigation rightLinks={rightNavigationLinks} />

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              {t('termsTitle')}
            </h1>
            <p className="text-white/70 text-lg">{t('termsSubtitle')}</p>
            <p className="text-white/60 text-sm mt-2">
              {t('lastUpdated')}: {t('termsLastUpdated')}
            </p>
          </div>

          {/* Content */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-2xl border border-white/20">
            <div className="prose prose-invert max-w-none">
              {/* Section 1: Introduction */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  1. {t('introduction')}
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  {t('termsIntroduction')}
                </p>
                <p className="text-white/80 leading-relaxed">
                  {t('termsAcceptance')}
                </p>
              </section>

              {/* Section 1.5: Open Source Notice */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  1.1. {t('openSourceNotice')}
                </h2>
                <p className="text-white/80 leading-relaxed">
                  {t('openSourceNoticeText')}
                </p>
              </section>

              {/* Section 2: Service Description */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  2. {t('serviceDescription')}
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  {t('serviceDescriptionText')}
                </p>
                <ul className="text-white/80 space-y-2 ml-6 list-disc">
                  <li>{t('serviceFeature1')}</li>
                  <li>{t('serviceFeature2')}</li>
                  <li>{t('serviceFeature3')}</li>
                  <li>{t('serviceFeature4')}</li>
                  <li>{t('serviceFeature5')}</li>
                </ul>
              </section>

              {/* Section 3: User Responsibilities */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  3. {t('userResponsibilities')}
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  {t('userResponsibilitiesText')}
                </p>
                <ul className="text-white/80 space-y-2 ml-6 list-disc">
                  <li>{t('userRule1')}</li>
                  <li>{t('userRule2')}</li>
                  <li>{t('userRule3')}</li>
                  <li>{t('userRule4')}</li>
                  <li>{t('userRule5')}</li>
                </ul>
              </section>

              {/* Section 4: Intellectual Property */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  4. {t('intellectualProperty')}
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  {t('intellectualPropertyText')}
                </p>
                <p className="text-white/80 leading-relaxed">
                  {t('userContentRights')}
                </p>
              </section>

              {/* Section 4.1: Open Source License */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  4.1. {t('openSourceLicense')}
                </h2>
                <p className="text-white/80 leading-relaxed">
                  {t('openSourceLicenseText')}
                </p>
              </section>

              {/* Section 5: Privacy and Data Protection */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  5. {t('privacyDataProtection')}
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  {t('privacyDataProtectionText')}
                </p>
                <p className="text-white/80 leading-relaxed">
                  {t('lgpdCompliance')}
                </p>
              </section>

              {/* Section 6: Inactive Features */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  6. {t('inactiveFeatures')}
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  {t('inactiveFeaturesText')}
                </p>
                <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-yellow-300 mb-2">
                    {t('inactiveFeaturesList')}
                  </h3>
                  <p className="text-yellow-100/80 text-sm leading-relaxed">
                    {t('inactiveFeaturesDesc')}
                  </p>
                </div>
              </section>

              {/* Section 7: Limitations of Liability */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  7. {t('limitationsLiability')}
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  {t('limitationsLiabilityText')}
                </p>
                <p className="text-white/80 leading-relaxed">
                  {t('disclaimerText')}
                </p>
              </section>

              {/* Section 8: Termination */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  8. {t('termination')}
                </h2>
                <p className="text-white/80 leading-relaxed">
                  {t('terminationText')}
                </p>
              </section>

              {/* Section 9: Governing Law */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  9. {t('governingLaw')}
                </h2>
                <p className="text-white/80 leading-relaxed">
                  {t('governingLawText')}
                </p>
              </section>

              {/* Section 10: Changes to Terms */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  10. {t('changesTerms')}
                </h2>
                <p className="text-white/80 leading-relaxed">
                  {t('changesTermsText')}
                </p>
              </section>

              {/* Section 11: Contact Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  11. {t('contactInformation')}
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  {t('contactInformationText')}
                </p>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/90 font-semibold mb-2">
                    {t('contactDetails')}:
                  </p>
                  <ul className="text-white/80 space-y-1">
                    <li>{t('ownerName')}: Rodrigo Gomes da Silva</li>
                    <li>{t('emailLabel')}: rodrigo.smscom@gmail.com</li>
                    <li>{t('githubLabel')}: @rodrigogs</li>
                    <li>
                      {t('dataProtectionOfficer')}: rodrigo.smscom@gmail.com
                    </li>
                    <li>{t('addressLabel')}: Rio Grande do Sul, Brasil</li>
                  </ul>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
