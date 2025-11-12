'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Invoice, Profile } from '@/types/database';

// 請求書ステータス表示コンポーネント
function InvoiceStatusBadges({ invoice }: { invoice: any }) {
  const [returnStatus, setReturnStatus] = useState<string | null>(null);
  const [orgStatus, setOrgStatus] = useState<string | null>(null);
  const [organizerName, setOrganizerName] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatuses = async () => {
      // 差し戻しステータスを取得
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('return_status')
        .eq('id', invoice.id)
        .single();
      
      if (invoiceData) setReturnStatus(invoiceData.return_status);

      // 主催者側のステータスと主催者名を取得
      if (invoice.organizer_id) {
        const { data: orgData } = await supabase
          .from('organizer_invoices')
          .select('status')
          .eq('invoice_id', invoice.id)
          .single();
        
        if (orgData) setOrgStatus(orgData.status);

        // 主催者名を取得
        const { data: organizerData } = await supabase
          .from('organizers')
          .select('name')
          .eq('id', invoice.organizer_id)
          .single();
        
        if (organizerData) setOrganizerName(organizerData.name);
      }
    };

    fetchStatuses();
  }, [invoice.id, invoice.organizer_id]);

  // ステータス判定
  const isPaid = invoice.payment_status === 'paid';
  const isReturned = returnStatus === 'returned';
  const isDraft = invoice.status === 'draft' && !isReturned;
  const isApproved = orgStatus === 'approved';
  const isPendingApproval = invoice.organizer_id && orgStatus === 'pending';


  return (
  <div className="space-y-2">
    {/* 相手先表示 */}
{organizerName ? (
  <span className="inline-flex items-center text-xs px-2 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
    🏢 {organizerName}
  </span>
) : invoice.recipient_name ? (
  <span className="inline-flex items-center text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-700">
    📄 {invoice.recipient_name}
  </span>
) : null}


    {/* ステータスバッジ */}
    <div className="flex flex-wrap gap-2">

        {/* 入金済：これだけ表示 */}
        {isPaid && (
          <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">
            💰 入金済
          </span>
        )}

        {/* 入金済以外のパターン */}
        {!isPaid && (
          <>
            {/* 下書き */}
            {isDraft && (
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-700">
                📝 下書き
              </span>
            )}

            {/* 差し戻し */}
            {isReturned && (
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-orange-100 text-orange-700">
                🔄 差し戻し
              </span>
            )}

            {/* 主催者確認中 */}
            {isPendingApproval && !isReturned && (
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                👀 主催者確認中
              </span>
            )}

            {/* 承認済 + 未入金 */}
            {isApproved && !isPaid && (
              <>
                <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">
                  ✅ 承認済
                </span>
                <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">
                  ⏳ 未入金
                </span>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}


export default function InvoicesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
  totalSales: 0,
  paidAmount: 0,
  unpaidAmount: 0,
});

  // タブとフィルター状態
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');


  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadInvoices();
    }
  }, [user, authLoading, router]);

   // フィルタリング処理
  useEffect(() => {
  let result = [...invoices];

    // タブによる基本フィルター
    if (activeTab === 'pending') {
      // 要対応：差し戻しのみ
      result = result.filter(inv => inv.return_status === 'returned');
    }
    // activeTab === 'all' の場合はフィルターしない（全て表示）


        // 検索フィルター（請求書番号、件名、請求先名、主催者名で検索）
    if (searchQuery) {
      result = result.filter(invoice => 
        invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice as any).organizer_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }


    // 統計カードからの追加フィルター  ← 名称変更
    if (paymentStatusFilter !== 'all') {
      result = result.filter(inv => inv.payment_status === paymentStatusFilter);
    }

    // ソート
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        return sortOrder === 'asc' ? a.total - b.total : b.total - a.total;
      }
    });

    setFilteredInvoices(result);
    const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = invoices.filter(inv => inv.payment_status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
    const unpaidAmount = invoices.filter(inv => inv.payment_status === 'unpaid').reduce((sum, inv) => sum + inv.total, 0);

  setStats({
    totalSales,
    paidAmount,
    unpaidAmount,
  });
  }, [invoices, activeTab, searchQuery, paymentStatusFilter, sortBy, sortOrder]);  // ← activeTab追加


  const loadInvoices = async () => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 主催者情報を取得して結合
    const invoicesWithOrganizer = await Promise.all(
      (data || []).map(async (invoice) => {
        if (invoice.organizer_id) {
          const { data: organizerData } = await supabase
            .from('organizers')
            .select('name')
            .eq('id', invoice.organizer_id)
            .single();
          
          return { ...invoice, organizer_name: organizerData?.name };
        }
        return invoice;
      })
    );

    setInvoices(invoicesWithOrganizer || []);
  } catch (error: any) {
    console.error('請求書読み込みエラー:', error);
  } finally {
    setLoading(false);
  }
};


  // 入金ステータスを切り替え
  const togglePaymentStatus = async (invoice: Invoice) => {
    const newStatus = invoice.payment_status === 'paid' ? 'unpaid' : 'paid';
    const paidDate = newStatus === 'paid' ? new Date().toISOString() : null;

    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          payment_status: newStatus,
          paid_date: paidDate,
        })
        .eq('id', invoice.id);

      if (error) throw error;

      // ローカル状態を更新
      setInvoices(invoices.map(inv =>
        inv.id === invoice.id
          ? { ...inv, payment_status: newStatus, paid_date: paidDate }
          : inv
      ));
    } catch (error: any) {
      console.error('ステータス更新エラー:', error);
      alert('ステータスの更新に失敗しました');
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm('この請求書を削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInvoices(invoices.filter(inv => inv.id !== id));
      alert('削除しました');
    } catch (error: any) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4 flex justify-between items-center">
          <h1 className="text-lg sm:text-2xl font-bold text-purple-600">請求書ぴっと</h1>
          <Button onClick={() => router.push('/dashboard')} variant="outline" size="sm" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">← ダッシュボードに戻る</span>
            <span className="sm:hidden">← ダッシュボードに戻る</span>
          </Button>
        </div>
      </header>


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4 sm:mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">請求書一覧</h2>
            <p className="text-xs sm:text-base text-gray-600 hidden sm:block">作成した請求書を確認できます</p>
          </div>
          <Link href="/invoices/create">
            <Button size="sm" className="text-xs sm:text-base px-3 sm:px-4">
              <span className="hidden sm:inline">+ 新規作成</span>
              <span className="sm:hidden">+</span>
            </Button>
          </Link>
        </div>


        {/* タブ切り替え */}
        <div className="mb-4 sm:mb-6">
          {/* 差し戻しがある場合のみタブを表示 */}
          {invoices.some(inv => inv.return_status === 'returned') ? (
            <div className="flex gap-1 sm:gap-2 bg-white rounded-lg p-1 shadow-sm border">
              {/* 要対応タブ（差し戻しあり時のみ） */}
              <button
                onClick={() => {
                  setActiveTab('pending');
                  setPaymentStatusFilter('all');
                }}
                className={`flex-1 px-2 sm:px-6 py-2 sm:py-3 rounded-md font-medium transition-all text-xs sm:text-base ${
                  activeTab === 'pending'
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-base sm:text-lg">🔴</span>
                    <span>要対応</span>
                  </div>
                  <span className="text-xs opacity-90">({invoices.filter(inv => inv.return_status === 'returned').length})</span>
                </div>
              </button>

              {/* すべてタブ */}
              <button
                onClick={() => {
                  setActiveTab('all');
                  setPaymentStatusFilter('all');
                }}
                className={`flex-1 px-2 sm:px-6 py-2 sm:py-3 rounded-md font-medium transition-all text-xs sm:text-base ${
                  activeTab === 'all'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-base sm:text-lg">📋</span>
                    <span>すべて</span>
                  </div>
                  <span className="text-xs opacity-90">({invoices.length})</span>
                </div>
              </button>
            </div>
          ) : (
            // 差し戻しがない場合はタブなし
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <div className="text-sm text-gray-700 font-medium flex items-center gap-2">
                <span className="text-lg">📋</span>
                <span>すべての請求書</span>
                <span className="text-xs text-gray-500">({invoices.length}件)</span>
              </div>
            </div>
          )}
        </div>



        {/* 検索ボックス */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="請求書番号、請求先名等で検索..."
                className="w-full px-4 py-2 pl-9 sm:pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          </CardContent>
        </Card>


        {/* 売上統計カード（縦並び版） */}
        <div className="mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-3">
            {/* 総売上 */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="py-2 px-3 sm:pt-4 sm:pb-3 sm:px-3">
                <div className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-start">
                  <p className="text-xs sm:text-xs font-medium text-purple-700 sm:mb-1">📊 総売上</p>
                  <div className="text-right sm:text-left">
                    <p className="text-sm sm:text-xl font-bold text-purple-900">
                      ¥{stats.totalSales.toLocaleString()}
                    </p>
                    <p className="text-xs sm:text-xs text-purple-600">
                      {invoices.length}件
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 未入金 */}
            <Card 
              className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setPaymentStatusFilter('unpaid')}
            >
              <CardContent className="py-2 px-3 sm:pt-4 sm:pb-3 sm:px-3">
                <div className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-start">
                  <p className="text-xs sm:text-xs font-medium text-yellow-700 sm:mb-1">⏳ 未入金</p>
                  <div className="text-right sm:text-left">
                    <p className="text-sm sm:text-xl font-bold text-yellow-900">
                      ¥{stats.unpaidAmount.toLocaleString()}
                    </p>
                    <p className="text-xs sm:text-xs text-yellow-600">
                      {invoices.filter(inv => inv.payment_status === 'unpaid').length}件
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 入金済 */}
            <Card 
              className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setPaymentStatusFilter('paid')}
            >
              <CardContent className="py-2 px-3 sm:pt-4 sm:pb-3 sm:px-3">
                <div className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-start">
                  <p className="text-xs sm:text-xs font-medium text-green-700 sm:mb-1">💰 入金済</p>
                  <div className="text-right sm:text-left">
                    <p className="text-sm sm:text-xl font-bold text-green-900">
                      ¥{stats.paidAmount.toLocaleString()}
                    </p>
                    <p className="text-xs sm:text-xs text-green-600">
                      {invoices.filter(inv => inv.payment_status === 'paid').length}件
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* クリアボタン */}
          {paymentStatusFilter !== 'all' && (
            <div className="flex justify-center">
              <button
                onClick={() => setPaymentStatusFilter('all')}
                className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors flex items-center gap-1"
              >
                <span>✕</span>
                <span>絞り込みをクリア</span>
              </button>
            </div>
          )}
        </div>


        {/* フィルター・ソート */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
            {/* スマホ用：折りたたみ式 */}
            <details className="sm:hidden mb-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span>🔍 詳細検索・並び替え</span>
                <span className="text-xs text-gray-500">タップして展開 ▼</span>
              </summary>
              <div className="mt-3 space-y-3 px-1">
                {/* スマホ用：縦並び */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">入金ステータス</label>
                  <select
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value as 'all' | 'unpaid' | 'paid')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="all">すべて</option>
                    <option value="unpaid">未入金</option>
                    <option value="paid">入金済</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">並び替え</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="date">作成日順</option>
                    <option value="amount">金額順</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">順序</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="desc">{sortBy === 'date' ? '新しい順' : '高い順'}</option>
                    <option value="asc">{sortBy === 'date' ? '古い順' : '低い順'}</option>
                  </select>
                </div>
              </div>
            </details>

            {/* PC用：横並び */}
            <div className="hidden sm:grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">入金ステータス</label>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value as 'all' | 'unpaid' | 'paid')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">すべて</option>
                  <option value="unpaid">未入金</option>
                  <option value="paid">入金済</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">並び替え</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="date">作成日順</option>
                  <option value="amount">金額順</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">順序</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="desc">{sortBy === 'date' ? '新しい順' : '高い順'}</option>
                  <option value="asc">{sortBy === 'date' ? '古い順' : '低い順'}</option>
                </select>
              </div>
            </div>

            {/* 絞り込み結果 */}
            <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
              <span className="font-medium">{activeTab === 'pending' ? '🔴 要対応（差し戻し）' : '📋 すべて'}</span>
              {' '}：{filteredInvoices.length}件の請求書を表示中
              {paymentStatusFilter !== 'all' && ` (${paymentStatusFilter === 'paid' ? '入金済' : '未入金'}で絞り込み中)`}
            </div>

          </CardContent>
        </Card>


        {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">
                {invoices.length === 0 
                  ? 'まだ請求書がありません' 
                  : '条件に一致する請求書がありません'}
              </p>
              {invoices.length === 0 && (
                <Link href="/invoices/create">
                  <Button>最初の請求書を作成</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {filteredInvoices.map((invoice) => (
              <Card 
              key={invoice.id} 
              className={`hover:shadow-lg transition-shadow ${
                invoice.organizer_id ? 'border-l-4 border-l-purple-500 bg-purple-50/30' : ''
              }`}
              >

                <CardHeader className="pb-3 sm:pb-6">
                  {/* スマホ用：縦レイアウト */}
                  <div className="sm:hidden space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{invoice.subject || '件名未設定'}</CardTitle>
                        <CardDescription className="text-xs">
                          {invoice.invoice_number}
                        </CardDescription>
                      </div>

                      <button
                        onClick={() => togglePaymentStatus(invoice)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
                          invoice.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        {invoice.payment_status === 'paid' ? '✓ 入金済' : '◯ 未入金'}
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-xl font-bold text-purple-600">
                        ¥{invoice.total.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(invoice.created_at).toLocaleDateString('ja-JP')}
                      </div>
                    </div>

                    {invoice.paid_date && (
                      <div className="text-xs text-green-600">
                        入金: {new Date(invoice.paid_date).toLocaleDateString('ja-JP')}
                      </div>
                    )}

                    <InvoiceStatusBadges invoice={invoice} />
                  </div>

                  {/* PC用：横レイアウト */}
                  <div className="hidden sm:flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div>
                        <CardTitle className="text-lg">{invoice.subject || '件名未設定'}</CardTitle>
                        <CardDescription>
                          {invoice.invoice_number}
                        </CardDescription>
                      </div>

                      <button
                        onClick={() => togglePaymentStatus(invoice)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          invoice.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        {invoice.payment_status === 'paid' ? '✓ 入金済' : '◯ 未入金'}
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">
                        ¥{invoice.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(invoice.created_at).toLocaleDateString('ja-JP')}
                      </div>
                      {invoice.paid_date && (
                        <div className="text-xs text-green-600 mt-1">
                          入金: {new Date(invoice.paid_date).toLocaleDateString('ja-JP')}
                        </div>
                      )}
                      <InvoiceStatusBadges invoice={invoice} />
                    </div>
                  </div>
                </CardHeader>


                <CardContent className="pt-0">
                  {/* スマホ・PC共通：3項目を横並び */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">消費税</p>
                      <p className="text-sm sm:text-base font-medium">¥{invoice.tax.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">源泉徴収</p>
                      <p className="text-sm sm:text-base font-medium text-red-600">-¥{invoice.withholding.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">支払期日</p>
                      <p className="text-sm sm:text-base font-medium">
                        {invoice.payment_due_date 
                          ? new Date(invoice.payment_due_date).toLocaleDateString('ja-JP')
                          : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <Link href={`/invoices/${invoice.id}`}>
                      <Button size="sm" variant="outline" className="text-xs h-8">
                        🖨️ 印刷・PDF保存
                      </Button>
                    </Link>
                    <Link href={`/invoices/${invoice.id}/edit`}>
                      <Button size="sm" variant="outline" className="text-xs h-8">
                        ✏️ 編集
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 text-xs h-8"
                      onClick={() => deleteInvoice(invoice.id)}
                    >
                      🗑️ 削除
                    </Button>
                  </div>
                </CardContent>

              </Card>
            ))}
          </div>
        )}
        
      </main>
    </div>
  );
}