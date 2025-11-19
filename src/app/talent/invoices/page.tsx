'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// 型定義
type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  organizer_name?: string;
  return_status?: string | null;
  payment_status?: 'paid' | 'unpaid';
  paid_date?: string | null;
  organizer_id?: string | null;
  withholding?: number;
  status?: 'pending' | 'approved' | 'paid' | 'returned' | 'draft';
};


// 源泉徴収を計算する関数
const calculateWithholding = (items: any[]) => {
  if (!items || !Array.isArray(items)) return 0;
  
  return items.reduce((sum, item) => {
    if (!item.isWithholdingTarget) return sum;
    
    const quantity = item.quantity || 1;
    let amount = item.amount * quantity;
    
    if (item.category === 'discount') {
      amount = -Math.abs(amount);
    }
    
    let baseAmount = amount;
    
    // 税込の場合は税抜に戻す
    if (item.isTaxIncluded) {
      baseAmount = Math.floor(amount / 1.1);
    }
    
    return sum + Math.floor(baseAmount * 0.1021);
  }, 0);
};

// 請求書ステータス表示コンポーネント
function InvoiceStatusBadges({ invoice }: { invoice: Invoice }) {
  // すでに invoice に含まれているデータを直接使用
  const isPaid = invoice.payment_status === 'paid';
  const isReturned = invoice.return_status === 'returned';
  const isApproved = invoice.status === 'approved';
  const isPendingApproval = invoice.organizer_id && invoice.status === 'pending';

  return (
  <div className="space-y-2">
    {/* 相手先表示 */}
    {invoice.organizer_name ? (
    <span className="inline-flex items-center text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
      🏢 {invoice.organizer_name}
    </span>
    ) : invoice.recipient_name ? (
    <span className="inline-flex items-center text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-700">
      📄 {invoice.recipient_name}
    </span>
    ) : null}


    {/* ステータスバッジ */}
  <div className="flex flex-wrap gap-2">
    {/* 入金済以外のパターン */}
    {!isPaid && (
      <>
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
  const supabase = createClient();
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);

useEffect(() => {
  loadInvoices();
}, []);


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
        (invoice as any).subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
        return sortOrder === 'asc' ? a.total_amount - b.total_amount : b.total_amount - a.total_amount;
      }
    });

    setFilteredInvoices(result);
    const totalSales = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const paidAmount = invoices.filter(inv => inv.payment_status === 'paid').reduce((sum, inv) => sum + inv.total_amount, 0);
    const unpaidAmount = invoices.filter(inv => inv.payment_status === 'unpaid').reduce((sum, inv) => sum + inv.total_amount, 0);

  setStats({
    totalSales,
    paidAmount,
    unpaidAmount,
  });
  }, [invoices, activeTab, searchQuery, paymentStatusFilter, sortBy, sortOrder]);  // ← activeTab追加

  // 編集可能かどうかを判定
  const canEditInvoice = (invoice: Invoice): boolean => {
    // 主催者連携していない場合は常に編集可能
    if (!invoice.organizer_id) return true;
    
    // 入金済みの場合は編集不可
    if (invoice.payment_status === 'paid') return false;
    
    // 差し戻しの場合は編集可能
    if (invoice.return_status === 'returned') return true;
    
    // それ以外（主催者確認中）は編集不可
    return false;
  };

  const loadInvoices = async () => {
  try {
    console.log('🔵 [loadInvoices] 開始');
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('🔵 [loadInvoices] User:', user ? 'あり' : 'なし');
    
    if (!user) {
      console.error('❌ [loadInvoices] ユーザーが取得できませんでした');
      setLoading(false);
      return;
    }

    console.log('🔵 [loadInvoices] User ID:', user.id);

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    console.log('🔵 [loadInvoices] データ取得結果:', data ? `${data.length}件` : 'なし', 'エラー:', error);

    if (error) throw error;

    console.log('🔵 [loadInvoices] 主催者情報取得開始');

    // 主催者情報を取得して結合 + 源泉徴収を計算
    const invoicesWithOrganizer = await Promise.all(
      (data || []).map(async (invoice) => {
          console.log('🔵 [loadInvoices] 処理中:', invoice.invoice_number);

        // 源泉徴収を計算
        const calculatedWithholding = calculateWithholding(invoice.items || []);

        const extendedInvoice: Invoice = {
          ...invoice,
          payment_status: (invoice as any).payment_status || 'unpaid',
          paid_date: (invoice as any).paid_date || null,
          return_status: (invoice as any).return_status || null,
          organizer_id: (invoice as any).organizer_id || null,
          withholding: calculatedWithholding,
          status: 'draft', // デフォルト値
        };

        if (extendedInvoice.organizer_id) {
            console.log('🔵 [loadInvoices] 主催者ID:', extendedInvoice.organizer_id);

          // 主催者情報を取得
          const { data: organizerData } = await supabase
            .from('organizers')
            .select('*')
            .eq('id', extendedInvoice.organizer_id)
            .maybeSingle();
          
          if (organizerData) {
            extendedInvoice.organizer_name = organizerData.name || organizerData.company_name || undefined;
          }

          // 主催者側のステータスを取得
          const { data: orgInvoiceData } = await supabase
            .from('organizer_invoices')
            .select('status')
            .eq('invoice_id', invoice.id)
            .maybeSingle();
          
          if (orgInvoiceData) {
            extendedInvoice.status = orgInvoiceData.status;
          }
        }
          console.log('🟢 [loadInvoices] 完了:', invoice.invoice_number);

        return extendedInvoice;
      })
    );
console.log('🟢 [loadInvoices] 全件処理完了:', invoicesWithOrganizer.length, '件');

console.log('🔵 [loadInvoices] setInvoices 実行前');
    setInvoices(invoicesWithOrganizer || []);
    console.log('🔵 [loadInvoices] setInvoices 実行後');
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
        } as any)
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

  const openDeleteModal = (id: string) => {
  setDeletingInvoiceId(id);
  setDeleteModalOpen(true);
};

const deleteInvoice = async () => {
  if (!deletingInvoiceId) return;

  try {
    // 主催者側のデータも削除
    const { error: orgError } = await supabase
      .from('organizer_invoices')
      .delete()
      .eq('invoice_id', deletingInvoiceId);

    if (orgError && orgError.code !== 'PGRST116') {
      console.error('主催者側データ削除エラー:', orgError);
    }

    // タレント側のデータを削除
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', deletingInvoiceId);

    if (error) throw error;

    // UIから削除
    setInvoices(invoices.filter(inv => inv.id !== deletingInvoiceId));
    alert('削除しました');
    setDeleteModalOpen(false);
    setDeletingInvoiceId(null);
  } catch (error: any) {
    console.error('削除エラー:', error);
    alert('削除に失敗しました');
  }
};

  if (loading) {  // authLoading を削除
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">読み込み中...</p>
      </div>
    </div>
  );
}


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4 flex justify-between items-center">
          <h1 className="text-lg sm:text-2xl font-bold text-blue-600">請求書ぴっと</h1>
          <Button onClick={() => router.push('/talent/dashboard')} variant="outline" size="sm" className="text-xs sm:text-sm">
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
          <Link href="/talent/invoices/create">
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
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
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
                className="w-full px-4 py-2 pl-9 sm:pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="py-2 px-3 sm:pt-4 sm:pb-3 sm:px-3">
                <div className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-start">
                  <p className="text-xs sm:text-xs font-medium text-blue-700 sm:mb-1">📊 総売上</p>
                  <div className="text-right sm:text-left">
                    <p className="text-sm sm:text-xl font-bold text-blue-900">
                      ¥{stats.totalSales.toLocaleString()}
                    </p>
                    <p className="text-xs sm:text-xs text-blue-600">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <Link href="/talent/invoices/create">
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
    invoice.return_status === 'returned'
      ? 'bg-red-50/50 border-l-4 border-l-red-500'  // 差し戻し：赤
      : invoice.payment_status === 'unpaid'
        ? 'bg-yellow-50/50 border-l-4 border-l-yellow-400'  // 未入金：黄色
        : (invoice.payment_status === 'paid' || invoice.organizer_id)
          ? 'border-l-4 border-l-blue-500 bg-blue-50/30'  // 入金済または主催者連携：青
          : ''  // それ以外：スタイルなし
  }`}
>


       <CardHeader className="pb-2 sm:pb-3">
            {/* スマホ用：縦レイアウト */}
          <div className="sm:hidden space-y-2">
            {/* 入金済ボタンを右上に */}
          <div className="flex justify-end">
            <button
             onClick={() => togglePaymentStatus(invoice)}
              className={`px-5 py-1 rounded-full text-xs font-semibold transition-all shadow-sm flex items-center gap-1 ${
                invoice.payment_status === 'paid'
                  ? 'bg-green-100 text-green-800 hover:bg-green-200 hover:shadow-md'
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:shadow-md border-1 border-yellow-300'
              }`}
            >
              {invoice.payment_status === 'paid' ? (
                <>
                  <span>✓</span>
                  <span>入金済</span>
                </>
              ) : (
                <>
                  <span>👉 未入金</span>
                </>
              )}
            </button>
          </div>


            {/* 件名を下に配置 */}
            <div>
              <CardTitle className="text-base">{(invoice as any).subject || '件名未設定'}</CardTitle>
              <CardDescription className="text-xs">
                {invoice.invoice_number}
              </CardDescription>
            </div>
  
            <div className="flex justify-between items-center">
              <div className="text-xl font-bold text-blue-600">
                ¥{invoice.total_amount.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 text-right">
                <div>{new Date(invoice.created_at).toLocaleDateString('ja-JP')}</div>
                {invoice.paid_date && (
                  <div className="text-green-600 mt-0.5">
                    入金: {new Date(invoice.paid_date).toLocaleDateString('ja-JP')}
                  </div>
                )}
              </div>
            </div>

            <InvoiceStatusBadges invoice={invoice} />
          </div>


            {/* PC用：横レイアウト */}
        <div className="hidden sm:block">
            {/* 入金済ボタンを右上に */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => togglePaymentStatus(invoice)}
              className={`px-5 py-1 rounded-full text-xs font-semibold transition-all shadow-sm flex items-center gap-1 ${
                invoice.payment_status === 'paid'
                  ? 'bg-green-100 text-green-800 hover:bg-green-200 hover:shadow-md'
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:shadow-md border-1 border-yellow-300'
              }`}
             >
              {invoice.payment_status === 'paid' ? (
                <>
                  <span>✓</span>
                  <span>入金済</span>
                </>
              ) : (
                <>
                  <span>◯ 未入金</span>
                </>
              )}
            </button>
          </div>


            {/* 件名と金額を横並び */}
          <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg">{(invoice as any).subject || '件名未設定'}</CardTitle>
                <CardDescription>
                  {invoice.invoice_number}
                </CardDescription>
              </div>
              <div className="text-right ml-4">
            <div className="text-2xl font-bold text-blue-600">
              ¥{invoice.total_amount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(invoice.created_at).toLocaleDateString('ja-JP')}
              {invoice.paid_date && (
                <span className="text-xs text-green-600 ml-2">
                  入金: {new Date(invoice.paid_date).toLocaleDateString('ja-JP')}
                </span>
              )}
            </div>
            <InvoiceStatusBadges invoice={invoice} />
            </div>

          </div>
        </div>
      </CardHeader>

                <CardContent className="pt-0">
                  {/* スマホ・PC共通：3項目を横並び */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-2 sm:mb-3">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">消費税</p>
                      <p className="text-sm sm:text-base font-medium">¥{invoice.tax_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">源泉徴収</p>
                      <p className="text-sm sm:text-base font-medium text-red-600">-¥{(invoice.withholding || 0).toLocaleString()}</p>
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
                    <Link href={`/talent/invoices/${invoice.id}`}>
                      <Button size="sm" variant="outline" className="text-xs h-8">
                        🖨️ 印刷・PDF保存
                      </Button>
                    </Link>
                    {canEditInvoice(invoice) ? (
                      <Link href={`/talent/invoices/${invoice.id}/edit`}>
                       <Button size="sm" variant="outline" className="text-xs h-8">
                         ✏️ 編集
                       </Button>
                     </Link>
                   ) : (
                      <Button 
                       size="sm" 
                       variant="outline" 
                       className="text-xs h-8 opacity-50 cursor-not-allowed"
                       onClick={(e) => {
                         e.preventDefault();
                         if (invoice.payment_status === 'paid') {
                           alert('入金済みのため、編集できません。');
                         } else {
                           alert('ただいま主催者確認中のため、編集できません。');
                         }
                       }}
                       >
                        🔒 編集不可
                      </Button>
                    )}

                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 text-xs h-8"
                        onClick={() => openDeleteModal(invoice.id)}
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

            {/* 削除確認モーダル */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0">
                <svg className="h-12 w-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  請求書を削除
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  この請求書を削除しますか？
                </p>
                <p className="text-sm text-red-600 font-medium">
                  ⚠️ この操作は取り消せません。
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeletingInvoiceId(null);
                }}
              >
                キャンセル
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={deleteInvoice}
              >
                削除する
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}