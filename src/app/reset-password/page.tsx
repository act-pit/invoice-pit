// src/app/reset-password/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email) {
      setError('メールアドレスを入力してください。');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 パスワードリセット要求:', email);

      // ✅ 修正: 環境に応じたURLを設定
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/update-password`
        : 'https://invoice-pit.com/auth/update-password';

      console.log('📍 Redirect URL:', redirectUrl);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        console.error('❌ リセットエラー:', resetError);
        setError(`エラーが発生しました: ${resetError.message}`);
        setLoading(false);
        return;
      }

      console.log('✅ リセットメール送信成功');
      setSuccess(
        'パスワードリセット用のメールを送信しました。\n\n' +
        `${email} 宛に送信されたメールを開き、リンクをクリックして新しいパスワードを設定してください。\n\n` +
        'メールが届かない場合は、迷惑メールフォルダもご確認ください。'
      );
      setEmail('');
    } catch (err: any) {
      console.error('💥 予期しないエラー:', err);
      setError('予期しないエラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">🔐 パスワードリセット</CardTitle>
          <CardDescription className="text-center">
            登録されているメールアドレスを入力してください
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleResetPassword}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800 whitespace-pre-line">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {!success && (
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            {!success && (
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? '送信中...' : 'リセットリンクを送信'}
              </Button>
            )}

            <div className="text-sm text-center text-gray-600 space-y-2">
              <div>
                <Link href="/organizer/login" className="text-blue-600 hover:underline">
                  主催者ログイン画面に戻る
                </Link>
              </div>
              <div>
                <Link href="/talent/login" className="text-blue-600 hover:underline">
                  タレントログイン画面に戻る
                </Link>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
