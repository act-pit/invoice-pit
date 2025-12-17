'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function TalentLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[TalentLoginPage] Already logged in, checking user type...');
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('[TalentLoginPage] Error checking profile:', profileError);
          return;
        }

        if (profile) {
          console.log('[TalentLoginPage] Profile exists, redirecting to dashboard');
          router.push('/talent/dashboard');
        }
      }
    };
    
    checkSession();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('[TalentLoginPage] Login attempt with email:', email);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[TalentLoginPage] Auth response:', { 
        user: authData?.user ? 'exists' : 'null', 
        error: authError?.message || 'none' 
      });

      if (authError) {
        console.error('[TalentLoginPage] Auth error:', authError);
        if (authError.message.includes('Invalid login credentials')) {
          setError('メールアドレスまたはパスワードが正しくありません');
        } else {
          setError(`ログインに失敗しました: ${authError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        console.error('[TalentLoginPage] No user data in response');
        setError('ログインに失敗しました。もう一度お試しください。');
        setLoading(false);
        return;
      }

      if (!authData.user.email_confirmed_at) {
        console.warn('[TalentLoginPage] Email not confirmed');
        setError('メールアドレスが確認されていません。メールを確認してください。');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      console.log('[TalentLoginPage] Checking profiles table for user:', authData.user.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', authData.user.id)
        .maybeSingle();

      console.log('[TalentLoginPage] Profiles query result:', {
        profile: profile ? 'exists' : 'null',
        error: profileError?.message || 'none'
      });

      if (profileError) {
        console.error('[TalentLoginPage] Profiles query error:', profileError);
        setError('ユーザー情報の確認中にエラーが発生しました。');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (!profile) {
        console.error('[TalentLoginPage] Profile not found in profiles table');
        setError('このアカウントはタレント登録されていません。');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      console.log('[TalentLoginPage] ✅ Login successful! Redirecting...');

      router.push('/talent/dashboard');
    } catch (err: unknown) {
      console.error('[TalentLoginPage] Unexpected error:', err);
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      setError(`予期しないエラーが発生しました: ${errorMessage}`);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-2xl text-center">タレントログイン</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="talent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>

            <div className="text-center text-sm">
              <Link 
                href="/reset-password" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                パスワードを忘れた方はこちら
              </Link>
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-600">アカウントをお持ちでない方</span>{' '}
              <Link 
                href="/talent/register" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                新規登録
              </Link>
            </div>
            <div className="text-center text-sm">
              <Link 
                href="/organizer/login" 
                className="text-gray-600 hover:text-gray-800 hover:underline"
              >
                主催者の方はこちら
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
