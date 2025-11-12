'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { getTrialDaysRemaining, formatSubscriptionStatus, FREE_TIER_LIMITS } from '@/lib/subscription-utils';

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    // 認証状態のロード中は何もしない
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    fetchProfile();
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('プロフィールの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      alert('エラーが発生しました: ' + error.message);
      setCheckoutLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">プロフィールが見つかりません</p>
      </div>
    );
  }

  const trialDaysRemaining = getTrialDaysRemaining(profile.trial_end_date);
  const invoicesRemaining = FREE_TIER_LIMITS.MAX_INVOICES - profile.invoice_count;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← ダッシュボードに戻る
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">サブスクリプション管理</h1>

          {/* Current Status */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">現在のステータス</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">プラン:</span>
                <span className="font-semibold text-gray-900">
                  {formatSubscriptionStatus(profile.subscription_status)}
                </span>
              </div>
              
              {profile.subscription_status === 'trial' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-700">トライアル残り日数:</span>
                    <span className="font-semibold text-gray-900">
                      {trialDaysRemaining !== null ? `${trialDaysRemaining}日` : '期限切れ'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">作成可能な請求書:</span>
                    <span className="font-semibold text-gray-900">
                      残り{invoicesRemaining}件 / {FREE_TIER_LIMITS.MAX_INVOICES}件
                    </span>
                  </div>
                </>
              )}

              {profile.subscription_status === 'active' && (
                <div className="flex justify-between">
                  <span className="text-gray-700">プラン開始日:</span>
                  <span className="font-semibold text-gray-900">
                    {profile.subscription_start_date
                      ? new Date(profile.subscription_start_date).toLocaleDateString('ja-JP')
                      : '-'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Card */}
          {profile.subscription_status !== 'active' && (
            <div className="border-2 border-blue-600 rounded-lg p-8 mb-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">年間プラン</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-blue-600">¥980</span>
                  <span className="text-gray-600 text-xl">/年</span>
                </div>
                <p className="text-gray-600 mb-6">約82円/月。請求書を無制限に作成・管理ができます。</p>

                <button
                  onClick={handleSubscribe}
                  disabled={checkoutLoading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                >
                  {checkoutLoading ? '処理中...' : '有料プランに申し込む'}
                </button>
              </div>

              <div className="mt-8 space-y-3">
                <h4 className="font-semibold text-gray-900 mb-3">プランに含まれる機能:</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">請求書の無制限作成</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">PDF印刷・保存機能</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">主催者への直接送信</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">請求書の編集・管理</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">口座情報・プロフィール管理</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {profile.subscription_status === 'active' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">有料プラン登録済み</h3>
              <p className="text-gray-700">すべての機能をご利用いただけます</p>
            </div>
          )}

          {/* Free Tier Info */}
          {profile.subscription_status === 'trial' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">無料トライアルについて</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• 登録から3ヶ月間、または3件まで無料でご利用いただけます</li>
                <li>• いずれかの条件を満たすと有料プランへのアップグレードが必要です</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
