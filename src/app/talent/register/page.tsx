'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function TalentRegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [success, setSuccess] = useState('');  // string型
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorType('');
    setLoading(true);

    // バリデーション
    if (!fullName || !email || !password || !confirmPassword) {
      setError('全ての項目を入力してください。');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上である必要があります。');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      setLoading(false);
      return;
    }

    try {
      // 1. メールアドレスの重複チェック（profilesテーブル）
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single();

      if (existingProfile) {
        setError('このメールアドレスは既にタレントとして登録されています。');
        setErrorType('already_cast');
        setLoading(false);
        return;
      }

      // 2. メールアドレスの重複チェック（organizersテーブル）
      const { data: existingOrganizer } = await supabase
        .from('organizers')
        .select('email')
        .eq('email', email)
        .single();

      if (existingOrganizer) {
        setError('このメールアドレスは既に主催者として登録されています。');
        setErrorType('already_organizer');
        setLoading(false);
        return;
      }

      console.log('=== タレント登録開始 ===');
      console.log('メール:', email);
      console.log('氏名:', fullName);

      // 3. Supabase Authにユーザーを登録
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            role: 'talent',
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        console.error('サインアップエラー:', signUpError);
        setError(`登録に失敗しました: ${signUpError.message}`);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('ユーザー情報の取得に失敗しました。');
        setLoading(false);
        return;
      }

      console.log('=== Auth登録成功 ===');
      console.log('ユーザーID:', data.user.id);
      console.log('※ トリガーにより自動的にprofilesテーブルに挿入されます');

      // 4. 成功（トリガーが自動的にprofilesに挿入）
      setSuccess('登録が完了しました！\nメールアドレス宛に確認メールを送信しました。\nメール内のリンクをクリックして、メールアドレスを確認してください。');
      setLoading(false);

      // 7秒後にログインページへリダイレクト
      setTimeout(() => {
        router.push('/talent/login');
      }, 7000);
    } catch (err) {
      console.error('予期しないエラー:', err);
      setError('予期しないエラーが発生しました。もう一度お試しください。');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">新規登録</CardTitle>
          <CardDescription className="text-center">
            請求書の作成・管理を始めましょう
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {/* エラーメッセージ - 主催者として登録済み */}
            {error && errorType === 'already_organizer' && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-bold">このメールアドレスは既に使用されています</AlertTitle>
                <AlertDescription>
                  <p className="mb-3">
                    このメールアドレスは既に<strong>主催者</strong>として登録されています。
                  </p>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200 space-y-3">
                    <p className="text-sm font-semibold text-red-900">
                      次のいずれかをお試しください:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <span className="text-red-600 mt-0.5">1.</span>
                        <p className="text-sm text-red-900">
                          <strong>別のメールアドレス</strong>でタレント登録を行う
                        </p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-red-600 mt-0.5">2.</span>
                        <p className="text-sm text-red-900">
                          既に主催者アカウントをお持ちの場合は
                          <Link 
                            href="/organizer/login" 
                            className="text-blue-600 hover:underline font-medium mx-1"
                          >
                            主催者としてログイン
                          </Link>
                          してください
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-xs text-red-800">
                        💡 ヒント: 1つのメールアドレスで、タレントと主催者の両方のアカウントを持つことはできません。
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* エラーメッセージ - タレントとして登録済み */}
            {error && errorType === 'already_cast' && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-bold">このメールアドレスは既に登録されています</AlertTitle>
                <AlertDescription>
                  <p className="mb-3">
                    このメールアドレスは既に<strong>タレント</strong>として登録されています。
                  </p>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-sm font-semibold text-red-900 mb-2">
                      既にアカウントをお持ちの場合:
                    </p>
                    <Link href="/talent/login">
                      <Button variant="outline" className="w-full">
                        タレントとしてログイン
                      </Button>
                    </Link>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* エラーメッセージ - その他 */}
            {error && !errorType && (
              <Alert variant="destructive">
                <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
              </Alert>
            )}

            {/* 成功メッセージ */}
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800 whitespace-pre-line">{success}</AlertDescription>
              </Alert>
            )}

            {/* 入力フィールド */}
            <div className="space-y-2">
              <Label htmlFor="fullName">お名前</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="山田 太郎"
                value={fullName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                required
                disabled={loading || success !== ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                disabled={loading || success !== ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード（8文字以上）</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                disabled={loading || success !== ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || success !== ''}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" 
              disabled={loading || success !== ''}
            >
              {loading ? '登録中...' : success ? '登録完了' : '登録する'}
            </Button>
            <div className="text-sm text-center text-gray-600 space-y-2">
              <div>
                <Link href="/talent/login" className="text-purple-600 hover:underline">
                  既にアカウントをお持ちの方はこちら
                </Link>
              </div>
              <div>
                <Link href="/organizer" className="text-gray-500 hover:underline">
                  主催者の方はこちら
                </Link>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
