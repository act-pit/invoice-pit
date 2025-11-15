// src/app/organizer/register/page.tsx
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

// 主催者コードを生成する関数 (シンプルなランダム生成)
// NOTE: DB側でのユニーク制約と合わせて使用します。
const generateOrganizerCode = (length = 6) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

export default function OrganizerRegisterPage() {
  const router = useRouter();
  
  // -- フォームステート --
  const [organizerName, setOrganizerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // -- UI/ロードステート --
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClientComponentClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorType('');
    setLoading(true);

    // バリデーション
    if (!organizerName || !email || !password || !confirmPassword) {
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
    
    // NOTE: タレント/主催者の重複チェックは省略（トリガー修正後の段階で不要になるため）

    try {
      // 1. Supabase Authにユーザーを登録
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            role: 'organizer', // ロールを主催者として設定
            organizer_name: organizerName,
          },
        },
      });

      if (signUpError) {
        console.error('サインアップエラー:', signUpError);
        setError(`登録に失敗しました: ${signUpError.message}`);
        setLoading(false);
        return;
      }
      
      const userId = authData.user?.id;
      if (!userId) {
        setError('ユーザー情報の取得に失敗しました。');
        setLoading(false);
        return;
      }
      
      // 2. 主催者コードを生成し、organizersテーブルに明示的に挿入
      const newOrganizerCode = generateOrganizerCode();
      const { error: orgInsertError } = await supabase
        .from('organizers')
        .insert({
          id: userId!, // AuthのIDをそのまま使用
          organizer_code: newOrganizerCode,
          organizer_name: organizerName,
          email: email,
          created_by: userId!,
        })
        .select();

      if (orgInsertError) {
        console.error('主催者情報挿入エラー:', orgInsertError.message, orgInsertError.code);
        // Auth登録は成功しているがDB登録に失敗している状態。
          setError(\主催者情報の登録に失敗しました (DBコード: ${orgInsertError.code
          setLoading(false);
        return;
      }
      
      // 3. 成功
      setSuccess(`登録が完了しました！\nメールアドレス宛に確認メールを送信しました。\nメール内のリンクをクリックして、メールアドレスを確認してください。\n\n💡 主催者コード: ${newOrganizerCode}`);
      setLoading(false);

      // 7秒後にログインページへリダイレクト
      setTimeout(() => {
        router.push('/organizer/login');
      }, 7000);
    } catch (err) {
      console.error('予期しないエラー:', err);
      setError('予期しないエラーが発生しました。もう一度お試しください。');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">🎪 主催者 新規登録</CardTitle>
          <CardDescription className="text-center">
            キャストからの請求書を受領・管理しましょう
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
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
              <Label htmlFor="organizerName">団体名・事務所名</Label>
              <Input
                id="organizerName"
                type="text"
                placeholder="夢舞台劇団 / 〇〇プロダクション"
                value={organizerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrganizerName(e.target.value)}
                required
                disabled={loading || success !== ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">連絡先メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="accounting@your-org.com"
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
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" 
              disabled={loading || success !== ''}
            >
              {loading ? '登録中...' : success ? '登録完了' : '主催者として登録する'}
            </Button>
            <div className="text-sm text-center text-gray-600 space-y-2">
              <div>
                <Link href="/organizer/login" className="text-purple-600 hover:underline">
                  既にアカウントをお持ちの方はこちら
                </Link>
              </div>
              <div className="pt-2 border-t">
                <Link href="/talent/register" className="text-gray-500 hover:underline">
                  タレント（キャスト）として登録したい
                </Link>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}