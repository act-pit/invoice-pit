'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ConfirmPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // URLからトークンを取得して確認
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // セッションを設定
          const { data: { user }, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          if (!user) {
            setStatus('error');
            return;
          }

          setStatus('success');

          // 少し待ってからリダイレクト
          await new Promise(resolve => setTimeout(resolve, 1000));

          // profilesテーブルをチェック（タレント）
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (profileData) {
            // タレントログインへ
            router.push('/talent/login');
            return;
          }

          // organizersテーブルをチェック（主催者）
          const { data: organizerData } = await supabase
            .from('organizers')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (organizerData) {
            // 主催者ログインへ
            router.push('/organizer/login');
            return;
          }

          // どちらでもない場合
          router.push('/');
        } else {
          // トークンがない場合は、既にログイン済みかチェック
          const { data: { user } } = await supabase.auth.getUser();

          if (!user) {
            setStatus('error');
            return;
          }

          setStatus('success');
          await new Promise(resolve => setTimeout(resolve, 1000));

          // profilesテーブルをチェック
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (profileData) {
            router.push('/talent/login');
            return;
          }

          // organizersテーブルをチェック
          const { data: organizerData } = await supabase
            .from('organizers')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (organizerData) {
            router.push('/organizer/login');
            return;
          }

          router.push('/');
        }
      } catch (error) {
        console.error('メール確認エラー:', error);
        setStatus('error');
      }
    };

    confirmEmail();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {status === 'checking' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">メール認証を確認中...</h2>
            <p className="text-gray-600">少々お待ちください</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">メール認証完了！</h2>
            <p className="text-gray-600">ログインページに移動しています...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">認証に失敗しました</h2>
            <p className="text-gray-600 mb-4">
              リンクが無効か、既に使用されています。<br />
              再度登録するか、ログインしてください。
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href="/talent"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                タレントトップへ
              </a>
              <a
                href="/organizer"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                主催者トップへ
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
