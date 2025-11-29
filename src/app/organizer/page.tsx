import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrganizerHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* ヘッダー */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl sm:text-2xl font-bold text-purple-600">
            請求書ぴっと
          </Link>
          <Link href="/organizer/login">
            <Button variant="outline" size="sm" className="text-sm border-purple-300 text-purple-700 hover:bg-purple-50">
              ログイン
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* ヒーローセクション */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-block mb-6 px-4 py-2 bg-purple-100 rounded-full">
            <span className="text-sm font-semibold text-purple-700">主催者・イベントオーガナイザー向け</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            受け取った請求書を
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              スマートに管理
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            タレントから届く請求書を一元管理。<br />
            承認・差し戻し・支払い管理まで、すべてをシンプルに。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Link href="/organizer/register" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto text-base sm:text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
              >
                🚀 無料で始める
              </Button>
            </Link>
          </div>
        </div>

        {/* 主な機能 */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10">
            主な機能
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 機能1 */}
            <Card className="border-2 border-purple-100 hover:border-purple-300 transition-all hover:shadow-lg group">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📨</span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">請求書受信・管理</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  タレントから送られた請求書を一覧で確認。ステータス別に整理して管理できます。
                </p>
              </CardContent>
            </Card>

            {/* 機能2 */}
            <Card className="border-2 border-purple-100 hover:border-purple-300 transition-all hover:shadow-lg group">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">承認・差し戻し</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  内容を確認して承認。修正が必要な場合は理由を添えて差し戻しも可能。
                </p>
              </CardContent>
            </Card>

            {/* 機能3 */}
            <Card className="border-2 border-purple-100 hover:border-purple-300 transition-all hover:shadow-lg group">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🔑</span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">専用コード発行</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  8桁の専用コードをタレントに共有するだけで、請求書が直接届きます。
                </p>
              </CardContent>
            </Card>

            {/* 機能4 */}
            <Card className="border-2 border-purple-100 hover:border-purple-300 transition-all hover:shadow-lg group">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">⏰</span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">支払期日アラート</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  支払期日が近づくと自動でお知らせ。支払い漏れを防止します。
                </p>
              </CardContent>
            </Card>

            {/* 機能5 */}
            <Card className="border-2 border-purple-100 hover:border-purple-300 transition-all hover:shadow-lg group">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">CSV出力</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  請求書データをCSV形式でエクスポート。会計ソフトとの連携も簡単。
                </p>
              </CardContent>
            </Card>

            {/* 機能6 */}
            <Card className="border-2 border-purple-100 hover:border-purple-300 transition-all hover:shadow-lg group">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">💰</span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">支払い管理</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  承認済み・支払済みのステータス管理で、支払いフローを可視化。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 料金プラン */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
            料金プラン
          </h2>
          <p className="text-center text-gray-600 mb-10">
            まずは無料で始めて、必要な機能だけ追加可能
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* フリープラン */}
            <Card className="border-2 border-gray-200">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-center">
                  <div className="text-2xl font-bold text-gray-900">フリー</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">¥0</div>
                  <div className="text-sm text-gray-500 mt-1">/月</div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span className="text-gray-700">請求書受信</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span className="text-gray-700">基本管理機能</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* ベーシックプラン */}
            <Card className="border-2 border-purple-300 shadow-lg relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                おすすめ
              </div>
              <CardHeader className="bg-gradient-to-br from-purple-50 to-blue-50">
                <CardTitle className="text-center">
                  <div className="text-2xl font-bold text-gray-900">ベーシック</div>
                  <div className="text-3xl font-bold text-purple-600 mt-2">¥980</div>
                  <div className="text-sm text-gray-500 mt-1">/月</div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">✓</span>
                    <span className="text-gray-700 font-medium">支払期日アラート</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">✓</span>
                    <span className="text-gray-700 font-medium">差し戻し機能</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">✓</span>
                    <span className="text-gray-700 font-medium">CSV出力</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* アドバンスプラン */}
            <Card className="border-2 border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-center">
                  <div className="text-2xl font-bold text-gray-900">アドバンス</div>
                  <div className="text-3xl font-bold text-blue-600 mt-2">¥1,980</div>
                  <div className="text-sm text-gray-500 mt-1">/月</div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    <span className="text-gray-700">ベーシック全機能</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    <span className="text-gray-700">CSVカスタム</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    <span className="text-gray-700">月次レポート</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    <span className="text-gray-700">案件掲載 1件/月</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* プロプラン */}
            <Card className="border-2 border-indigo-200">
              <CardHeader className="bg-indigo-50">
                <CardTitle className="text-center">
                  <div className="text-2xl font-bold text-gray-900">プロ</div>
                  <div className="text-3xl font-bold text-indigo-600 mt-2">¥2,980</div>
                  <div className="text-sm text-gray-500 mt-1">/月</div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">✓</span>
                    <span className="text-gray-700">アドバンス全機能</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">✓</span>
                    <span className="text-gray-700">全銀協・API連携</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">✓</span>
                    <span className="text-gray-700">自動月次レポート</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">✓</span>
                    <span className="text-gray-700">案件掲載 2件/月</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <div className="inline-block bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg px-6 py-4">
              <p className="text-sm font-semibold text-yellow-800 mb-1">
                🎁 ACTぴっと連動特典
              </p>
              <p className="text-lg font-bold text-yellow-900">
                全プラン 30%OFF
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 sm:p-12 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            今すぐ無料で始めましょう
          </h2>
          <p className="text-purple-100 mb-8">
            請求書管理の煩雑さから解放され、本業に集中できます
          </p>
          <Link href="/organizer/register">
            <Button 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-gray-100 font-bold text-lg px-10 py-6 shadow-lg"
            >
              無料で新規登録 →
            </Button>
          </Link>
        </div>

        {/* フッター */}
        <div className="text-center mt-12 space-y-3">
          <div className="text-sm text-gray-600">
            タレントの方は
            <Link href="/talent" className="text-purple-600 hover:underline font-semibold ml-1">
              こちら
            </Link>
          </div>
          <div>
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
              ← トップページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
