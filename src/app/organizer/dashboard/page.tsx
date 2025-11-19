'use client';

import { useEffect, useState } from 'react';
import { createClient, forceSignOut } from '@/lib/supabase/client'; // ← forceSignOut追加
import { useRouter } from 'next/navigation';
// import { useAuth } from '@/contexts/AuthContext'; // ← この行を削除またはコメントアウト
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Organizer, OrganizerInvoice } from '@/types/database';

// 差し戻しステータス表示コンポーネント
function ReturnStatusBadge({ invoiceId }: { invoiceId: string }) {
  const [returnStatus, setReturnStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReturnStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('return_status')
          .eq('id', invoiceId)
          .single();
        
        if (error) {
          console.error('差し戻しステータス取得エラー:', error);
          return;
        }
        
        if (data) {
          setReturnStatus(data.return_status);
        }
      } catch (err) {
        console.error('エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReturnStatus();
  }, [invoiceId]);

  if (loading) return null;
  if (!returnStatus) return null;

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      returnStatus === 'returned' ? 'bg-orange-100 text-orange-700' : 
      'bg-blue-100 text-blue-700'
    }`}>
      {returnStatus === 'returned' ? '🔄 差し戻し中' : '✅ 再提出済み'}
    </span>
  );
}

export default function OrganizerDashboardPage() {
  const router = useRouter();
  
  // ユーザー状態を自前で管理
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [invoices, setInvoices] = useState<OrganizerInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<OrganizerInvoice | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnComment, setReturnComment] = useState('');
  const [returningInvoiceId, setReturningInvoiceId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // 検索・フィルター用のstate
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'returned'>('all');
  
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    paid: 0,
    totalAmount: 0,
    returned: 0,
  });

  // ユーザー情報取得（初回のみ）
useEffect(() => {
  const getUser = async () => {
    const supabase = createClient(); // ← この行を追加
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser(); // ← supabaseClientをsupabaseに変更
      
      if (error) {
        console.error('ユーザー取得エラー:', error);
        router.push('/organizer/login');
        return;
      }

        
        if (!user) {
          router.push('/organizer/login');
          return;
        }
        
        setUser(user);
      } catch (err) {
        console.error('予期しないエラー:', err);
        router.push('/organizer/login');
      } finally {
        setAuthLoading(false);
      }
    };

    getUser();
  }, [router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/organizer/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  // ログアウト処理（強化版）
const handleSignOut = async () => {
  const supabase = createClient(); // ← この行を追加
  
  try {
    setLoading(true);
    
    // タイムアウト付きでログアウト試行（10秒）
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('ログアウトタイムアウト')), 10000)
    );
    
    const signOutPromise = supabase.auth.signOut(); // ← supabaseClientをsupabaseに変更

      
      await Promise.race([signOutPromise, timeoutPromise]);
      
      console.log('✅ 通常ログアウト成功');
      
    } catch (error) {
      console.error('⚠️ ログアウトエラー、強制クリア実行:', error);
      
      // エラー時は強制的にセッションクリア
      await forceSignOut();
    } finally {
      // 必ずログインページへ遷移
      router.push('/organizer/login');
      router.refresh();
    }
  };

  const loadData = async () => {
    try {
      const { data: organizerData, error: organizerError } = await supabase
        .from('organizers')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (organizerError) {
        if (organizerError.code === 'PGRST116') {
          router.push('/organizer/register');
          return;
        }
        throw organizerError;
      }

      setOrganizer(organizerData);

      const { data: invoicesData, error: invoicesError } = await supabase
        .from('organizer_invoices')
        .select('*')
        .eq('organizer_id', organizerData.id)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      setInvoices(invoicesData || []);

      const pending = invoicesData?.filter(inv => inv.status === 'pending').length || 0;
      const approved = invoicesData?.filter(inv => inv.status === 'approved').length || 0;
      const paid = invoicesData?.filter(inv => inv.status === 'paid').length || 0;
      const returned = invoicesData?.filter(inv => inv.status === 'returned').length || 0;
      const totalAmount = invoicesData?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;

      setStats({ pending, approved, paid, totalAmount, returned });

    } catch (error: any) {
      console.error('データ読み込みエラー:', error);
      alert('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, newStatus: 'approved' | 'paid') => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'approved') {
        updateData.approved_at = new Date().toISOString();
      } else if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { data: orgInvoice, error: orgError } = await supabase
        .from('organizer_invoices')
        .update(updateData)
        .eq('id', invoiceId)
        .select('invoice_id')
        .single();

      if (orgError) throw orgError;

      if (newStatus === 'paid' && orgInvoice.invoice_id) {
        const { error: invoiceError } = await supabase
          .from('invoices')
          .update({
            status: 'paid',
            payment_status: 'paid',
            paid_date: new Date().toISOString(),
          })
          .eq('id', orgInvoice.invoice_id);

        if (invoiceError) {
          console.error('タレント側の更新エラー:', invoiceError);
          throw invoiceError;
        }
      }

      loadData();
      alert('ステータスを更新しました');
    } catch (error: any) {
      console.error('ステータス更新エラー:', error);
      alert('更新に失敗しました');
    }
  };

  const handleReturn = async () => {
    if (!returnComment.trim()) {
      alert('差し戻し理由を入力してください');
      return;
    }

    if (!returningInvoiceId) return;

    setIsSubmitting(true);

    try {
      console.log('🔄 差し戻し開始 - returningInvoiceId:', returningInvoiceId);
      
      const { data: orgInvoiceData, error: fetchError } = await supabase
        .from('organizer_invoices')
        .select('invoice_id, status')
        .eq('id', returningInvoiceId)
        .single();

      console.log('📊 organizer_invoices データ:', orgInvoiceData);
      console.log('❌ エラー:', fetchError);

      if (fetchError) throw fetchError;
      
      if (!orgInvoiceData.invoice_id) {
        alert('関連する請求書が見つかりません');
        return;
      }

      console.log('🎯 更新対象の invoice_id:', orgInvoiceData.invoice_id);
      console.log('👤 user.id:', user?.id);

      const { data: updateResult, error: invoiceError } = await supabase
        .from('invoices')
        .update({
          return_status: 'returned',
          return_comment: returnComment,
          return_date: new Date().toISOString(),
          returned_by: user!.id,
          status: 'draft',
        })
        .eq('id', orgInvoiceData.invoice_id)
        .select();

      console.log('✅ 更新結果:', updateResult);
      console.log('❌ 更新エラー:', invoiceError);

      if (invoiceError) throw invoiceError;

      const { error: orgError } = await supabase
        .from('organizer_invoices')
        .update({
          status: 'returned',
        })
        .eq('id', returningInvoiceId);

      if (orgError) throw orgError;

      setIsReturnModalOpen(false);
      setReturnComment('');
      setReturningInvoiceId(null);
      await loadData();
      setRefreshKey(prev => prev + 1);

      alert('差し戻しが完了しました');

    } catch (error) {
      console.error('差し戻しに失敗:', error);
      alert('差し戻しに失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const exportToCSV = () => {
    if (invoices.length === 0) {
      alert('エクスポートする請求書がありません');
      return;
    }

    let csv = '請求書番号,キャスト名,メールアドレス,件名,支払期日,発行日,小計,消費税,源泉徴収,合計金額,銀行名,支店名,口座種別,口座番号,口座名義,インボイス登録番号,ステータス,承認日,支払日\n';

    invoices.forEach(invoice => {
      const statusText = 
        invoice.status === 'pending' ? '未承認' :
        invoice.status === 'approved' ? '承認済み' :
        invoice.status === 'returned' ? '差し戻し中' : '支払済み';
      
      const row = [
        invoice.invoice_number,
        invoice.cast_name,
        invoice.cast_email,
        invoice.subject || '-',
        invoice.payment_due_date || invoice.work_date || '-',
        new Date(invoice.created_at).toLocaleDateString('ja-JP'),
        invoice.subtotal,
        invoice.tax,
        invoice.withholding,
        invoice.total,
        invoice.bank_name || '-',
        invoice.branch_name || '-',
        invoice.account_type || '-',
        invoice.account_number || '-',
        invoice.account_holder || '-',
        invoice.invoice_reg_number || '-',
        statusText,
        invoice.approved_at ? new Date(invoice.approved_at).toLocaleDateString('ja-JP') : '-',
        invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString('ja-JP') : '-',
      ];
      csv += row.join(',') + '\n';
    });

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `invoices_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // フィルター・検索適用
  const filteredInvoices = invoices.filter(invoice => {
    // ステータスフィルター
    if (statusFilter !== 'all' && invoice.status !== statusFilter) {
      return false;
    }
    
    // 検索フィルター
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        invoice.cast_name.toLowerCase().includes(query) ||
        invoice.invoice_number.toLowerCase().includes(query) ||
        (invoice.subject && invoice.subject.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

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

  if (!user || !organizer) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 relative">
        <div className="absolute inset-0 bg-white/30 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          {/* ヘッダー */}
          <header className="bg-white shadow-sm border-b sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4 flex justify-between items-center">
              <h1 className="text-lg sm:text-2xl font-bold text-green-600">請求書ぴっと - 主催者</h1>
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-xs sm:text-sm text-gray-900">{organizer.name}</span>
                <Button onClick={handleSignOut} variant="outline" size="sm" className="text-xs sm:text-sm">
                  ログアウト
                </Button>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* タイトル */}
            <div className="mb-6 sm:mb-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">主催者ダッシュボード</h2>
              <p className="text-sm sm:text-base text-gray-600">受け取った請求書を管理します</p>
            </div>

            {/* 差し戻しアラート */}
            {stats.returned > 0 && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs sm:text-sm font-medium text-orange-800">
                      差し戻し中の請求書が {stats.returned} 件あります
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 主催者コード */}
            <Card className="mb-6 sm:mb-8 bg-white card-compact border-green-200">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">あなたの主催者コード</CardTitle>
                <CardDescription className="text-xs sm:text-sm">タレントにこのコードを共有してください</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-600 rounded-lg px-4 sm:px-6 py-3 sm:py-4">
                    <p className="text-2xl sm:text-3xl font-bold text-green-600 tracking-wider">
                      {organizer.organizer_code}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm border-2 border-green-400"
                    onClick={() => {
                      if (organizer.organizer_code) {
                        navigator.clipboard.writeText(organizer.organizer_code);
                        alert('コードをコピーしました！');
                      }
                    }}
                  >
                    📋 コピー
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 統計カード */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Card className="bg-white card-compact">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">未承認</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.pending}件</div>
                </CardContent>
              </Card>

              <Card className="bg-white card-compact">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">承認済み</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.approved}件</div>
                </CardContent>
              </Card>

              <Card className="bg-white card-compact">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">支払済み</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.paid}件</div>
                </CardContent>
              </Card>

              <Card className="bg-white card-compact">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">合計金額</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    ¥{stats.totalAmount.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 検索・フィルター・CSV出力 */}
            <Card className="mb-6 bg-white card-compact">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* 検索 */}
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="キャスト名・請求書番号で検索..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  {/* ステータスフィルター */}
                  <div className="w-full sm:w-auto">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">全て</option>
                      <option value="pending">未承認</option>
                      <option value="approved">承認済み</option>
                      <option value="paid">支払済み</option>
                      <option value="returned">差し戻し中</option>
                    </select>
                  </div>
                  
                  {/* CSV出力 */}
                  <Button 
                    onClick={exportToCSV} 
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm border-2 border-purple-400"
                  >
                    📊 CSV出力
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 請求書一覧 */}
            <div className="space-y-3 sm:space-y-4">
              {filteredInvoices.length === 0 ? (
                <Card className="bg-white card-compact">
                  <CardContent className="py-8 sm:py-12 text-center">
                    <p className="text-sm sm:text-base text-gray-500">
                      {invoices.length === 0 ? 'まだ請求書を受け取っていません' : '該当する請求書がありません'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredInvoices.map((invoice) => (
                  <Card key={invoice.id} className="bg-white hover:shadow-lg transition-shadow card-compact">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1">
                          <CardTitle className="text-xl sm:text-2xl">{invoice.cast_name}</CardTitle>
                          <CardDescription className="text-sm sm:text-sm">
                           {invoice.subject || '件名未設定'} - {invoice.invoice_number}
                          </CardDescription>
                        </div>
                        
                        <div className="text-left sm:text-right">
                          <div className="text-xl sm:text-2xl font-bold text-purple-600">
                            ¥{(invoice.total || 0).toLocaleString()}
                          </div>
                          <div className="flex flex-col items-start sm:items-end gap-1 mt-1">
                            <div className={`text-xs sm:text-sm font-medium ${
                              invoice.status === 'pending' ? 'text-orange-600' :
                              invoice.status === 'approved' ? 'text-blue-600' :
                              invoice.status === 'returned' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {invoice.status === 'pending' ? '未承認' :
                               invoice.status === 'approved' ? '承認済み' :
                               invoice.status === 'returned' ? '差し戻し中' : '支払済み'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-3 sm:gap-4">
                        <div className="text-sm sm:text-base">
                          <p className="text-gray-500">消費税</p>
                          <p className="font-medium">¥{(invoice.tax || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-sm sm:text-base">
                          <p className="text-gray-500">源泉徴収</p>
                          <p className="font-medium text-red-600">-¥{(invoice.withholding || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-base sm:text-lg">
                          <p className="text-gray-500 font-semibold">支払期日</p>
                          <p className="font-bold text-purple-600">
                            {invoice.payment_due_date 
                              ? new Date(invoice.payment_due_date).toLocaleDateString('ja-JP')
                              : '-'}
                          </p>
                        </div>
                      </div>
                      
                      {invoice.bank_name && (
                        <div className="bg-gray-50 p-3 sm:p-4 rounded-md text-sm sm:text-base -mx-6">
                          <p className="font-semibold mb-2 px-3">振込先情報</p>
                          <p className="px-3">
                            <span className="inline-block mr-3">{invoice.bank_name}</span>
                            <span className="inline-block mr-3">{invoice.branch_name}</span>
                            <span className="inline-block mr-3">{invoice.account_type}</span>
                            <span className="inline-block mr-3">{invoice.account_number}</span>
                            <span className="inline-block">口座名義: {invoice.account_holder}</span>
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {invoice.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => updateInvoiceStatus(invoice.id, 'approved')}
                              className="text-xs sm:text-sm border-2 border-purple-400"
                            >
                              ✅ 承認
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-xs sm:text-sm border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                              onClick={() => {
                                setReturningInvoiceId(invoice.id);
                                setIsReturnModalOpen(true);
                              }}
                            >
                              ↩️ 差し戻し
                            </Button>
                          </>
                        )}
                        {invoice.status === 'approved' && (
                          <Button 
                            size="sm" 
                            className="text-xs sm:text-sm border-2 border-green-600"
                            onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                          >
                            💰 支払済み
                          </Button>
                        )}
                        {invoice.status === 'returned' && (
                          <div className="text-xs sm:text-sm text-orange-600 font-medium px-3 py-2 bg-orange-50 rounded-md">
                            ⏳ タレントによる修正を待っています
                          </div>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs sm:text-sm border-2 border-gray-300"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          👁️ 詳細
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </main>
        </div>
      </div>

      {/* 詳細モーダル */}
      {selectedInvoice && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedInvoice(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold">請求書詳細</h2>
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3">基本情報</h3>
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                    <p><strong>請求書番号:</strong> {selectedInvoice.invoice_number}</p>
                    <p><strong>キャスト名:</strong> {selectedInvoice.cast_name}</p>
                    <p><strong>メールアドレス:</strong> {selectedInvoice.cast_email}</p>
                    <p><strong>件名:</strong> {selectedInvoice.subject || '-'}</p>
                    <p><strong>作業日:</strong> {selectedInvoice.work_date ? new Date(selectedInvoice.work_date).toLocaleDateString('ja-JP') : '-'}</p>
                    <p><strong>支払期日:</strong> {selectedInvoice.payment_due_date ? new Date(selectedInvoice.payment_due_date).toLocaleDateString('ja-JP') : '-'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3">請求項目</h3>
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-2">項目</th>
                        <th className="text-right p-2">金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items && Array.isArray(selectedInvoice.items) && selectedInvoice.items.map((item: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{item.name}</td>
                       <td className="text-right p-2">¥{item.amount.toLocaleString()}</td>
                      </tr>
                     ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3">金額</h3>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span>小計:</span>
                      <span>¥{(selectedInvoice.subtotal || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>消費税:</span>
                      <span>¥{(selectedInvoice.tax || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>源泉徴収:</span>
                      <span>-¥{(selectedInvoice.withholding || 0).toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-base sm:text-lg">
                      <span>合計:</span>
                      <span className="text-purple-600">¥{(selectedInvoice.total || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3">振込先情報</h3>
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg space-y-1 text-xs sm:text-sm">
                    <p><strong>銀行名:</strong> {selectedInvoice.bank_name || '-'}</p>
                    <p><strong>支店名:</strong> {selectedInvoice.branch_name || '-'}</p>
                    <p><strong>口座種別:</strong> {selectedInvoice.account_type || '-'}</p>
                    <p><strong>口座番号:</strong> {selectedInvoice.account_number || '-'}</p>
                    <p><strong>口座名義:</strong> {selectedInvoice.account_holder || '-'}</p>
                    {selectedInvoice.invoice_reg_number && (
                      <p><strong>インボイス登録番号:</strong> {selectedInvoice.invoice_reg_number}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 flex justify-end">
                <Button 
                  onClick={() => setSelectedInvoice(null)}
                  className="text-xs sm:text-sm border-2 border-purple-400"
                >
                  閉じる
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 差し戻しモーダル */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">請求書を差し戻す</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              差し戻し理由を入力してください。キャストはこのコメントを確認後、請求書を修正して再提出できます。
            </p>
            <textarea
              value={returnComment}
              onChange={(e) => setReturnComment(e.target.value)}
              placeholder="例：項目の内訳が不明確です。詳細を追記してください。"
              className="w-full h-24 sm:h-32 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
            />
            <div className="mt-3 sm:mt-4 flex justify-end gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
                onClick={() => {
                  setIsReturnModalOpen(false);
                  setReturnComment('');
                  setReturningInvoiceId(null);
                }}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button
                size="sm"
                className="text-xs sm:text-sm bg-orange-600 hover:bg-orange-700"
                onClick={handleReturn}
                disabled={isSubmitting || !returnComment.trim()}
              >
                {isSubmitting ? '処理中...' : '差し戻す'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
