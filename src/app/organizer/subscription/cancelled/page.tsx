'use client'

import Link from 'next/link'

export default function SubscriptionCancelledPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 relative">
      <div className="absolute inset-0 bg-white/30 backdrop-blur-3xl"></div>
      <div className="relative z-10">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4">
            <h1 className="text-lg sm:text-2xl font-bold text-green-600">請求書ぴっと - 主催者</h1>
          </div>
        </header>

        {/* メインコンテンツ */}
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                アップグレードがキャンセルされました
              </h2>
              <p className="text-gray-600 text-sm">
                決済処理がキャンセルされました。<br />
                プランは変更されていません。
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/organizer/subscription"
                className="block w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition font-medium"
              >
                サブスクリプション管理に戻る
              </Link>
              <Link
                href="/organizer/dashboard"
                className="block w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                ダッシュボードに戻る
              </Link>
            </div>

            <p className="mt-6 text-xs text-gray-500">
              ご不明な点がございましたら、サポートまでお問い合わせください。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
