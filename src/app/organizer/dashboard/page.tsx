'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import type { Organizer } from '@/types/database';

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);

  useEffect(() => {
    const supabase = createClient();
    
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          router.push('/organizer/login');
          return;
        }
        
        setUser(user);
        
        // 主催者データ取得
        const { data: organizerData, error: organizerError } = await supabase
          .from('organizers')
          .select('*')
          .eq('id', user.id)
          .single();

        if (organizerError) {
          console.error('主催者データ取得エラー:', organizerError);
          router.push('/organizer/login');
          return;
        }

        setOrganizer(organizerData);
      } catch (error) {
        console.error('エラー:', error);
        router.push('/organizer/login');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/organizer/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 relative">
      <div className="absolute inset-0 bg-white/30 backdrop-blur-3xl"></div>
      <div className="relative z-10">
        <header className="bg-white shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4 flex justify-between items-center">
            <h1 className="text-lg sm:text-2xl font-bold text-green-600">請求書ぴっと - 主催者</h1>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden sm:inline text-sm text-gray-900">
                {organizer?.name || organizer?.company_name} 様
              </span>
              <Button onClick={handleSignOut} variant="outline" size="sm" className="text-xs sm:text-sm">
                ログアウト
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              請求書ぴっと - 主催者
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              タレントから受け取った請求書の管理・承認がスムーズに！<br />
              案件投稿や入金管理をまとめて行えます。
            </p>
          </div>

          {/* 主催者コード表示カード */}
          <Card className="mb-8 bg-white card-compact border-green-200">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">あなたの主催者コード</CardTitle>
              <CardDescription className="text-xs sm:text-sm">タレントにこのコードを共有してください</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-600 rounded-lg px-4 sm:px-6 py-3 sm:py-4">
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 tracking-wider">
                    {organizer?.organizer_code}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm border-2 border-green-400"
                  onClick={() => {
                    if (organizer?.organizer_code) {
                      navigator.clipboard.writeText(organizer.organizer_code);
                      alert('コードをコピーしました！');
                    }
                  }}
                >
                  📋 コピー
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow bg-white card-compact">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  📋 請求書一覧
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  受け取った請求書を確認・承認
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/organizer/invoices" className="block">
                  <Button 
                    className="w-full border-2 border-green-600 bg-green-600 text-white hover:bg-green-700 hover:border-green-700 transition-all text-xs sm:text-sm"
                  >
                    一覧を見る
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow bg-white card-compact">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  ⚙️ 事業者設定
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  会社情報と設定を管理
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/organizer/settings" className="block">
                  <Button 
                    className="w-full border-2 border-green-600 bg-green-600 text-white hover:bg-green-700 hover:border-green-700 transition-all text-xs sm:text-sm"
                  >
                    設定を開く
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow card-compact border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  ⭐ プレミアムプラン
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  案件投稿など追加機能
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/organizer/subscription" className="block">
                  <Button 
                    className="w-full border-2 border-yellow-600 bg-yellow-600 text-white hover:bg-yellow-700 hover:border-yellow-700 transition-all font-semibold text-xs sm:text-sm"
                  >
                    アップグレード
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow bg-white card-compact opacity-60 cursor-not-allowed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  💼 案件/AD募集
                  <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">有料</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  タレント募集の投稿管理
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/organizer/jobs" className="block pointer-events-none">
                  <Button 
                    className="w-full border-2 border-gray-400 bg-gray-400 text-white text-xs sm:text-sm"
                    disabled
                  >
                    準備中
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow bg-white card-compact">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  ❓ ヘルプ
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  使い方とサポート
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full text-xs sm:text-sm" variant="outline">
                  ヘルプを見る
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 card-compact border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                📰 お知らせ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-2 sm:p-4">
              <div className="bg-white p-3 rounded-lg border border-green-200">
                <p className="text-xs sm:text-sm font-semibold text-green-900 mb-1">
                  🎉 主催者向け機能リリース！
                </p>
                <p className="text-xs text-gray-600">
                  タレントからの請求書を簡単に管理・承認できるようになりました！差し戻し機能も搭載しています。
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
