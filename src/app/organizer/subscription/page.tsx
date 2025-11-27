'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Subscription = Database['public']['Tables']['subscriptions']['Row']
type Organizer = Database['public']['Tables']['organizers']['Row']

export default function OrganizerSubscriptionPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [organizer, setOrganizer] = useState<Organizer | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [invoiceCount, setInvoiceCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDowngradeModal, setShowDowngradeModal] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)


  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('認証エラー')

      // 主催者情報を取得
      const { data: organizerData, error: organizerError } = await supabase
        .from('organizers')
        .select('*')
        .eq('id', user.id)
        .single()

      if (organizerError) throw organizerError
      setOrganizer(organizerData)

      // サブスクリプション情報を取得
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('user_type', 'organizer')
        .single()

      if (subError) throw subError
      setSubscription(subData)

      // 請求書受信数を取得
      const { count, error: countError } = await supabase
        .from('organizer_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('organizer_id', user.id)

      if (countError) throw countError
      setInvoiceCount(count || 0)

    } catch (err) {
      console.error('Data load error:', err)
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // ベーシックプランへのアップグレード
  async function handleUpgradeToBasic() {
    setIsUpgrading(true) // ← ローディング開始
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        alert('認証エラーが発生しました')
        setIsUpgrading(false) // ← ローディング終了
        return
      }

      // Stripe Checkoutセッションを作成
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userType: 'organizer',
          priceId: 'price_1STKwwHmYzKNJc4nn04Du9q6', // 主催者ベーシックプランのID
          successUrl: `${window.location.origin}/organizer/subscription?upgraded=true`,
          cancelUrl: `${window.location.origin}/organizer/subscription/cancelled`,
        }),
      })

      const data = await response.json()

      if (data.url) {
        // Stripe決済画面に遷移（ローディングは遷移まで継続）
        window.location.href = data.url
      } else {
        alert('決済画面の作成に失敗しました')
        setIsUpgrading(false) // ← ローディング終了
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('アップグレード処理中にエラーが発生しました')
      setIsUpgrading(false) // ← ローディング終了
    }
  }


  // フリープランへのダウングレード
  async function handleDowngradeToFree() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        alert('認証エラーが発生しました')
        return
      }

      // Stripeサブスクリプションをキャンセル
      const response = await fetch('/api/stripe/manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'cancel',
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('ダウングレードが完了しました。次回の請求期間終了時にフリープランに変更されます。')
        setShowDowngradeModal(false)
        loadData() // データを再読み込み
      } else {
        alert('ダウングレードに失敗しました: ' + (data.error || '不明なエラー'))
      }
    } catch (error) {
      console.error('Downgrade error:', error)
      alert('ダウングレード処理中にエラーが発生しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
        <div className="absolute inset-0 bg-white/30 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <header className="bg-white shadow-sm border-b sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4">
              <h1 className="text-lg sm:text-2xl font-bold text-green-600">請求書ぴっと - 主催者</h1>
            </div>
          </header>
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
              <h2 className="text-red-800 font-bold mb-2">エラーが発生しました</h2>
              <p className="text-red-600">{error || 'サブスクリプション情報が見つかりません'}</p>
              <Link href="/organizer/dashboard" className="mt-4 inline-block text-green-600 hover:underline">
                ダッシュボードに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 relative">
      <div className="absolute inset-0 bg-white/30 backdrop-blur-3xl"></div>
      <div className="relative z-10">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4 flex justify-between items-center">
            <h1 className="text-lg sm:text-2xl font-bold text-green-600">請求書ぴっと - 主催者</h1>
            <span className="text-sm text-gray-900">
              {organizer?.name || organizer?.company_name} 様
            </span>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* パンくずナビ */}
          <div className="mb-8">
            <Link href="/organizer/dashboard" className="text-green-600 hover:underline mb-4 inline-block">
              ← ダッシュボードに戻る
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">サブスクリプション管理</h1>
          </div>

          {/* 現在のプラン */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">現在のプラン</h2>
            
            {/* デスクトップ表示 */}
            <div className="hidden sm:flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {subscription.plan === 'free' && 'フリープラン'}
                  {subscription.plan === 'basic' && 'ベーシックプラン'}
                  {subscription.plan === 'advance' && 'アドバンスプラン'}
                  {subscription.plan === 'pro' && 'プロプラン'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  ステータス: <span className="font-medium">
                    {subscription.status === 'active' ? '有効' : subscription.status}
                  </span>
                </p>
              </div>
              {subscription.plan === 'free' && (
                <button 
                  onClick={handleUpgradeToBasic}
                  disabled={isUpgrading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpgrading ? '処理中...' : 'ベーシックにアップグレード'}
                </button>
              )}

              {subscription.plan === 'basic' && (
                <button 
                  onClick={() => setShowDowngradeModal(true)}
                  className="border border-red-300 text-red-600 px-6 py-2 rounded-lg hover:bg-red-50 transition"
                >
                  フリープランに戻す
                </button>
              )}
            </div>

            {/* スマホ表示 */}
            <div className="sm:hidden space-y-3">
              <p className="text-lg">
                <span className="font-medium text-gray-700">現在のプラン：</span>
                <span className="font-bold text-green-600">
                  {subscription.plan === 'free' && 'フリープラン'}
                  {subscription.plan === 'basic' && 'ベーシックプラン'}
                  {subscription.plan === 'advance' && 'アドバンスプラン'}
                  {subscription.plan === 'pro' && 'プロプラン'}
                </span>
              </p>
              {subscription.plan === 'free' && (
                <button 
                  onClick={handleUpgradeToBasic}
                  disabled={isUpgrading}
                  className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpgrading ? '処理中...' : 'ベーシックにアップグレード'}
                </button>
              )}

              {subscription.plan === 'basic' && (
                <button 
                  onClick={() => setShowDowngradeModal(true)}
                  className="w-full border border-red-300 text-red-600 px-6 py-2 rounded-lg hover:bg-red-50 transition"
                >
                  フリープランに戻す
                </button>
              )}
            </div>
          </div>

          {/* 利用状況 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">利用状況</h2>
            
            {/* 請求書受信実績 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📬</span>
                  <span className="text-sm font-medium text-gray-700">請求書受信実績</span>
                </div>
                <span className="text-lg font-bold text-green-600">{invoiceCount}件</span>
              </div>
              <p className="text-xs text-gray-500 ml-8">
                ※ 受信数に制限はありません
              </p>
            </div>

            {/* 案件投稿 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📢</span>
                  <span className="text-sm font-medium text-gray-700">案件投稿</span>
                </div>
                <span className="text-sm text-gray-600">
                  {subscription.job_post_count || 0}件 / {subscription.job_post_limit || 0}件
                </span>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 ml-8">
                <p className="text-sm font-medium text-yellow-800 mb-1">🚧 COMING SOON</p>
                <p className="text-xs text-yellow-700">案件投稿機能は近日公開予定です</p>
              </div>
            </div>
          </div>

          {/* プラン一覧カード */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">プラン一覧</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* フリープラン */}
              <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-green-500 transition-colors">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">フリー</h3>
                  <div className="text-3xl font-bold text-gray-900">¥0</div>
                  <div className="text-sm text-gray-600">/月</div>
                </div>
                
                <ul className="space-y-2 mb-6 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>請求書受領・承認</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>基本管理機能</span>
                  </li>
                </ul>
                
                {subscription?.plan === 'free' ? (
                  <div className="text-center py-2 bg-gray-100 text-gray-600 rounded font-medium text-sm">
                    現在のプラン
                  </div>
                ) : (
                  <button
                    onClick={() => alert('フリープランへのダウングレードは準備中です')}
                    className="w-full py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium text-sm"
                  >
                    このプランに変更
                  </button>
                )}
              </div>

              {/* ベーシックプラン */}
              <div className="border-2 border-green-500 rounded-lg p-6 relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    おすすめ
                  </span>
                </div>
                
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">ベーシック</h3>
                  <div className="text-3xl font-bold text-green-600">¥980</div>
                  <div className="text-sm text-gray-600">/月</div>
                </div>
                
                <ul className="space-y-2 mb-6 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>支払期日アラート表示</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>差し戻し機能</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>承認待ち一覧表示</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>CSV出力</span>
                  </li>
                </ul>
                
                {subscription?.plan === 'basic' ? (
                  <div className="text-center py-2 bg-green-100 text-green-700 rounded font-medium text-sm">
                    現在のプラン
                  </div>
                ) : subscription?.plan === 'free' ? (
                  <button
                    onClick={handleUpgradeToBasic}
                    disabled={isUpgrading}
                    className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpgrading ? '処理中...' : 'アップグレード'}
                  </button>

                ) : (
                  <button
                    onClick={() => alert('ダウングレード機能は準備中です')}
                    className="w-full py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium text-sm"
                  >
                    このプランに変更
                  </button>
                )}
              </div>

              {/* アドバンスプラン */}
              <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-green-500 transition-colors opacity-75">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">アドバンス</h3>
                  <div className="text-3xl font-bold text-gray-900">¥1,980</div>
                  <div className="text-sm text-gray-600">/月</div>
                </div>
                
                <ul className="space-y-2 mb-6 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>ベーシック機能すべて</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>CSVカスタム・会計フォーマット</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>月次支払いレポート（手動）</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>案件・AD情報掲載 1件/月</span>
                  </li>
                </ul>
                
                <button
                  onClick={() => alert('アドバンスプランは現在準備中です')}
                  className="w-full py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed font-medium text-sm"
                  disabled
                >
                  準備中
                </button>
              </div>

              {/* プロプラン */}
              <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-green-500 transition-colors opacity-75">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">プロ</h3>
                  <div className="text-3xl font-bold text-gray-900">¥2,980</div>
                  <div className="text-sm text-gray-600">/月</div>
                </div>
                
                <ul className="space-y-2 mb-6 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>アドバンス機能すべて</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>全銀協・API連携</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>月次支払い自動レポート</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>案件・AD情報掲載 2件/月</span>
                  </li>
                </ul>
                
                <button
                  onClick={() => alert('プロプランは現在準備中です')}
                  className="w-full py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed font-medium text-sm"
                  disabled
                >
                  準備中
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ダウングレード警告モーダル */}
      {showDowngradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              ⚠️ フリープランへのダウングレード
            </h3>
            
            <div className="mb-6 space-y-3 text-sm text-gray-700">
              <p className="font-medium text-red-600">
                以下の機能が利用できなくなります：
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>支払期日アラート表示</li>
                <li>差し戻し機能</li>
                <li>承認待ち一覧表示</li>
                <li>CSV出力</li>
              </ul>
              
              <p className="mt-4 text-gray-600">
                ダウングレードは<span className="font-bold text-gray-900">次回の請求期間終了時</span>に適用されます。
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDowngradeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={handleDowngradeToFree}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                ダウングレードする
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
