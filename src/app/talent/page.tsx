import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TalentHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* ヘッダー */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="text-6xl sm:text-7xl mb-4">🎭</div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            タレントの方へ
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            請求書管理をもっと簡単に。<br />
            面倒な請求書のやり取りをスマートに管理。
          </p>
        </div>

        {/* 機能紹介 */}
        <div className="max-w-4xl mx-auto mb-8 sm:mb-12">
          <Card className="shadow-xl border-2 border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-lg sm:text-2xl text-center">✨ こんな機能があります</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid sm:grid-cols-2 gap-6">
                {/* 機能1 */}
                <div className="flex items-start space-x-3 p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
                  <span className="text-2xl sm:text-4xl flex-shrink-0">📨</span>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1">請求書を簡単受取</h3>
                    <p className="text-xs sm:text-sm text-gray-600">主催者から送られた請求書を簡単に受け取り、管理できます</p>
                  </div>
                </div>

                {/* 機能2 */}
                <div className="flex items-start space-x-3 p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
                  <span className="text-2xl sm:text-4xl flex-shrink-0">👤</span>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1">プロフィール管理</h3>
                    <p className="text-xs sm:text-sm text-gray-600">氏名、住所、振込先などの情報を一元管理</p>
                  </div>
                </div>

                {/* 機能3 */}
                <div className="flex items-start space-x-3 p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
                  <span className="text-2xl sm:text-4xl flex-shrink-0">🔍</span>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1">履歴検索</h3>
                    <p className="text-xs sm:text-sm text-gray-600">過去の請求書を簡単に検索・ダウンロード</p>
                  </div>
                </div>

                {/* 機能4 */}
                <div className="flex items-start space-x-3 p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
                  <span className="text-2xl sm:text-4xl flex-shrink-0">📱</span>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1">モバイル対応</h3>
                    <p className="text-xs sm:text-sm text-gray-600">スマホでどこでもアクセス可能</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA（Call To Action） */}
        <div className="max-w-md mx-auto space-y-4">
          <Link href="/talent/register" className="block">
            <Button 
              size="lg" 
              className="w-full text-sm sm:text-lg py-5 sm:py-7 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg"
            >
              🚀 無料で新規登録
            </Button>
          </Link>
          
          <Link href="/talent/login" className="block">
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full text-sm sm:text-lg py-5 sm:py-7 border-2 border-purple-600 text-purple-600 hover:bg-purple-50 font-semibold"
            >
              ログイン
            </Button>
          </Link>
        </div>

        {/* フッターリンク */}
        <div className="text-center mt-8 sm:mt-12 text-sm text-gray-600">
          主催者の方は
          <Link href="/organizer" className="text-green-600 hover:underline font-semibold ml-1">
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
