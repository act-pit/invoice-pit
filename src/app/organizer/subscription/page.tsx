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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [priceAnimating, setPriceAnimating] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setPriceAnimating(true)
    const timer = setTimeout(() => setPriceAnimating(false), 300)
    return () => clearTimeout(timer)
  }, [billingCycle])

  async function loadData() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('認証エラー')

      const { data: organizerData, error: organizerError } = await supabase
        .from('organizers')
        .select('*')
        .eq('id', user.id)
        .single()

      if (organizerError) throw organizerError
      setOrganizer(organizerData)

      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('user_type', 'organizer')
        .maybeSingle()

      if (subError) throw subError

      if (!subData) {
        console.log('⚠️ サブスクリプションレコードが存在しません。作成します。')
        const { data: newSubData, error: createError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            user_type: 'organizer',
            plan: 'free',
            billing_cycle: 'monthly',
            status: 'active',
            invoice_count: 0,
            job_post_count: 0,
            job_post_limit: 0,
          })
          .select()
          .single()

        if (createError) {
          console.error('❌ サブスクリプション作成エラー:', createError)
          throw new Error('初期データの作成に失敗しました')
        }

        console.log('✅ サブスクリプションレコード作成成功:', newSubData)
        setSubscription(newSubData)
      } else {
        setSubscription(subData)
      }

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

  async function handleUpgradeToBasic() {
    setIsUpgrading(true)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        alert('認証エラーが発生しました')
        setIsUpgrading(false)
        return
      }

      const priceId = billingCycle === 'monthly'
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ORGANIZER_BASIC_MONTHLY
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_ORGANIZER_BASIC_YEARLY;

      console.log('🔍 選択された課金サイクル:', billingCycle)
      console.log('🔍 使用するPrice ID:', priceId)

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          priceId: priceId,
          userType: 'organizer',
          planType: 'basic',
          billingCycle: billingCycle,
          couponCode: couponCode.trim() || undefined,
        }),
      });

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert('決済画面の作成に失敗しました')
        setIsUpgrading(false)
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('アップグレード処理中にエラーが発生しました')
      setIsUpgrading(false)
    }
  }

  async function handleDowngradeToFree() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        alert('認証エラーが発生しました')
        return
      }

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
        loadData()
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
        <header className="bg-white shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4 flex justify-between items-center">
            <h1 className="text-lg sm:text-2xl font-bold text-green-600">請求書ぴっと - 主催者</h1>
            <span className="text-sm text-gray-900">
              {organizer?.name || organizer?.company_name} 様
            </span>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link href="/organizer/dashboard" className="text-green-600 hover:underline mb-4 inline-block">
              ← ダッシュボードに戻る
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">サブスクリプション管理</h1>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">現在のプラン</h2>
            
            <div className="hidden sm:flex items-center justify-between">
              <div>
  <p className="text-2xl font-bold text-green-600">
    {subscription.plan === 'free' && 'フリープラン'}
    {subscription.plan === 'basic' && 'ベーシックプラン'}
    {subscription.plan === 'advance' && 'アドバンスプラン'}
    {subscription.plan === 'pro' && 'プロプラン'}
  </p>
  <div className="mt-2 space-y-1 text-sm text-gray-600">
    <p>
      ステータス: <span className="font-medium">
        {subscription.status === 'active' ? '有効' : subscription.status}
      </span>
    </p>
    <p>
      課金サイクル: <span className="font-medium">
        {subscription.billing_cycle === 'monthly' ? '月額' : '年額'}
      </span>
    </p>
    {subscription.start_date && (
      <p>
        契約開始日: <span className="font-medium">
          {new Date(subscription.start_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </p>
    )}
    {subscription.next_billing_date && subscription.plan !== 'free' && (
      <p>
        次回更新日: <span className="font-medium text-green-600">
          {new Date(subscription.next_billing_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </p>
    )}
    {subscription.end_date && (
      <p>
        契約終了日: <span className="font-medium text-red-600">
          {new Date(subscription.end_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </p>
    )}
  </div>
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
  <div className="text-sm text-gray-600 space-y-1">
    <p>
      ステータス: <span className="font-medium">
        {subscription.status === 'active' ? '有効' : subscription.status}
      </span>
    </p>
    <p>
      課金サイクル: <span className="font-medium">
        {subscription.billing_cycle === 'monthly' ? '月額' : '年額'}
      </span>
    </p>
    {subscription.start_date && (
      <p>
        契約開始日: <span className="font-medium">
          {new Date(subscription.start_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </p>
    )}
    {subscription.next_billing_date && subscription.plan !== 'free' && (
      <p>
        次回更新日: <span className="font-medium text-green-600">
          {new Date(subscription.next_billing_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </p>
    )}
    {subscription.end_date && (
      <p>
        契約終了日: <span className="font-medium text-red-600">
          {new Date(subscription.end_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </p>
    )}
  </div>
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

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">利用状況</h2>
            
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

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">プラン一覧</h2>
            
            {subscription.plan === 'free' && (
              <div className="flex justify-center mb-6">
                <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-white shadow-sm">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition ${
                      billingCycle === 'monthly'
                        ? 'bg-green-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    月額プラン
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition ${
                      billingCycle === 'yearly'
                        ? 'bg-green-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    年額プラン
                    <p><span className="ml-2 text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded">
                    約17%お得
                    </span></p>
                  </button>
                </div>
              </div>
            )}

            {subscription.plan === 'free' && (
              <div className="flex justify-center mb-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-md w-full">
                  <label className="block text-sm font-medium text-purple-900 mb-2">
                    🎟️ クーポンコード（任意）
                  </label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase())
                      setCouponError('')
                      setCouponSuccess('')
                    }}
                    className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {couponError && (
                    <p className="text-red-600 text-xs mt-2">⚠️ {couponError}</p>
                  )}
                  {couponSuccess && (
                    <p className="text-green-600 text-xs mt-2">✅ {couponSuccess}</p>
                  )}


                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-green-500 transition-colors">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">フリー</h3>
                  <div className={`transition-all duration-300 ${priceAnimating ? 'scale-110 text-green-600' : ''}`}>
                    <div className="text-3xl font-bold text-gray-900">¥0</div>
                    <div className="text-sm text-gray-600">/月</div>
                  </div>
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
                    onClick={() => setShowDowngradeModal(true)}
                    className="w-full py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium text-sm"
                  >
                    このプランに変更
                  </button>
                )}
              </div>

              <div className="border-2 border-green-500 rounded-lg p-6 relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    おすすめ
                  </span>
                </div>
                
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">ベーシック</h3>
                  <div className={`transition-all duration-300 ${priceAnimating ? 'scale-110 text-green-600' : ''}`}>
                    {billingCycle === 'monthly' ? (
                      <>
                        <div className="text-3xl font-bold text-green-600">¥980</div>
                        <div className="text-sm text-gray-600">/月</div>
                      </>
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-green-600">¥9,800</div>
                        <div className="text-sm text-gray-600">/年</div>
                        <div className="text-xs text-green-600 mt-1 font-medium">
                          月額換算: ¥817/月
                        </div>
                      </>
                    )}
                  </div>
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

              <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-green-500 transition-colors opacity-75">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">アドバンス</h3>
                  <div className={`transition-all duration-300 ${priceAnimating ? 'scale-110 text-green-600' : ''}`}>
                    {billingCycle === 'monthly' ? (
                      <>
                        <div className="text-3xl font-bold text-gray-900">¥1,980</div>
                        <div className="text-sm text-gray-600">/月</div>
                      </>
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-gray-900">¥19,800</div>
                        <div className="text-sm text-gray-600">/年</div>
                        <div className="text-xs text-green-600 mt-1 font-medium">
                          月額換算: ¥1,650/月
                        </div>
                      </>
                    )}
                  </div>
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

              <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-green-500 transition-colors opacity-75">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">プロ</h3>
                  <div className={`transition-all duration-300 ${priceAnimating ? 'scale-110 text-green-600' : ''}`}>
                    {billingCycle === 'monthly' ? (
                      <>
                        <div className="text-3xl font-bold text-gray-900">¥2,980</div>
                        <div className="text-sm text-gray-600">/月</div>
                      </>
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-gray-900">¥29,800</div>
                        <div className="text-sm text-gray-600">/年</div>
                        <div className="text-xs text-green-600 mt-1 font-medium">
                          月額換算: ¥2,483/月
                        </div>
                      </>
                    )}
                  </div>
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

            <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
             <h3 className="text-lg font-bold text-purple-900 mb-2">🎉 ACTぴっと連動特典</h3>
             <p className="text-purple-700">
               ACTぴっと登録事業者様は、全プラン
                <span className="font-bold text-xl text-purple-900"> 30%OFF</span> でご利用いただけます！
             </p>
             <p className="text-sm text-purple-600 mt-2">
               ※   ACTぴっと経由でお申し込みの方には、専用クーポンコードをお送りしております
             </p>
            </div>
          </div>
        </div>
      </div>

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
