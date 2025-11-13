import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* ヘッダー */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            請求書ぴっと
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
            タレントと主催者をつなぐ請求書管理アプリ
          </p>
        </div>

        {/* 2つの選択肢 */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {/* タレント向け */}
          <Link href="/talent" className="block h-full">
            <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer h-full hover:scale-105 border-2 hover:border-purple-300">
              <CardHeader className="text-center pb-4">
                <div className="text-6xl sm:text-7xl mb-4">🎭</div>
                <CardTitle className="text-xl sm:text-3xl font-bold text-gray-900">
                  タレントの方
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm sm:text-base text-center text-gray-600 mb-4">
                  請求書を簡単に受取・管理
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2 font-bold">✓</span>
                    <span className="text-sm sm:text-base">請求書を簡単に受取・管理</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2 font-bold">✓</span>
                    <span className="text-sm sm:text-base">プロフィール情報を一元管理</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2 font-bold">✓</span>
                    <span className="text-sm sm:text-base">過去の請求書を検索・ダウンロード</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2 font-bold">✓</span>
                    <span className="text-sm sm:text-base">モバイル完全対応</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-5 text-base sm:text-lg">
                  詳しく見る →
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* 主催者向け */}
          <Link href="/organizer" className="block h-full">
            <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer h-full hover:scale-105 border-2 hover:border-green-300">
              <CardHeader className="text-center pb-4">
                <div className="text-6xl sm:text-7xl mb-4">📋</div>
                <CardTitle className="text-xl sm:text-3xl font-bold text-gray-900">
                  主催者の方
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm sm:text-base text-center text-gray-600 mb-4">
                  タレント管理・請求書発行を一元管理
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 font-bold">✓</span>
                    <span className="text-sm sm:text-base">専用コードでタレントを管理</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 font-bold">✓</span>
                    <span className="text-sm sm:text-base">請求書を一括発行</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 font-bold">✓</span>
                    <span className="text-sm sm:text-base">タレントのプロフィール確認</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 font-bold">✓</span>
                    <span className="text-sm sm:text-base">発行履歴の一覧管理</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-5 text-base sm:text-lg">
                  詳しく見る →
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* フッター */}
        <div className="text-center mt-12 sm:mt-16 text-sm text-gray-500">
          <p>© 2024 請求書ぴっと - すべての権利を保有</p>
        </div>
      </div>
    </div>
  );
}
