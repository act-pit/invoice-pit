'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [countdown, setCountdown] = useState(5);

    useEffect(() => {
    // 認証状態のロード中は何もしない
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user, authLoading, router]);


  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <svg
            className="w-20 h-20 text-green-500 mx-auto"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          お支払いが完了しました！
        </h1>

        <p className="text-gray-600 mb-6">
          有料プランへのアップグレードが完了しました。
          <br />
          これで請求書を無制限に作成できます。
        </p>

        {sessionId && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">
              セッションID: <span className="font-mono text-xs">{sessionId}</span>
            </p>
          </div>
        )}

        <div className="mb-6">
          <p className="text-sm text-gray-500">
            {countdown}秒後にダッシュボードに移動します...
          </p>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          今すぐダッシュボードに移動
        </button>
      </div>
    </div>
  );
}