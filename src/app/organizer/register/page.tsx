// src/app/organizer/register/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// 主催者コードを生成する関数（8桁に変更）
const generateOrganizerCode = (length = 8) => {  // ← 6から8に変更
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function OrganizerRegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // フォームステート
  const [organizerName, setOrganizerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI/ロードステート
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // ユニークな主催者コードを生成
  const generateUniqueOrganizerCode = async (): Promise<string> => {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const code = generateOrganizerCode();
      
      // 既に存在するか確認
      const { data } = await supabase
        .from('organizers')
        .select('organizer_code')
        .eq('organizer_code', code)
        .maybeSingle();
      
      if (!data) {
        return code; // ユニークなコードが見つかった
      }
      
      attempts++;
    }
    
    throw new Error('主催者コードの生成に失敗しました。もう一度お試しください。');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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

    try {
      console.log('📝 主催者登録開始:', { organizerName, email });

      // 1. ユニークな主催者コードを生成
      const newOrganizerCode = await generateUniqueOrganizerCode();
      console.log('🎫 主催者コード生成:', newOrganizerCode);

      // 2. Supabase Authにユーザーを登録
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?type=organizer`,
          data: {
            role: 'organizer',
            organizer_name: organizerName,
            organizer_code: newOrganizerCode,
            user_type: 'organizer', 
          },
        },
      });

      if (signUpError) {
        console.error('❌ サインアップエラー:', signUpError);
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

      console.log('✅ Auth登録成功:', userId);
      
      // 3. organizersテーブルに挿入
      console.log('📝 挿入データ:', {
        id: userId,
        organizer_code: newOrganizerCode,
        company_name: organizerName,
        name: organizerName,
        email: email,
      });

      const { data: insertedData, error: orgInsertError } = await supabase
        .from('organizers')
        .insert({
          id: userId,
          organizer_code: newOrganizerCode,
          company_name: organizerName,
          name: organizerName,
          email: email,
        })
        .select();

      console.log('📊 挿入結果:', { data: insertedData, error: orgInsertError });

      if (orgInsertError) {
        console.error('主催者情報挿入エラー:', orgInsertError.message, orgInsertError.code);
        console.error('❌ エラー詳細:', {
          message: orgInsertError.message,
          details: orgInsertError.details,
          hint: orgInsertError.hint,
          code: orgInsertError.code,
        });
        setError(`主催者情報の登録に失敗しました: ${orgInsertError.message}`);
        setLoading(false);
        return;
      }

      console.log('✅ 主催者情報登録成功');

      // ✅ 4. subscriptionsテーブルにフリープランのレコードを作成
      console.log('📝 サブスクリプションレコード作成開始');
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          user_type: 'organizer',
          plan: 'free',
          billing_cycle: 'monthly',
          status: 'active',
          invoice_count: 0,
          job_post_count: 0,
          job_post_limit: 0,
        })
        .select();

      if (subscriptionError) {
        console.error('❌ サブスクリプション作成エラー:', subscriptionError);
        // サブスクリプション作成に失敗しても登録は完了とする
      } else {
        console.log('✅ サブスクリプション作成成功:', subscriptionData);
      }
      
      // 5. 成功メッセージ
      setSuccess(
        `登録が完了しました！\n\n` +
        `メールアドレス宛に確認メールを送信しました。\n` +
        `メール内のリンクをクリックして、メールアドレスを確認してください。\n\n` +
        `💡 あなたの主催者コード: ${newOrganizerCode}\n` +
        `（このコードは後ほどダッシュボードでも確認できます）`
      );
      setLoading(false);

      // 7秒後にログインページへリダイレクト
      setTimeout(() => {
        router.push('/organizer/login');
      }, 15000);
    } catch (err: any) {
      console.error('💥 予期しないエラー:', err);
      setError(err.message || '予期しないエラーが発生しました。もう一度お試しください。');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">🎪 主催者 新規登録</CardTitle>
          <CardDescription className="text-center">
            キャストからの請求書を受領・管理しましょう
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {/* エラーメッセージ */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
              </Alert>
            )}

            {/* 成功メッセージ */}
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800 whitespace-pre-line">{success}
                  <div className="mt-4 space-y-2">
                    <Button 
                      onClick={() => router.push('/organizer/login')}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      ログイン画面へ
                    </Button>
                    <Button 
                      onClick={() => router.push('/')}
                      variant="outline"
                      className="w-full"
                   >
                      トップページに戻る
                    </Button>
                  </div>
                </AlertDescription>
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
                onChange={(e) => setOrganizerName(e.target.value)}
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
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
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
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || success !== ''}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700" 
              disabled={loading || success !== ''}
            >
              {loading ? '登録中...' : success ? '登録完了' : '主催者として登録する'}
            </Button>

            <div className="text-sm text-center text-gray-600 space-y-2">
              <div>
                <Link href="/organizer/login" className="text-blue-600 hover:underline">
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
