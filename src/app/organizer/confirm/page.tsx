'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function OrganizerConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [organizerCode, setOrganizerCode] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const code = searchParams.get('code');
        if (!code) throw new Error('確認コードが見つかりません');

        // Supabase が自動的にメール確認を処理するので、セッションを取得するだけ
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error('メール確認後、ログインしてください');
        }

        const pendingOrganizerStr = localStorage.getItem('pending_organizer');
        if (!pendingOrganizerStr) throw new Error('主催者情報が見つかりません');

        const pendingOrganizer = JSON.parse(pendingOrganizerStr);

        const { error: insertError } = await supabase
          .from('organizers')
          .insert({
            organizer_code: pendingOrganizer.code,
            name: pendingOrganizer.name,
            email: pendingOrganizer.email,
            created_by: session.user.id,  // ← sessionData.user から session.user に変更
          });


        if (insertError) throw insertError;

        localStorage.removeItem('pending_organizer');
        setOrganizerCode(pendingOrganizer.code);
        setSuccess(true);
      } catch (err: any) {
        console.error('メール確認エラー:', err);
        setError(err.message || 'メール確認に失敗');
      } finally {
        setLoading(false);
      }
    };

    confirmEmail();
  }, [searchParams, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">メール確認中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-red-600">❌ エラー</CardTitle>
            <CardDescription className="text-center">メール確認に失敗</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/organizer/register')}>登録ページに戻る</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-green-600">✅ メール確認完了</CardTitle>
            <CardDescription className="text-center">主催者登録が完了しました</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-purple-50 border-2 border-purple-600 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">あなたの主催者コード</p>
              <p className="text-3xl font-bold text-purple-600 tracking-wider mb-3">{organizerCode}</p>
              <p className="text-xs text-gray-500">このコードをキャストに共有してください</p>
            </div>
            <div className="space-y-3">
              <Button className="w-full" onClick={() => router.push('/organizer/dashboard')}>
                主催者ダッシュボードへ
              </Button>
              <Button variant="outline" className="w-full" onClick={() => {
                navigator.clipboard.writeText(organizerCode);
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

  return null;
}

export default function OrganizerConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">読み込み中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <OrganizerConfirmContent />
    </Suspense>
  );
}
