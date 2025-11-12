import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Handshake, CircleDollarSign, Theater, Mic, Film, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50">
      {/* ヘッダー */}
      <header className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <nav className="flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-purple-600">請求書ぴっと</h1>
          <div className="flex gap-2 sm:gap-4">
            <Link href="/login">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm border-purple-200">
                ログイン
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-xs sm:text-sm border-2 border-purple-400">
                新規登録
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* ヒーローセクション */}
      <main className="container mx-auto px-3 sm:px-6 py-8 sm:py-16 text-center">
        <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
          フリーの芸能関係者向け<br />
          <span className="text-purple-600">請求書自動作成アプリ</span>
        </h2>
        <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
          便利な請求書自動作成や主催者との連携機能。<br/ >
          あなたの仕事をもっとスムーズに。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2 border-purple-400">
              今すぐ無料で始める
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-purple-200">
              ログイン
            </Button>
          </Link>
        </div>

        {/* 機能紹介 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 mt-12 sm:mt-16">
          <div className="bg-white p-5 sm:p-6 rounded-lg shadow-lg card-compact">
            <div className="mb-3 sm:mb-4 flex justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">簡単請求書作成</h3>
            <p className="text-sm sm:text-base text-gray-600">
              直感的なインターフェースで誰でも簡単に請求書を作成できます。難しい税の計算も自動で判別し、計算。
            </p>
          </div>
          <div className="bg-white p-5 sm:p-6 rounded-lg shadow-lg card-compact">
            <div className="mb-3 sm:mb-4 flex justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <Handshake className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">主催者連携</h3>
            <p className="text-sm sm:text-base text-gray-600">
              主催者コードで簡単に請求書を送信。メール不要で連携できるので、リアルタイムで進捗確認が可能。
            </p>
          </div>
          <div className="bg-white p-5 sm:p-6 rounded-lg shadow-lg card-compact">
            <div className="mb-3 sm:mb-4 flex justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-full flex items-center justify-center">
                <CircleDollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">お得な料金</h3>
            <p className="text-sm sm:text-base text-gray-600">
              登録から3ヶ月間、または3通まで作成が無料。その後は、約82円/月(年間980円)で無制限に利用可能。
            </p>
          </div>
        </div>

{/* 詳細機能セクション */}
<div className="mt-16 sm:mt-24 max-w-4xl mx-auto">
  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 sm:mb-12">
    こんな方におすすめ
  </h3>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-left">
    <div className="bg-white p-3 sm:p-5 rounded-lg shadow card-compact">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Theater className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600" />
        </div>
        <div>
          <h4 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">舞台関係者</h4>
          <p className="text-sm sm:text-base text-gray-600">俳優/女優、ダンサー、振付師、制作スタッフ、演出家など</p>
        </div>
      </div>
    </div>
    <div className="bg-white p-3 sm:p-5 rounded-lg shadow card-compact">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Mic className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
        </div>
        <div>
          <h4 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">音楽関係者</h4>
          <p className="text-sm sm:text-base text-gray-600">シンガー、ミュージシャン、クリエイター、作曲家など</p>
        </div>
      </div>
    </div>
    <div className="bg-white p-3 sm:p-5 rounded-lg shadow card-compact">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Film className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600" />
        </div>
        <div>
          <h4 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">映像関係者</h4>
          <p className="text-sm sm:text-base text-gray-600">モーションアクター、制作、撮影、脚本家、編集スタッフなど</p>
        </div>
      </div>
    </div>
    <div className="bg-white p-3 sm:p-5 rounded-lg shadow card-compact">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-pink-600" />
        </div>
        <div>
          <h4 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">イベント関係者</h4>
          <p className="text-sm sm:text-base text-gray-600">司会、パフォーマー、芸人、タレント、運営スタッフなど</p>
        </div>
      </div>
    </div>
  </div>
</div>


        {/* CTAセクション */}
        <div className="mt-16 sm:mt-24 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 sm:p-12 rounded-2xl shadow-xl">
          <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
            今すぐ始めよう
          </h3>
          <p className="text-base sm:text-lg mb-6 sm:mb-8 opacity-90">
            3ヶ月 or 3通まで<br/>無料でお試しいただけます
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-white text-purple-600 hover:bg-gray-100 border-2 border-white">
              無料で新規登録
            </Button>
          </Link>
        </div>
      </main>

      {/* フッター */}
      <footer className="container mx-auto px-3 sm:px-6 py-8 sm:py-12 mt-16 sm:mt-24 border-t border-purple-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center sm:text-left">
          <div>
            <h4 className="font-bold text-gray-900 mb-3 sm:mb-4">請求書ぴっと</h4>
            <p className="text-xs sm:text-sm text-gray-600">
              芸能フリーランス向け請求書作成アプリ
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-3 sm:mb-4">リンク</h4>
            <ul className="flex gap-4 text-xs sm:text-sm justify-center sm:justify-start">
              <li>
                <Link href="/login" className="text-gray-600 hover:text-purple-600 border border-gray-300 hover:border-purple-600 px-3 py-1.5 rounded transition-colors">
                ログイン
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-600 hover:text-purple-600 border border-gray-300 hover:border-purple-600 px-3 py-1.5 rounded transition-colors">
                新規登録
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3 sm:mb-4">サポート</h4>
            <p className="text-xs sm:text-sm text-gray-600">
              お問い合わせ:<br />
              <a href="mailto:info@invoice-pit.com" className="text-purple-600 hover:underline">
                info@invoice-pit.com
              </a>
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-purple-100 text-center text-xs sm:text-sm text-gray-600">
          <p>&copy; 2025 請求書ぴっと All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
