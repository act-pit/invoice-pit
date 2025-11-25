'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle, Users, FileText, CreditCard, Shield, Zap } from 'lucide-react'
import Link from 'next/link'

interface QAItem {
  question: string
  answer: string
  category: 'cast' | 'organizer' | 'common'
}

const qaData: QAItem[] = [
  // 共通の質問
  {
    question: '請求書ぴっととは何ですか?',
    answer: '請求書ぴっとは、芸能フリーランス（キャスト）と主催者をつなぐ、請求書作成・管理に特化したWebサービスです。源泉徴収10.21%の自動計算、公演数×ギャラ計算、インボイス制度対応など、芸能業界特有のニーズに応えた機能を提供しています。スマホ完全対応で、いつでもどこでも請求書の作成・管理が可能です。',
    category: 'common'
  },
  {
    question: 'ACTぴっととの連携はどういう仕組みですか?',
    answer: 'ACTぴっとは演劇特化型のチケット販売システムで、3万人以上のユーザーベースを持つプラットフォームです。ACTぴっとで公演チケットを販売し、請求書ぴっとで出演者への請求書を一括管理することで、「チケット販売→公演実施→請求書発行」までを一気通貫で対応できます。ACTぴっとユーザーは全プラン30%OFFでご利用いただけます。',
    category: 'common'
  },
  {
    question: 'スマートフォンでも使えますか?',
    answer: 'はい、完全対応しています。請求書ぴっとはレスポンシブデザインを採用しており、スマートフォン、タブレット、PCのどのデバイスからでも快適にご利用いただけます。移動中やリハーサルの合間など、いつでもどこでも請求書の作成・確認が可能です。',
    category: 'common'
  },
  {
    question: 'データのセキュリティは大丈夫ですか?',
    answer: '請求書ぴっとは、業界標準のセキュリティ技術（SSL/TLS暗号化通信、Supabase認証基盤）を採用しています。個人情報や請求書データは厳格に管理され、第三者に開示されることはありません。データは永久保存され、バックアップも定期的に実施しています。',
    category: 'common'
  },

  // キャスト向けの質問
  {
    question: 'キャストの料金プランについて教えてください',
    answer: 'キャスト向けには2つのプランをご用意しています。\n\n【フリーミアムプラン】¥0\n・3ヶ月間 または 3通まで無料\n・基本的な請求書作成機能\n・源泉徴収自動計算\n・期間終了後は継続 or 終了を選択可能\n\n【プレミアムプラン】¥1,980/年（月額165円相当）\n・請求書作成無制限\n・全機能利用可能\n・データ永久保存\n・優先サポート\n\nまずは無料でお試しいただき、必要に応じてプレミアムプランへアップグレードできます。',
    category: 'cast'
  },
  {
    question: '源泉徴収10.21%の計算は自動ですか?',
    answer: 'はい、完全自動です。ギャラ金額を入力するだけで、源泉徴収税10.21%が自動計算され、手取り金額が表示されます。計算ミスの心配がなく、正確な請求書を素早く作成できます。インボイス制度にも対応しており、適格請求書の要件を満たした請求書を発行できます。',
    category: 'cast'
  },
  {
    question: '公演数×ギャラの計算はどうやりますか?',
    answer: '請求書作成画面で「公演数」と「1公演あたりのギャラ」を入力するだけで、自動的に合計金額が計算されます。例えば、1公演5,000円×10公演なら、自動的に50,000円と計算され、そこから源泉徴収額と手取り額も表示されます。複数の演目がある場合も、項目を追加して個別に設定できます。',
    category: 'cast'
  },
  {
    question: 'チケットバックとは何ですか?',
    answer: 'チケットバックとは、キャストが自身で販売したチケット枚数に応じて報酬が支払われる仕組みです。請求書ぴっとでは、「チケットバック単価×販売枚数」を自動計算し、ギャラと合算して請求書に記載できます。例えば、1枚500円×20枚なら10,000円がギャラに加算され、合計金額から源泉徴収が計算されます。',
    category: 'cast'
  },
  {
    question: '主催者コードって何ですか?',
    answer: '主催者コードは、特定の主催者と紐づけるための識別コードです。主催者から提供されたコードを登録することで、その主催者への請求書作成が簡単になり、主催者側もあなたの請求書を一覧で管理できるようになります。複数の主催者と取引がある場合、それぞれのコードを登録できます。',
    category: 'cast'
  },
  {
    question: '請求書のPDF出力はできますか?',
    answer: 'はい、作成した請求書はPDF形式でダウンロード・印刷が可能です。メールに添付して送信したり、印刷して手渡しすることもできます。PDF請求書には、適格請求書（インボイス）に必要な項目がすべて記載されており、法的要件を満たしています。',
    category: 'cast'
  },
  {
    question: '過去の請求書はいつまで保存されますか?',
    answer: 'プレミアムプランでは、作成した請求書は永久保存されます。フリーミアムプランでも、作成した請求書は削除されることなく保管されますが、新規作成が3通までに制限されます。過去の請求書はいつでも閲覧・再ダウンロードが可能で、確定申告などにもご活用いただけます。',
    category: 'cast'
  },

  // 主催者向けの質問
  {
    question: '主催者の料金プランについて教えてください',
    answer: '主催者向けには4つのプランをご用意しています。\n\n【フリープラン】¥0/月\n・基本的な請求書管理機能\n・最大10件のキャスト管理\n\n【ベーシックプラン】¥980/月\n・支払いアラート機能\n・CSV一括出力\n・キャスト数無制限\n\n【アドバンスプラン】¥1,980/月\n・カスタムCSV設定\n・レポート機能\n・ACTぴっとLP掲載（1件）\n\n【プロプラン】¥2,980/月\n・全銀協フォーマット対応\n・API連携\n・自動レポート配信\n・ACTぴっとLP掲載（2件）\n\n※ACTぴっとユーザーは全プラン30%OFF',
    category: 'organizer'
  },
  {
    question: 'キャストからの請求書はどうやって受け取りますか?',
    answer: 'キャストが請求書を作成する際、あなたの主催者コードを入力すると、自動的にあなたのダッシュボードに請求書が届きます。届いた請求書は一覧で確認でき、ステータス管理（未払い・支払い済み）も簡単に行えます。メール通知機能もあるため、新しい請求書が届いたらすぐに気づくことができます。',
    category: 'organizer'
  },
  {
    question: 'CSV一括出力機能とは何ですか?',
    answer: 'ベーシックプラン以上で利用できる機能で、複数のキャストからの請求書データをCSV形式で一括出力できます。会計ソフトへのインポートや、経理担当者への共有が簡単になります。アドバンスプランでは、CSVの項目を自由にカスタマイズでき、会社独自の経理フォーマットに対応できます。',
    category: 'organizer'
  },
  {
    question: '全銀協フォーマット対応とは何ですか?',
    answer: 'プロプランで利用できる機能で、全国銀行協会が定めた振込データフォーマット（全銀協フォーマット）で請求書データを出力できます。これにより、銀行の総合振込サービスを利用して、複数のキャストへの支払いを一括で処理できます。大量の振込処理を効率化したい団体・法人様に最適です。',
    category: 'organizer'
  },
  {
    question: '支払いアラート機能について教えてください',
    answer: 'ベーシックプラン以上で利用できる機能で、支払い期日が近づいた請求書を自動的にお知らせします。支払い忘れを防ぎ、キャストとの信頼関係を維持できます。アラートのタイミング（3日前、1週間前など）は自由に設定でき、メールやダッシュボード通知で受け取れます。',
    category: 'organizer'
  },
  {
    question: 'ACTぴっとLP掲載とは何ですか?',
    answer: 'アドバンスプラン以上で利用できる特典で、ACTぴっとのランディングページにあなたの団体・公演情報を掲載できます。3万人以上のユーザーに向けて宣伝でき、新しいキャストの募集や観客の獲得につながります。アドバンスプランは1件、プロプランは2件まで掲載可能です。',
    category: 'organizer'
  },
  {
    question: 'API連携機能について教えてください',
    answer: 'プロプランで利用できる機能で、請求書ぴっとのデータを外部システム（自社の会計システムや公演管理システムなど）と連携できます。請求書データの自動取得や、支払いステータスの同期が可能になり、業務の完全自動化を実現できます。API仕様書はダッシュボードからダウンロードできます。',
    category: 'organizer'
  },
  {
    question: 'レポート機能では何が確認できますか?',
    answer: 'アドバンスプラン以上で利用できる機能で、月次・年次の支払いレポートを自動生成します。キャスト別の支払い総額、公演別のコスト分析、源泉徴収税の合計額など、経営判断に必要なデータを可視化できます。プロプランでは、レポートを自動配信する設定も可能で、経理担当者やプロデューサーと情報共有が簡単になります。',
    category: 'organizer'
  },
]

const categories = [
  { id: 'all', label: 'すべて', icon: HelpCircle },
  { id: 'common', label: '共通', icon: Zap },
  { id: 'cast', label: 'キャスト向け', icon: Users },
  { id: 'organizer', label: '主催者向け', icon: FileText },
]

export default function QAPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const filteredQA = activeCategory === 'all' 
    ? qaData 
    : qaData.filter(item => item.category === activeCategory)

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                請求書ぴっと
              </span>
            </Link>
            <Link 
              href="/"
              className="px-4 py-2 text-sm sm:text-base text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              トップページへ
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-12 pb-8 sm:pt-16 sm:pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-purple-100 rounded-full px-4 py-2 mb-6">
            <HelpCircle className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-600">よくある質問</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            よくある質問
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            請求書ぴっとに関するよくある質問をまとめました。<br className="hidden sm:block" />
            カテゴリーから選択して、知りたい情報をご覧ください。
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {categories.map((category) => {
              const Icon = category.icon
              const isActive = activeCategory === category.id
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-medium transition-all duration-300
                    ${isActive 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105' 
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm sm:text-base">{category.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Q&A Accordion */}
      <section className="pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-3 sm:space-y-4">
            {filteredQA.map((item, index) => {
              const isOpen = openIndex === index
              const categoryInfo = categories.find(cat => cat.id === item.category)
              const CategoryIcon = categoryInfo?.icon || HelpCircle

              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md"
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="w-full px-5 py-4 sm:px-6 sm:py-5 flex items-start justify-between text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-start space-x-3 flex-1 pr-4">
                      <div className="flex-shrink-0 mt-1">
                        <CategoryIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full mb-2">
                          {categoryInfo?.label}
                        </span>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">
                          {item.question}
                        </h3>
                      </div>
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  <div 
                    className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
                    `}
                  >
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
                      <div className="pl-0 sm:pl-9 border-t border-gray-100 pt-4">
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredQA.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">該当する質問が見つかりませんでした。</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 sm:p-10 text-center text-white shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              まだ質問が解決しませんか?
            </h2>
            <p className="text-base sm:text-lg mb-6 text-purple-100">
              お気軽にお問い合わせください。専門スタッフが丁寧にサポートいたします。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                トップページへ戻る
              </Link>
              <Link
                href="mailto:support@invoice-pit.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition-colors border-2 border-white/20"
              >
                お問い合わせ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">請求書ぴっと</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              芸能フリーランスと主催者をつなぐ、請求書作成・管理サービス
            </p>
            <div className="flex justify-center space-x-6 mb-6">
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                トップ
              </Link>
              <Link href="/Q&A" className="text-sm text-gray-400 hover:text-white transition-colors">
                よくある質問
              </Link>
              <a href="https://act-pit.com" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">
                ACTぴっと
              </a>
            </div>
            <p className="text-xs text-gray-500">
              © 2025 請求書ぴっと. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}