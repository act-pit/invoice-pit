import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrganizerHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* ヘッダー */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="text-6xl sm:text-7xl mb-4">📋</div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            主催者の方へ
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            タレント管理・請求書発行を一元管理。<br />
            複数のタレントへの請求書発行を効率化。
          </p>
        </div>

        {/* 機能紹介 */}
        <div className="max-w-4xl mx-auto mb-8 sm:mb-12">
          <Card className="shadow-xl border-2 border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
              <CardTitle className="text-lg sm:text-2xl text-center">✨ こんな機能があります</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid sm:grid-cols-2 gap-6">
                {/* 機能1 */}
                <div className="flex items-start space-x-3 p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                  <span className="text-2xl sm:text-4xl flex-shrink-0">🔑</span>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1">専用コード管理</h3>
                    <p className="text-xs sm:text-sm text-gray-600">8桁の専用コードでタレントを簡単に管理</p>
                  </div>
                </div>

                {/* 機能2 */}
                <div className="flex items-start space-x-3 p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                  <span className="text-2xl sm:text-4xl flex-shrink-0">📤</span>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1">請求書一括発行</h3>
                    <p className="text-xs sm:text-sm text-gray-600">複数の請求書を効率的に発行</p>
                  </div>
                </div>

                {/* 機能3 */}
                <div className="flex items-start space-x-3 p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                  <span className="text-2xl sm:text-4xl flex-shrink-0">👥</span>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1">タレント情報確認</h3>
                    <p className="text-xs sm:text-sm text-gray-600">登録されたタレントのプロフィールを確認</p>
                  </div>
                </div>

                {/* 機能4 */}
                <div className="flex items-start space-x-3 p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                  <span className="text-2xl sm:text-4xl flex-shrink-0">📊</span>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1">発行履歴管理</h3>
                    <p className="text-xs sm:text-sm text-gray-600">過去の発行履歴を一覧で管理</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA（Call To Action） */}
        <div className="max-w-md mx-auto space-y-4">
          <Link href="/organizer/register" className="block">
            <Button 
              size="lg" 
              className="w-full text-sm sm:text-lg py-5 sm:py-7 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold shadow-lg"
            >
              🚀 無料で新規登録
            </Button>
          </Link>
          
          <Link href="/organizer/login" className="block">
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full text-sm sm:text-lg py-5 sm:py-7 border-2 border-green-600 text-green-600 hover:bg-green-50 font-semibold"
            >
              ログイン
            </Button>
          </Link>
        </div>

        {/* フッターリンク */}
        <div className="text-center mt-8 sm:mt-12 text-sm text-gray-600">
          タレントの方は
          <Link href="/talent" className="text-purple-600 hover:underline font-semibold ml-1">
            こちら
          </Link>
        </div>

        {/* ホームに戻る */}
        <div className="text-center mt-4">
          <Link href="/" className="text-gray-500 hover:underline text-sm">
            ← トップページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
