import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function BackToHome() {
  const t = useTranslations('Legal')

  return (
    <div className="mb-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToHome')}
      </Link>
    </div>
  )
}
