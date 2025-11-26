'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function TalentRegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // バリデーション
    if (!fullName || !email || !password) {
      setError('すべての項目を入力してください');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上にしてください');
      setLoading(false);
      return;
    }

    try {
  // 1. Supabase Auth で登録
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?type=talent`,
      data: {
        full_name: fullName,
        user_type: 'talent',
      },
    },
  });

  if (authError) throw authError;

  // ✅✅✅ ここから新しいコード ✅✅✅
  if (!authData.user) {
    throw new Error('ユーザー情報の取得に失敗しました');
  }

  // profiles へのINSERTは削除（Database Triggerで自動作成）

  // subscriptions テーブルにデータを挿入（無料トライアル）
  const { error: subscriptionError } = await supabase.from('subscriptions').insert({
    user_id: authData.user.id,
    plan: 'free',
    status: 'active',
    invoice_count: 0,
  });

  if (subscriptionError) {
    console.error('Subscription error:', subscriptionError);
    // エラーログは出すが、登録自体は成功扱い
  }

  // 成功
  setSuccess(true);
  // ✅✅✅ ここまで新しいコード ✅✅✅

} catch (err: any) {
  console.error('Registration error:', err);
  setError(err.message || '登録に失敗しました');
} finally {
  setLoading(false);
}
  };

  if (success) {
  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl border-2 border-gray-300 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">✉️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            確認メールを送信しました
          </h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            <strong>{email}</strong> に確認メールを送信しました。
            <br />
            <br />
            メール内のリンクをクリックして、登録を完了してください。
            <br />
            <br />
            <span className="text-xs text-gray-500">
              メールが届かない場合は、スパムフォルダもご確認ください。
            </span>
          </p>
          
          {/* ✅ ボタンを2つに変更 */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/talent/login')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              ログイン画面へ
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              トップページに戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl border-2 border-gray-300 p-8">
        <h1 className="text-3xl font-semibold text-blue-600 mb-2 text-center">
          タレント新規登録
        </h1>
        <p className="text-gray-600 mb-6 text-center text-sm">
          請求書ぴっとへようこそ
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              お名前
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="山田 太郎"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="example@email.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード（8文字以上）
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード（確認）
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-base hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '登録中...' : '登録する'}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <div className="text-center">
            <a 
              href="/talent/login" 
              className="text-sm text-gray-600 hover:text-blue-600 transition"
            >
              既にアカウントをお持ちの方はこちら
            </a>
          </div>
          
          <div className="text-center pt-2 border-t border-gray-200">
            <a 
              href="/organizer/register" 
              className="text-sm text-gray-600 hover:text-green-600 transition"
            >
              主催者の方はこちら
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
