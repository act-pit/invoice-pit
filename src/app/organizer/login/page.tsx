'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Database } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function OrganizerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('=== 主催者ログイン開始 ===');
      console.log('メール:', email);

      // 1. Supabase認証
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('❌ 認証エラー:', authError);
        setError('メールアドレスまたはパスワードが正しくありません');
        setLoading(false);
        return;
      }

      console.log('✅ 認証成功 - ユーザーID:', authData.user.id);

      // 2. メール確認チェック
      if (!authData.user.email_confirmed_at) {
        console.warn('⚠️ メールアドレスが未確認');
        setError(
          `メールアドレスの確認が完了していません。\n\n${email} 宛に送信された確認メールを開き、リンクをクリックしてください。\n\n確認メールが届いていない場合は、迷惑メールフォルダもご確認ください。`
        );
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // 3. organizersテーブルで検証
      const { data: organizerData } = await supabase
        .from('organizers')
        .select('id, name, organizer_code')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (!organizerData) {
        console.warn('⚠️ organizersテーブルにデータなし');
        setError(
          '主催者アカウントが見つかりません。タレントの方はタレントログインをご利用ください。'
        );
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      console.log('✅ 主催者確認成功:', organizerData.name);

      // 4. 主催者ダッシュボードへ
      router.push('/organizer/dashboard');
      router.refresh();
    } catch (err) {
      console.error('❌ ログインエラー:', err);
      setError('ログインに失敗しました');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">主催者ログイン</CardTitle>
          <CardDescription className="text-center">
            主催者アカウントでログインしてください
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="whitespace-pre-line text-sm">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              disabled={loading}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
            <div className="text-sm text-center text-gray-600 space-y-2">
              <div>
                <Link href="/organizer/register" className="text-green-600 hover:underline">
                  主催者新規登録はこちら
                </Link>
              </div>
              <div>
                <Link href="/talent/login" className="text-gray-500 hover:underline">
                  タレントの方はこちら
                </Link>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}