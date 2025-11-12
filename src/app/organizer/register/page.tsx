'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// ランダムな主催者コードを生成
function generateOrganizerCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 紛らわしい文字を除外
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function OrganizerRegisterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [organizerName, setOrganizerName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user) {
      setError('ログインが必要です');
      setLoading(false);
      return;
    }

    try {
      // ユニークなコードを生成
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
        throw new Error('コード生成に失敗しました。もう一度お試しください。');
      }

      // 主催者を登録
      const { error: insertError } = await supabase
        .from('organizers')
        .insert({
          organizer_code: code,
          name: organizerName,
          email: organizerEmail || null,
          created_by: user.id,
        });

      if (insertError) throw insertError;

      setGeneratedCode(code);
      setSuccess(true);
    } catch (err: any) {
      console.error('主催者登録エラー:', err);
      setError('登録に失敗しました: ' + err.message);
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
              <Button 
                className="w-full" 
                onClick={() => router.push('/organizer/dashboard')}
              >
                主催者ダッシュボードへ
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode);
                  alert('コードをコピーしました！');
                }}
              >
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
          <CardTitle className="text-2xl font-bold text-center">主催者登録</CardTitle>
          <CardDescription className="text-center">
            主催者として登録し、専用コードを取得
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
                主催者名（団体名・企業名）*
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

            <div className="space-y-2">
              <label htmlFor="organizerEmail" className="text-sm font-medium">
                メールアドレス（任意）
              </label>
              <input
                id="organizerEmail"
                type="email"
                value={organizerEmail}
                onChange={(e) => setOrganizerEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="organizer@example.com"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-md text-sm">
              <p className="font-medium text-blue-900 mb-2">📌 主催者コードについて</p>
              <ul className="text-blue-800 space-y-1 text-xs">
                <li>• 8桁のユニークなコードが自動生成されます</li>
                <li>• キャストがこのコードで請求書を送信できます</li>
                <li>• コードは登録後に表示されます</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登録中...' : '主催者登録'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/dashboard" className="text-sm text-gray-600 hover:underline">
              ← ダッシュボードに戻る
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
