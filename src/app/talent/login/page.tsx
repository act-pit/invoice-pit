'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function TalentLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== ログイン処理開始 ===');
    console.log('Email:', email);
    console.log('Password length:', password.length);
    
    setError('');
    setLoading(true);

    try {
      console.log('Supabaseログイン試行中...');
      // Supabaseでログイン

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        // メール確認済みかチェック
        if (!data.user.email_confirmed_at) {
          setError('メールアドレスの確認が完了していません。メールを確認してください。');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

                // profilesテーブルでタレントか確認
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        console.log('Profile check:', { profile, profileError }); // デバッグ用

        if (profileError) {
          console.error('Profile error:', profileError);
        }

        if (profile) {
          // タレントとして確認できた
          console.log('Profile found, redirecting...');
          router.push('/talent/dashboard');
          return;
        }

        // タレントではない
        console.log('Profile not found');
        setError('タレントアカウントが見つかりません。');
        await supabase.auth.signOut();

      }
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error details:', JSON.stringify(err, null, 2)); 
      setError(err.message || 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl border-2 border-gray-300 p-8">
        <h1 className="text-3xl font-semibold text-blue-600 mb-2 text-center">
          タレントログイン
        </h1>
        <p className="text-gray-600 mb-6 text-center text-sm">
          請求書ぴっとへおかえりなさい
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-base hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <div className="text-center">
            <a 
              href="/talent/register" 
              className="text-sm text-gray-600 hover:text-blue-600 transition"
            >
              アカウントをお持ちでない方はこちら
            </a>
          </div>
          
          <div className="text-center pt-2 border-t border-gray-200">
            <a 
              href="/organizer/login" 
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
