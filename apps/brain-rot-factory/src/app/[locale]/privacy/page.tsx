'use client'

import { useTranslations } from 'next-intl'

import PageNavigation from '@/components/PageNavigation'

export default function PrivacyPolicy() {
  const t = useTranslations('Legal')

  const rightNavigationLinks = [{ href: '/terms', label: t('termsTitle') }]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        <PageNavigation rightLinks={rightNavigationLinks} />

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              {t('privacyTitle')}
            </h1>
            <p className="text-white/70 text-lg">{t('privacySubtitle')}</p>
            <p className="text-white/60 text-sm mt-2">
              {t('lastUpdated')}: {t('privacyLastUpdated')}
            </p>
          </div>

          {/* Content */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-2xl border border-white/20">
            <div className="prose prose-invert max-w-none">
              {/* LGPD Compliance Notice */}
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-6 mb-8">
                <h3 className="text-xl font-bold text-blue-300 mb-3">
                  {t('lgpdNoticeTitle')}
                </h3>
                <p className="text-blue-100 leading-relaxed">
                  {t('lgpdNoticeText')}
                </p>
              </div>

              {/* Section 1: Introduction */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  1. {t('introduction')}
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  {t('privacyIntroduction')}
                </p>
                <p className="text-white/80 leading-relaxed">
                  {t('privacyCommitment')}
                </p>
              </section>

              {/* Section 1.1: Hosted Instance Notice */}
              <section className="mb-8">
                <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-yellow-300 mb-3">
                    1.1. {t('hostedInstanceNotice')}
                  </h3>
                  <p className="text-yellow-100 leading-relaxed">
                    {t('hostedInstanceNoticeText')}
                  </p>
                </div>
              </section>

              {/* Section 2: Data We Collect */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  2. {t('dataWeCollect')}
                </h2>

                <h3 className="text-xl font-semibold text-white mb-3">
                  {t('personalDataTitle')}
                </h3>
                <ul className="text-white/80 space-y-2 ml-6 list-disc mb-6">
                  <li>
                    <strong>{t('authDataTitle')}:</strong> {t('authDataDesc')}
                  </li>
                  <li>
                    <strong>{t('usageDataTitle')}:</strong> {t('usageDataDesc')}
                  </li>
                  <li>
                    <strong>{t('technicalDataTitle')}:</strong>{' '}
                    {t('technicalDataDesc')}
                  </li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">
                  {t('nonPersonalDataTitle')}
                </h3>
                <ul className="text-white/80 space-y-2 ml-6 list-disc">
                  <li>{t('analyticsDataDesc')}</li>
                  <li>{t('performanceDataDesc')}</li>
                  <li>{t('aggregatedDataDesc')}</li>
                </ul>
              </section>

              {/* Section 3: Legal Basis for Processing */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  3. {t('legalBasisTitle')}
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  {t('legalBasisIntro')}
                </p>
                <ul className="text-white/80 space-y-3 ml-6 list-disc">
                  <li>
                    <strong>{t('consentTitle')}:</strong> {t('consentDesc')}
                  </li>
                  <li>
                    <strong>{t('contractTitle')}:</strong> {t('contractDesc')}
                  </li>
                  <li>
                    <strong>{t('legitimateInterestTitle')}:</strong>{' '}
                    {t('legitimateInterestDesc')}
                  </li>
                  <li>
                    <strong>{t('legalObligationTitle')}:</strong>{' '}
                    {t('legalObligationDesc')}
                  </li>
                </ul>
              </section>

              {/* Section 4: How We Use Your Data */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  4. {t('howWeUseData')}
                </h2>
                <ul className="text-white/80 space-y-2 ml-6 list-disc">
                  <li>{t('useData1')}</li>
                  <li>{t('useData2')}</li>
                  <li>{t('useData3')}</li>
                  <li>{t('useData4')}</li>
                  <li>{t('useData5')}</li>
                  <li>{t('useData6')}</li>
                </ul>
              </section>

              {/* Section 5: Data Sharing */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  5. {t('dataSharing')}
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  {t('dataSharingIntro')}
                </p>
                <ul className="text-white/80 space-y-2 ml-6 list-disc">
                  <li>
                    <strong>{t('serviceProvidersTitle')}:</strong>{' '}
                    {t('serviceProvidersDesc')}
                  </li>
                  <li>
                    <strong>{t('legalRequirementsTitle')}:</strong>{' '}
                    {t('legalRequirementsDesc')}
                  </li>
                  <li>
                    <strong>{t('businessTransferTitle')}:</strong>{' '}
                    {t('businessTransferDesc')}
                  </li>
                </ul>
              </section>

              {/* Section 6: Data Storage and Security */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  6. {t('dataStorageSecurity')}
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  {t('dataStorageSecurityText')}
                </p>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {t('securityMeasuresTitle')}
                </h3>
                <ul className="text-white/80 space-y-2 ml-6 list-disc">
                  <li>{t('securityMeasure1')}</li>
                  <li>{t('securityMeasure2')}</li>
                  <li>{t('securityMeasure3')}</li>
                  <li>{t('securityMeasure4')}</li>
                </ul>
              </section>

              {/* Section 7: Inactive Features */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  7. {t('inactiveFeatures')}
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

              {/* Section 8: Data Retention */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  8. {t('dataRetention')}
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  {t('dataRetentionText')}
                </p>
                <ul className="text-white/80 space-y-2 ml-6 list-disc">
                  <li>
                    <strong>{t('accountDataTitle')}:</strong>{' '}
                    {t('accountDataRetention')}
                  </li>
                  <li>
                    <strong>{t('chatDataTitle')}:</strong>{' '}
                    {t('chatDataRetention')}
                  </li>
                  <li>
                    <strong>{t('analyticsDataTitle')}:</strong>{' '}
                    {t('analyticsDataRetention')}
                  </li>
                  <li>
                    <strong>{t('cacheDataTitle')}:</strong>{' '}
                    {t('cacheDataRetention')}
                  </li>
                </ul>
              </section>

              {/* Section 9: Your Rights (LGPD) */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  9. {t('yourRights')} - {t('lgpdRights')}
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  {t('yourRightsIntro')}
                </p>
                <ul className="text-white/80 space-y-3 ml-6 list-disc">
                  <li>
                    <strong>{t('rightAccess')}:</strong> {t('rightAccessDesc')}
                  </li>
                  <li>
                    <strong>{t('rightCorrection')}:</strong>{' '}
                    {t('rightCorrectionDesc')}
                  </li>
                  <li>
                    <strong>{t('rightDeletion')}:</strong>{' '}
                    {t('rightDeletionDesc')}
                  </li>
                  <li>
                    <strong>{t('rightPortability')}:</strong>{' '}
                    {t('rightPortabilityDesc')}
                  </li>
                  <li>
                    <strong>{t('rightWithdrawConsent')}:</strong>{' '}
                    {t('rightWithdrawConsentDesc')}
                  </li>
                  <li>
                    <strong>{t('rightComplaint')}:</strong>{' '}
                    {t('rightComplaintDesc')}
                  </li>
                  <li>
                    <strong>{t('rightInformation')}:</strong>{' '}
                    {t('rightInformationDesc')}
                  </li>
                </ul>
                <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4 mt-6">
                  <p className="text-green-100 font-semibold mb-2">
                    {t('exerciseRightsTitle')}:
                  </p>
                  <p className="text-green-100">{t('exerciseRightsText')}</p>
                </div>
              </section>

              {/* Section 9: Cookies and Tracking */}
              {/* Section 10: Cookies and Tracking */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  10. {t('cookiesTracking')}
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  {t('cookiesTrackingText')}
                </p>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {t('cookieTypesTitle')}
                </h3>
                <ul className="text-white/80 space-y-2 ml-6 list-disc">
                  <li>
                    <strong>{t('essentialCookiesTitle')}:</strong>{' '}
                    {t('essentialCookiesDesc')}
                  </li>
                  <li>
                    <strong>{t('functionalCookiesTitle')}:</strong>{' '}
                    {t('functionalCookiesDesc')}
                  </li>
                  <li>
                    <strong>{t('analyticsCookiesTitle')}:</strong>{' '}
                    {t('analyticsCookiesDesc')}
                  </li>
                </ul>
              </section>

              {/* Section 11: International Transfers */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  11. {t('internationalTransfers')}
                </h2>
                <p className="text-white/80 leading-relaxed">
                  {t('internationalTransfersText')}
                </p>
              </section>

              {/* Section 11: Children's Privacy */}
              {/* Section 12: Children's Privacy */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  12. {t('childrensPrivacy')}
                </h2>
                <p className="text-white/80 leading-relaxed">
                  {t('childrensPrivacyText')}
                </p>
              </section>

              {/* Section 13: Changes to Privacy Policy */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  13. {t('changesPrivacy')}
                </h2>
                <p className="text-white/80 leading-relaxed">
                  {t('changesPrivacyText')}
                </p>
              </section>

              {/* Section 13: Contact Information */}
              {/* Section 14: Contact Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  14. {t('contactInformation')}
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  {t('contactInformationPrivacyText')}
                </p>
                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {t('contactDetails')}:
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-white font-semibold mb-2">
                        {t('generalInquiries')}:
                      </h4>
                      <ul className="text-white/80 space-y-1">
                        <li>{t('ownerName')}: Rodrigo Gomes da Silva</li>
                        <li>{t('emailLabel')}: rodrigo.smscom@gmail.com</li>
                        <li>{t('githubLabel')}: @rodrigogs</li>
                        <li>{t('addressLabel')}: Rio Grande do Sul, Brasil</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">
                        {t('dataProtectionOfficer')}:
                      </h4>
                      <ul className="text-white/80 space-y-1">
                        <li>{t('emailLabel')}: rodrigo.smscom@gmail.com</li>
                        <li>
                          {t('responseTime')}: {t('responseTimeText')}
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/20">
                    <h4 className="text-white font-semibold mb-2">
                      {t('anpdContact')}:
                    </h4>
                    <p className="text-white/80 text-sm">
                      {t('anpdContactText')}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
