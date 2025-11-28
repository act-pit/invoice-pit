'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SubscriptionSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // 3秒後に自動的にサブスクリプションページにリダイレクト
    const timer = setTimeout(() => {
      router.push('/organizer/subscription')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🎉 アップグレード完了！
        </h1>
        
        <p className="text-gray-600 mb-6">
          ベーシックプランへのアップグレードが完了しました。
          <br />
          ご利用ありがとうございます！
        </p>
        
        <div className="space-y-3">
          <Link
            href="/organizer/subscription"
            className="block w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            サブスクリプション管理に戻る
          </Link>
          
          <Link
            href="/organizer/invoices"
            className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            請求書管理に戻る
          </Link>
        </div>
        
        <p className="text-sm text-gray-500 mt-6">
          3秒後に自動的にリダイレクトされます...
        </p>
      </div>
    </div>
  )
}
