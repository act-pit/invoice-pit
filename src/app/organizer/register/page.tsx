'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// ランダムな主催者コードを生成
function generateOrganizerCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function OrganizerRegisterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [organizerName, setOrganizerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        setIsLoggedIn(true);
        if (session.user.email) {
          setEmail(session.user.email);
        }
      } else {
        setIsLoggedIn(false);
      }
    };
    
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // コード生成
      let code = generateOrganizerCode();
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        const { data } = await supabase
          .from('organizers')
          .select('id')
          .eq('organizer_code', code)
          .single();

        if (!data) {
          isUnique = true;
        } else {
          code = generateOrganizerCode();
          attempts++;
        }
      }

      if (!isUnique) {
        throw new Error('コード生成に失敗しました');
      }

      // セッション再確認
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        // ケース1: ログイン済み → 主催者情報を追加
        const { error: insertError } = await supabase
          .from('organizers')
          .insert({
            organizer_code: code,
            name: organizerName,
            email: email,
            created_by: session.user.id,
          });

        if (insertError) throw insertError;

        setGeneratedCode(code);
        setSuccess(true);
      } else {
        // ケース2: 未ログイン → 新規アカウント作成
        
        if (password !== confirmPassword) {
          setError('パスワードが一致しません');
          setLoading(false);
          return;
        }

        if (password.length < 8) {
          setError('パスワードは8文字以上です');
          setLoading(false);
          return;
        }

        // localStorage に保存
        const organizerData = { code, name: organizerName, email };
        localStorage.setItem('pending_organizer', JSON.stringify(organizerData));

        // アカウント作成
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/organizer/confirm`,
          },
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error('アカウント作成に失敗');

        // メール確認OFFの場合
        if (authData.session) {
          const { error: insertError } = await supabase
            .from('organizers')
            .insert({
              organizer_code: code,
              name: organizerName,
              email: email,
              created_by: authData.user.id,
            });

          if (insertError) throw insertError;
          localStorage.removeItem('pending_organizer');
          setGeneratedCode(code);
          setSuccess(true);
        } else {
          // メール確認が必要
          alert('確認メールを送信しました。メールをご確認ください。');
          setLoading(false);
          return;
        }
      }
    } catch (err: any) {
      console.error('登録エラー:', err);
      setError('登録に失敗: ' + err.message);
      localStorage.removeItem('pending_organizer');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-green-600">
              ✅ 主催者登録完了
            </CardTitle>
            <CardDescription className="text-center">
              主催者コードが発行されました
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-purple-50 border-2 border-purple-600 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">あなたの主催者コード</p>
              <p className="text-3xl font-bold text-purple-600 tracking-wider mb-3">
                {generatedCode}
              </p>
              <p className="text-xs text-gray-500">
                このコードをキャストに共有してください
              </p>
            </div>
            <div className="space-y-3">
              <Button className="w-full" onClick={() => router.push('/organizer/dashboard')}>
                主催者ダッシュボードへ
              </Button>
              <Button variant="outline" className="w-full" onClick={() => {
                navigator.clipboard.writeText(generatedCode);
                alert('コードをコピーしました！');
              }}>
                📋 コードをコピー
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isLoggedIn ? '主催者情報の登録' : '主催者新規登録'}
          </CardTitle>
          <CardDescription className="text-center">
            {isLoggedIn ? '主催者として活動するための情報を登録' : '主催者アカウント作成'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="organizerName" className="text-sm font-medium">
                主催者名（団体名・企業名）<span className="text-red-500">*</span>
              </label>
              <input
                id="organizerName"
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="例: ○○劇団、株式会社○○"
                required
              />
            </div>

            {!isLoggedIn && (
              <>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="your-email@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    パスワード <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="8文字以上"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    パスワード（確認）<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="もう一度入力"
                    required
                  />
                </div>
              </>
            )}

            <div className="bg-blue-50 p-4 rounded-md text-sm">
              <p className="font-medium text-blue-900 mb-2">📌 主催者コードについて</p>
              <ul className="text-blue-800 space-y-1 text-xs">
                <li>• 8桁のユニークなコードが自動生成されます</li>
                <li>• キャストがこのコードで請求書を送信できます</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登録中...' : isLoggedIn ? '主催者情報を登録' : '主催者アカウント作成'}
            </Button>
          </form>

          {!isLoggedIn && (
            <div className="mt-4 text-center space-y-2">
              <Link href="/organizer/login" className="block text-sm text-purple-600 hover:underline">
                既にアカウントをお持ちの方
              </Link>
              <Link href="/login" className="block text-sm text-gray-600 hover:underline">
                キャストの方はこちら
              </Link>
            </div>
          )}

          {isLoggedIn && (
            <div className="mt-4 text-center">
              <Link href="/dashboard" className="text-sm text-gray-600 hover:underline">
                ← ダッシュボードに戻る
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
