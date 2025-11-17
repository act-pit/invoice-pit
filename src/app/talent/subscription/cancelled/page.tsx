'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function SubscriptionCancelledPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // 認証状態のロード中は何もしない
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <svg
            className="w-20 h-20 text-yellow-500 mx-auto"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          お支払いがキャンセルされました
        </h1>

        <p className="text-gray-600 mb-8">
          お支払いプロセスがキャンセルされました。
          <br />
          再度お試しいただくか、後ほどご利用ください。
        </p>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/subscription')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            サブスクリプションページに戻る
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
