// src/app/talent/subscription/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'

type Subscription = Database['public']['Tables']['subscriptions']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export default function TalentSubscriptionPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/talent/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  async function loadData() {
    try {
      // プロフィールを取得
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // subscriptionデータを取得
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('user_type', 'talent')
        .single()

      if (subError) {
        // subscriptionが存在しない場合は新規作成
        if (subError.code === 'PGRST116') {
          const trialEndDate = new Date()
          trialEndDate.setMonth(trialEndDate.getMonth() + 3)

          const { data: newSub, error: createError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: user!.id,
              user_type: 'talent',
              plan: 'free',
              status: 'trial',
              invoice_count: 0,
              trial_end_date: trialEndDate.toISOString()
            })
            .select()
            .single()

          if (createError) throw createError
          setSubscription(newSub)
        } else {
          throw subError
        }
      } else {
        setSubscription(subData)
      }
    } catch (err) {
      console.error('Data load error:', err)
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 残り日数を計算
  const calculateDaysRemaining = (trialEndDate: string | null): number => {
    if (!trialEndDate) return 0
    const now = new Date()
    const endDate = new Date(trialEndDate)
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  // 残り通数を計算（フリープランは3通まで）
  const calculateInvoicesRemaining = (invoiceCount: number, plan: string): number => {
    if (plan === 'premium') return 999 // プレミアムは無制限
    return Math.max(0, 3 - invoiceCount)
  }

  // プラン名の日本語表示
  const getPlanName = (plan: string): string => {
    switch (plan) {
      case 'free':
        return 'フリープラン'
      case 'premium':
        return 'プレミアムプラン'
      default:
        return plan
    }
  }

  // ステータスの日本語表示
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'trial':
        return 'トライアル中'
      case 'active':
        return '有効'
      case 'canceled':
        return 'キャンセル済み'
      case 'expired':
        return '期限切れ'
      default:
        return status
    }
  }

  const handleUpgrade = async () => {
  setUpgrading(true)
  try {
    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user!.id,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_TALENT_PREMIUM,
        userType: 'talent'
      }),
    })

    const data = await response.json()

    if (data.error) {
      alert('エラーが発生しました: ' + data.error)
      return
    }

    // Stripe決済ページへリダイレクト
    if (data.url) {
      window.location.href = data.url
    }
  } catch (error) {
    console.error('Upgrade error:', error)
    alert('アップグレード処理に失敗しました')
  } finally {
    setUpgrading(false)
  }
}

// キャンセル処理
const handleCancel = async () => {
  if (!confirm('サブスクリプションをキャンセルしますか？\n期間終了時に自動的にキャンセルされます。')) {
    return
  }

  try {
    const response = await fetch('/api/stripe/manage-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user!.id,
        action: 'cancel'
      }),
    })

    const data = await response.json()

    if (data.error) {
      alert('エラーが発生しました: ' + data.error)
      return
    }

    alert(data.message || 'サブスクリプションのキャンセルを受け付けました')
    loadData() // データ再読み込み
  } catch (error) {
    console.error('Cancel error:', error)
    alert('キャンセル処理に失敗しました')
  }
}


  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-cyan-50 to-indigo-100">
        <div className="absolute inset-0 bg-white/30 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          {/* ヘッダー */}
          <header className="bg-white shadow-sm border-b sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4 flex justify-between items-center">
              <h1 className="text-lg sm:text-2xl font-bold text-blue-600">請求書ぴっと - タレント</h1>
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="hidden sm:inline text-sm text-gray-900">
                  {profile?.full_name} 様
                </span>
              </div>
            </div>
          </header>

          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
              <h2 className="text-red-800 font-bold mb-2">エラーが発生しました</h2>
              <p className="text-red-600">{error}</p>
              <Link
                href="/talent/dashboard"
                className="mt-4 inline-block text-blue-600 hover:underline"
              >
                ダッシュボードに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">サブスクリプション情報が見つかりません</p>
      </div>
    )
  }

  const daysRemaining = calculateDaysRemaining(subscription.trial_end_date)
  const invoicesRemaining = calculateInvoicesRemaining(subscription.invoice_count, subscription.plan)
  const isFree = subscription.plan === 'free'
  const isPremium = subscription.plan === 'premium'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-cyan-50 to-indigo-100 relative">
      <div className="absolute inset-0 bg-white/30 backdrop-blur-3xl"></div>
      <div className="relative z-10">
        {/* ヘッダー（dashboard と同じ・青色ベース） */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4 flex justify-between items-center">
            <h1 className="text-lg sm:text-2xl font-bold text-blue-600">請求書ぴっと - タレント</h1>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden sm:inline text-sm text-gray-900">
                {profile?.full_name} 様
              </span>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* パンくずナビ */}
          <div className="mb-8">
            <Link
              href="/talent/dashboard"
              className="text-blue-600 hover:underline mb-4 inline-block"
            >
              ← ダッシュボードに戻る
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">サブスクリプション管理</h1>
          </div>

          {/* 現在のプラン（レスポンシブ対応） */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">現在のプラン</h2>
            
            {/* デスクトップ表示 */}
            <div className="hidden sm:flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{getPlanName(subscription.plan)}</p>
                <p className="text-sm text-gray-600 mt-1">
                  ステータス: <span className="font-medium">{getStatusText(subscription.status)}</span>
                </p>
                {subscription.trial_end_date && (
                  <p className="text-sm text-gray-600">
                    トライアル終了日: {new Date(subscription.trial_end_date).toLocaleDateString('ja-JP')}
                  </p>
                )}
              </div>
              {isFree && (
              <button 
                onClick={handleUpgrade}
                disabled={upgrading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {upgrading ? '処理中...' : 'プレミアムにアップグレード'}
              </button>
              )}
            </div>

            {/* スマホ表示（縦並び） */}
            <div className="sm:hidden space-y-3">
              <p className="text-lg">
                <span className="font-medium text-gray-700">現在のプラン：</span>
                <span className="font-bold text-blue-600">{getPlanName(subscription.plan)}</span>
              </p>
              {subscription.trial_end_date && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">トライアル終了日：</span>
                  {new Date(subscription.trial_end_date).toLocaleDateString('ja-JP')}
                </p>
              )}
              {isFree && (
                <button 
                 onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                 {upgrading ? '処理中...' : 'プレミアムにアップグレード'}
                </button>
              )}
            </div>
          </div>

          {/* 利用状況 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">利用状況</h2>
            
            {isFree && (
              <>
                {/* トライアル期間 */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">トライアル期間</span>
                    <span className="text-sm font-bold text-blue-600">残り {daysRemaining} 日</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((90 - daysRemaining) / 90) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    3ヶ月の無料トライアル期間中です
                  </p>
                </div>

                {/* 請求書送信可能数 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">請求書送信可能数</span>
                    <span className="text-sm font-bold text-blue-600">残り {invoicesRemaining} 通</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((90 - daysRemaining) / 90) * 100)}%` }}
                   ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    フリープランは3通まで送信可能です（使用済み: {subscription.invoice_count}通）
                  </p>
                </div>
              </>
            )}

            {isPremium && (
              <div className="text-center py-8">
                <svg
                  className="w-16 h-16 text-green-500 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xl font-bold text-gray-900 mb-2">プレミアムプラン</p>
                <p className="text-gray-600">請求書の送信数は無制限です</p>
                <p className="text-sm text-gray-500 mt-4">
                  今月の送信数: {subscription.invoice_count}通
                </p>
              </div>
            )}
          </div>

          {/* プラン詳細 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">プラン詳細</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* フリープラン */}
              <div className={`border-2 rounded-lg p-6 ${isFree ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">フリープラン</h3>
                  {isFree && (
                    <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">現在のプラン</span>
                  )}
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-4">¥0</p>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    3ヶ月の無料トライアル
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    請求書3通まで送信可能
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    基本的な請求書管理
                  </li>
                </ul>
                {!isFree && (
                  <button className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                    フリープランに変更
                  </button>
                )}
              </div>

              {/* プレミアムプラン */}
              <div className={`border-2 rounded-lg p-6 ${isPremium ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">プレミアムプラン</h3>
                  {isPremium && (
                    <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">現在のプラン</span>
                  )}
                </div>
                <div className="mb-4">
                  <div className="mb-4">
                  <p className="text-3xl font-bold text-gray-900">
                    ¥1,980
                    <span className="text-lg font-bold text-blue-600"> / 年 </span>
                 </p>
                 <p className="text-sm text-gray-600">（月額 ¥165相当）</p>
                </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    請求書送信数無制限
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    優先サポート
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    高度な分析機能
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    カスタムテンプレート
                  </li>
                </ul>
                {!isPremium && (
                  <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    プレミアムにアップグレード
                  </button>
                )}
                {isPremium && (
                  <button 
                    onClick={handleCancel}
                    className="w-full border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition"
                  >
                    サブスクリプションをキャンセル
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}