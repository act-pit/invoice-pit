'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AuthConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // URLからトークンを取得
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (!accessToken) {
          throw new Error('認証トークンが見つかりません');
        }

        // セッションを設定
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (error) throw error;

        setStatus('success');
        setMessage('メール認証が完了しました！');

        // 2秒後にダッシュボードへリダイレクト
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } catch (err: any) {
        console.error('認証エラー:', err);
        setStatus('error');
        setMessage(err.message || '認証に失敗しました');
      }
    };

    confirmEmail();
  }, [supabase, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">メール認証を確認しています...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-red-600">
              ❌ エラー
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-700">{message}</p>
            <Button onClick={() => router.push('/login')}>
              ログインページに戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-green-600">
            ✅ 認証完了
          </CardTitle>
          <CardDescription className="text-center">
            メール認証が完了しました
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-700 mb-4">{message}</p>
          <p className="text-sm text-gray-500">
            ダッシュボードにリダイレクトしています...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
