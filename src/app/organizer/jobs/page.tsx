'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import type { Organizer } from '@/types/database';

export default function OrganizerJobsPage() {
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
          <div className="mb-8">
            <Link href="/organizer/dashboard">
              <Button variant="outline" size="sm" className="mb-4">
                ← ダッシュボードに戻る
              </Button>
            </Link>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              案件/AD募集
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              タレント募集の投稿と管理
            </p>
          </div>

          <Card className="bg-white border-2 border-yellow-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⭐ プレミアムプラン限定機能
              </CardTitle>
              <CardDescription>
                この機能はプレミアムプラン加入者のみご利用いただけます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-yellow-300">
                  <h3 className="font-bold text-lg mb-3">案件投稿機能でできること</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>タレント募集案件の投稿</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>報酬・条件の詳細設定</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>応募者の管理と選考</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>案件の編集・削除</span>
                    </li>
                  </ul>
                </div>

                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">
                    プレミアムプランにアップグレードして、<br />
                    タレント募集機能を今すぐ使い始めましょう！
                  </p>
                  <Link href="/organizer/subscription">
                    <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700">
                      プレミアムプランにアップグレード
                    </Button>
                  </Link>
                </div>

                <div className="text-center text-sm text-gray-500 pt-4 border-t">
                  <p>※ 機能は現在開発中です。近日公開予定！</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <Link href="/organizer/dashboard">
              <Button variant="outline">
                ← ダッシュボードに戻る
              </Button>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
