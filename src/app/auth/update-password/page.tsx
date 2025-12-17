// src/app/auth/update-password/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // セッションの確認
    const checkSession = async () => {
      console.log('🔍 セッション確認中...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ セッションエラー:', sessionError);
        setError('セッションの確認に失敗しました。');
        setCheckingSession(false);
        return;
      }

      if (session) {
        console.log('✅ 有効なセッション:', session.user.email);
        setIsValidSession(true);
      } else {
        console.warn('⚠️ セッションが無効');
        setError(
          'セッションが無効です。\n\n' +
          'パスワードリセットのリンクが期限切れの可能性があります。\n' +
          '再度パスワードリセット手続きを行ってください。'
        );
      }
      setCheckingSession(false);
    };
    
    checkSession();
  }, [supabase]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!newPassword || !confirmPassword) {
      setError('全ての項目を入力してください。');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('パスワードは8文字以上である必要があります。');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません。');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 パスワード更新中...');

      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('❌ パスワード更新エラー:', updateError);
        setError(`エラーが発生しました: ${updateError.message}`);
        setLoading(false);
        return;
      }

      console.log('✅ パスワード更新成功:', updateData.user?.email);
      setSuccess('パスワードが正常に更新されました！');
      
      // ユーザータイプを判定してリダイレクト
      const userId = updateData.user?.id;
      if (userId) {
        console.log('🔍 ユーザータイプ判定中...');

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        const { data: organizer } = await supabase
          .from('organizers')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        // 3秒後にリダイレクト
        setTimeout(() => {
          if (organizer) {
            console.log('➡️ 主催者ダッシュボードへリダイレクト');
            router.push('/organizer/dashboard');
          } else if (profile) {
            console.log('➡️ タレントダッシュボードへリダイレクト');
            router.push('/talent/dashboard');
          } else {
            console.log('➡️ トップページへリダイレクト');
            router.push('/');
          }
        }, 3000);
      }
    } catch (err: any) {
      console.error('💥 予期しないエラー:', err);
      setError('予期しないエラーが発生しました。もう一度お試しください。');
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <p className="text-gray-600">セッションを確認中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">🔑 新しいパスワードの設定</CardTitle>
          <CardDescription className="text-center">
            新しいパスワードを入力してください
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdatePassword}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  {success}
                  <div className="mt-2 text-sm">
                    ダッシュボードにリダイレクトしています...
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {!success && isValidSession && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">新しいパスワード（8文字以上）</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {!isValidSession && (
              <div className="text-center">
                <Button
                  onClick={() => router.push('/reset-password')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  パスワードリセット画面に戻る
                </Button>
              </div>
            )}
          </CardContent>

          {!success && isValidSession && (
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? '更新中...' : 'パスワードを更新'}
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>
    </div>
  );
}
