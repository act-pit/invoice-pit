'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = searchParams.get('plan') || 'basic'
  const billingCycle = searchParams.get('billing_cycle') || 'monthly'

  const planNames: { [key: string]: string } = {
    free: 'フリープラン',
    basic: 'ベーシックプラン',
    advance: 'アドバンスプラン',
    pro: 'プロプラン',
  }

  const billingCycleNames = {
    monthly: '月額',
    yearly: '年額',
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/organizer/subscription')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            アップグレード完了！
          </h1>
          <p className="text-gray-600">
            {planNames[plan] || 'ベーシックプラン'}（{billingCycleNames[billingCycle as keyof typeof billingCycleNames]}）へのアップグレードが完了しました！
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            ✨ すべての機能がご利用いただけます
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/organizer/subscription"
            className="block w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            サブスクリプション管理へ
          </Link>
          <Link
            href="/organizer/invoices"
            className="block w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            請求書管理へ
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          5秒後に自動的にリダイレクトします...
        </p>
      </div>
    </div>
  )
}

export default function OrganizerSubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
