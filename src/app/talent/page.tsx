import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TalentHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50">
      {/* ヘッダー */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl sm:text-2xl font-bold text-blue-600">
            請求書ぴっと
          </Link>
          <Link href="/talent/login">
            <Button variant="outline" size="sm" className="text-sm border-blue-300 text-blue-700 hover:bg-blue-50">
              ログイン
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* ヒーローセクション */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-block mb-6 px-4 py-2 bg-blue-100 rounded-full">
            <span className="text-sm font-semibold text-blue-700">芸能フリーランス向け</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            質問に答えるだけで
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
              たった1分で請求書完成
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            源泉徴収10.21%も自動計算。<br />
            PC不要、会計知識不要。スマホだけで請求書作成から送信まで完結。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Link href="/talent/register" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto text-base sm:text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
              >
                🚀 無料で始める
              </Button>
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <span className="text-green-600">✓</span>
              <span>初期費用0円</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-600">✓</span>
              <span>会計知識/PC不要</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-600">✓</span>
              <span>スマホ完全対応</span>
            </div>
          </div>
        </div>

        {/* 主な機能 */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10">
            主な機能
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 機能1 */}
            <Card className="border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-lg group">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📝</span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">簡単請求書作成</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  質問に答えて金額を入力するだけ。源泉徴収も消費税も自動計算されます。
                </p>
              </CardContent>
            </Card>

            {/* 機能2 */}
            <Card className="border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-lg group">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">💰</span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">源泉徴収10.21%自動計算</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  複雑な税計算も項目を選ぶだけで一発完了。ギャラとロイヤリティも自動判定。
                </p>
              </CardContent>
            </Card>

            {/* 機能3 */}
            <Card className="border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-lg group">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📱</span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">スマホ完全対応</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  現場でも移動中でもサクッと作成。PCもExcelも税知識も一切不要。
                </p>
              </CardContent>
            </Card>

            {/* 機能4 */}
            <Card className="border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-lg group">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📨</span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">主催者連携機能</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  主催者コードを入力すれば、アプリ上で請求書を送信。承認も入金管理も簡単。
                </p>
              </CardContent>
            </Card>

            {/* 機能5 */}
            <Card className="border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-lg group">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📄</span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">インボイス制度対応</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  T番号の管理・記載、適格請求書の要件を完全クリア。確定申告も安心。
                </p>
              </CardContent>
            </Card>

            {/* 機能6 */}
            <Card className="border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-lg group">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">💾</span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">データ永久保存</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  作成した請求書は自動でクラウド保存。検索・フィルターで過去データも瞬時に発見。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 料金プラン */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
            料金プラン
          </h2>
          <p className="text-center text-gray-600 mb-10">
            まずは完全無料で開始。リスクゼロで始められます。
          </p>

          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* 無料トライアル */}
            <Card className="border-2 border-blue-200 shadow-lg">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardTitle className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-2">まずは無料</div>
                  <div className="text-4xl font-bold text-blue-600">¥0</div>
                  <div className="text-sm text-gray-600 mt-2">3ヶ月間 または 3通まで</div>
                  <div className="text-xs text-gray-500 mt-1">※どちらか早い方まで</div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    <span className="text-gray-700">全機能使い放題</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    <span className="text-gray-700">請求書作成・管理</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    <span className="text-gray-700">主催者連携機能</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    <span className="text-gray-700">データ保存・検索</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* プレミアムプラン */}
            <Card className="border-2 border-yellow-300 shadow-lg relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                継続利用
              </div>
              <CardHeader className="bg-gradient-to-br from-yellow-50 to-orange-50">
                <CardTitle className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-2">プレミアム</div>
                  <div className="text-4xl font-bold text-yellow-600">¥1,980</div>
                  <div className="text-sm text-gray-600 mt-2">/年</div>
                  <div className="text-xs text-gray-500 mt-1">月額わずか165円</div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">✓</span>
                    <span className="text-gray-700 font-medium">請求書作成・管理無制限</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">✓</span>
                    <span className="text-gray-700 font-medium">全機能永久利用</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">✓</span>
                    <span className="text-gray-700 font-medium">案件情報も取得可能</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">✓</span>
                    <span className="text-gray-700 font-medium">優先サポート</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center text-sm text-gray-600">
            <p className="font-medium">✨ リスクゼロ！まずは無料で始めて、気に入ったら続けるだけ</p>
          </div>
        </div>

        {/* こんなお悩み解決 */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10">
            こんなお悩み、ありませんか？
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="border border-gray-200 bg-white">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">😰</span>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">源泉徴収の計算が複雑</h3>
                    <p className="text-sm text-gray-600">10.21%と20.42%の使い分けや税込・税抜の計算が分からない</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⏰</span>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">請求書作成に時間がかかる</h3>
                    <p className="text-sm text-gray-600">創作活動の時間が削られるし、内容が合っているかも不安</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💻</span>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">PCもExcelも持っていない</h3>
                    <p className="text-sm text-gray-600">スマホでサッと作りたいけど、対応ツールがない</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💸</span>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">既存ツールが高すぎる</h3>
                    <p className="text-sm text-gray-600">月額1,000円は収入が不安定な時期には重い...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <div className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg px-6 py-3">
              <p className="font-bold text-lg">👉 すべて自動化します！</p>
            </div>
          </div>
        </div>

                {/* さらに！案件情報も届く */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-8 sm:p-12">
            <div className="text-center mb-8">
              <div className="inline-block bg-yellow-400 text-yellow-900 text-sm font-bold px-4 py-2 rounded-full mb-4">
                ✨ さらに！
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                請求書管理だけじゃない！<br />
                お仕事情報も届きます
              </h2>
<p className="text-gray-700 text-base sm:text-lg">
  フリーでいると、なかなか手に入らない<br className="hidden sm:block" />
  オーディション案件情報や、イベント情報、求人募集が届く！<br/>
  主催者登録された団体からの情報なので、安全安心です！<br/>
  <span className="text-xs text-gray-500">※実装は、26年1月~を予定しています。</span>
</p>

            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <Card className="border-2 border-yellow-200 bg-white">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center">
                    <span className="text-3xl">🎬</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">オーディション情報</h3>
                  <p className="text-sm text-gray-600">
                    映画、ドラマ、舞台などの<br />オーディション案件
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-200 bg-white">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center">
                    <span className="text-3xl">🎪</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">イベント情報</h3>
                  <p className="text-sm text-gray-600">
                    ライブ、公演、<br />各種イベント出演依頼
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-200 bg-white">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center">
                    <span className="text-3xl">💼</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">求人募集</h3>
                  <p className="text-sm text-gray-600">
                    劇団、事務所、<br />プロダクションからの募集
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-700 font-medium">
                💡 請求書管理をしながら、次のお仕事も見つかる！
              </p>
            </div>
          </div>
        </div>


        {/* CTA */}
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 sm:p-12 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            創作活動に集中しませんか？
          </h2>
          <p className="text-blue-100 mb-8">
            面倒な請求書作成から解放され、<br />
            本業に時間を使えます。
          </p>
          <Link href="/talent/register">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold text-lg px-10 py-6 shadow-lg"
            >
              無料で今すぐ始める →
            </Button>
          </Link>
        </div>

        {/* フッター */}
        <div className="text-center mt-12 space-y-3">
          <div className="text-sm text-gray-600">
            主催者の方は
            <Link href="/organizer" className="text-purple-600 hover:underline font-semibold ml-1">
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
