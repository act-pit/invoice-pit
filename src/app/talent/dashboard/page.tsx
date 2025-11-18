'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { isProfileComplete, getMissingProfileFields } from '@/lib/profile-check';
import { Profile } from '@/types/database'; 

export default function TalentDashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showProfileAlert, setShowProfileAlert] = useState(false);


  useEffect(() => {
  loadProfile();
}, []);

const loadProfile = async () => {
  const supabase = createClient();
  try {
    // ✅ Supabaseから直接ユーザーを取得
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('ユーザーが取得できませんでした');
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

      if (error) throw error;

      console.log('プロフィールデータ:', data);
      console.log('名前:', data.full_name);

      setProfile(data);
      
      // プロフィール未完成ならアラート表示
      if (!isProfileComplete(data)) {
        setShowProfileAlert(true);
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-cyan-50 to-indigo-100 relative">
      <div className="absolute inset-0 bg-white/30 backdrop-blur-3xl"></div>
      <div className="relative z-10">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4 flex justify-between items-center">
            <h1 className="text-lg sm:text-2xl font-bold text-blue-600">請求書ぴっと - タレント</h1>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden sm:inline text-sm text-gray-900">
                {profile?.full_name} 様
              </span>
              <Button onClick={signOut} variant="outline" size="sm" className="text-xs sm:text-sm">
                ログアウト
              </Button>
            </div>
          </div>
        </header>

        {showProfileAlert && (
          <div className="bg-orange-500 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <svg className="h-6 w-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-sm sm:text-base">プロフィール情報が未登録です</p>
                    <p className="text-xs sm:text-sm">請求書を作成するには、お名前、住所、振込先情報の登録が必要です</p>
                    {profile && getMissingProfileFields(profile).length > 0 && (
                      <p className="text-xs mt-1">
                        未登録: {getMissingProfileFields(profile).join('、')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link href="/talent/settings" className="flex-1 sm:flex-none">
                    <Button variant="outline" size="sm" className="w-full bg-white text-orange-600 hover:bg-gray-100 text-xs sm:text-sm">
                      今すぐ登録
                    </Button>
                  </Link>
                  <button
                    onClick={() => setShowProfileAlert(false)}
                    className="text-white hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* メインコンテンツ */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              請求書ぴっと - タレント
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              フリーの芸能関係者向けの請求書作成アプリ。<br />
              複雑な税計算も全て自動化！<br />
              請求書の作成・入金管理等がスムーズに！
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 請求書作成カード */}
            <Card className="hover:shadow-lg transition-shadow bg-white card-compact">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  📝 請求書作成
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  新しい請求書を作成
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/talent/invoices/create" className="block">
                  <Button 
                    className="w-full border-2 border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 transition-all text-xs sm:text-sm"
                  >
                    作成する
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* 請求書一覧カード */}
            <Card className="hover:shadow-lg transition-shadow bg-white card-compact">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  📋 請求書一覧
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  作成済みの請求書を確認
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/talent/invoices" className="block">
                  <Button 
                    className="w-full border-2 border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 transition-all text-xs sm:text-sm"
                  >
                    一覧を見る
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* 設定カード */}
            <Card className="hover:shadow-lg transition-shadow bg-white card-compact">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  ⚙️ 設定
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  プロフィールと口座情報を管理
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/talent/settings" className="block">
                  <Button 
                    className="w-full border-2 border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 transition-all text-xs sm:text-sm"
                  >
                    設定を開く
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* プレミアムプランカード */}
            <Card className="hover:shadow-lg transition-shadow card-compact border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  ⭐ プレミアムプラン
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  無制限の請求書作成
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/talent/subscription" className="block">
                  <Button 
                    className="w-full border-2 border-yellow-600 bg-yellow-600 text-white hover:bg-yellow-700 hover:border-yellow-700 transition-all font-semibold text-xs sm:text-sm"
                  >
                    アップグレード
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* ヘルプカード */}
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

          {/* お知らせ・広告エリア */}
          <Card className="mt-6 card-compact border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                📰 お知らせ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-2 sm:p-4">
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">
                  🎉 新サービスリリース！
                </p>
                <p className="text-xs text-gray-600">
                  フリーランスの芸能関係者向けの請求書自動作成・管理サービス「請求書ぴっと」を新たにリリースいたしました！
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
