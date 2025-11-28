'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Organizer, OrganizerInvoice } from '@/types/database';
import { canUseFeature } from '@/utils/subscription'


// 差し戻しステータス表示コンポーネント
function ReturnStatusBadge({ invoiceId }: { invoiceId: string }) {
  const [returnStatus, setReturnStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReturnStatus = async () => {
      try {
        const supabase = createClient();  // ← この行を追加
        
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

export default function OrganizerInvoicesPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeatureName, setUpgradeFeatureName] = useState('');

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

  useEffect(() => {
  const supabase = createClient();
  
  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/organizer/login');
        return;
      }
      
      setUser(user);
      
      // 主催者データ取得
      const { data: organizerData, error: organizerError } = await supabase
        .from('organizers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (organizerError) {
        console.error('主催者データ取得エラー:', organizerError);
        router.push('/organizer/login');
        return;
      }

      setOrganizer(organizerData);
      
      // 請求書データ取得
      loadInvoiceData(organizerData.id);
      
    } catch (error) {
      console.error('エラー:', error);
      router.push('/organizer/login');
    } finally {
      setLoading(false);
    }
  };

  checkUser();
}, [router]);


  const loadInvoiceData = async (organizerId: string) => {
  try {
    const supabase = createClient();
    
    console.log('📄 請求書取得中...');
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('organizer_invoices')
      .select('*')
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false });

    if (invoicesError) {
      console.error('❌ 請求書取得エラー:', invoicesError);
      throw invoicesError;
    }

    console.log('✅ 請求書取得成功:', invoicesData?.length || 0, '件');
    setInvoices(invoicesData || []);

    // サブスクリプション情報を取得
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', organizerId)
      .eq('user_type', 'organizer')
      .single();

    if (!subError && subData) {
      setSubscription(subData);
      console.log('✅ サブスクリプション取得成功:', subData.plan);
    } else {
      console.log('⚠️ サブスクリプション情報なし（フリープランとして扱う）');
    }


    // 統計計算
    const pending = invoicesData?.filter(inv => inv.status === 'pending').length || 0;
    const approved = invoicesData?.filter(inv => inv.status === 'approved').length || 0;
    const paid = invoicesData?.filter(inv => inv.status === 'paid').length || 0;
    const returned = invoicesData?.filter(inv => inv.status === 'returned').length || 0;
    const totalAmount = invoicesData?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;

    setStats({ pending, approved, paid, totalAmount, returned });
    console.log('📊 統計計算完了:', { pending, approved, paid, returned, totalAmount });

  } catch (error: any) {
    console.error('❌ データ読み込みエラー:', error);
    alert('データの読み込みに失敗しました: ' + error.message);
  } finally {
    setLoading(false);
    console.log('✅ loadData完了');
  }
};


  const updateInvoiceStatus = async (invoiceId: string, newStatus: 'approved' | 'paid') => {
  if (!organizer) {
    console.error('❌ 主催者データなし');
    return;
  }

  try {
    const supabase = createClient();

    
    console.log('🔄 ステータス更新開始:', { invoiceId, newStatus });
    
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

          if (orgError) {
      console.error('❌ 更新エラー:', orgError);
      throw orgError;
    }

    console.log('✅ organizer_invoices更新成功');

    // 支払済みの場合、タレント側も更新
    if (newStatus === 'paid' && orgInvoice.invoice_id) {
      console.log('🔄 タレント側も更新中...');
      
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

        await loadInvoiceData(organizer.id);
        alert('ステータスを更新しました');

    
  } catch (error: any) {
    console.error('❌ ステータス更新エラー:', error);
    alert('更新に失敗しました: ' + error.message);
  }
};


  const handleReturn = async () => {
  if (!returnComment.trim()) {
    alert('差し戻し理由を入力してください');
    return;
  }

  if (!returningInvoiceId) return;
  
  if (!organizer) {
    console.error('❌ 主催者データなし');
    return;
  }

  setIsSubmitting(true);


  try {
    const supabase = createClient();  // ← この行を追加
    
    console.log('🔄 差し戻し開始 - returningInvoiceId:', returningInvoiceId);
    
    const { data: orgInvoiceData, error: fetchError } = await supabase

        .from('organizer_invoices')
        .select('invoice_id, status')
        .eq('id', returningInvoiceId)
        .single();

          console.log('📊 organizer_invoices データ:', orgInvoiceData);
    if (fetchError) {
      console.error('❌ 取得エラー:', fetchError);
      throw fetchError;
    }

      
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
    await loadInvoiceData(organizer.id);
    setRefreshKey(prev => prev + 1);

    alert('差し戻しが完了しました');


      } catch (error) {
    console.error('❌ 差し戻しに失敗:', error);
    alert('差し戻しに失敗しました: ' + (error as Error).message);
  } finally {
    setIsSubmitting(false);
  }
};

const handleSignOut = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  router.push('/organizer/login');
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

  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">読み込み中...</p>
      </div>
    </div>
  );
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
  <span className="text-xs sm:text-sm text-gray-900">{organizer?.name || organizer?.company_name}</span>
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
  {organizer?.organizer_code}
</p>

                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm border-2 border-green-400"
                    onClick={() => {
  if (organizer?.organizer_code) {
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
  onClick={() => {
    if (!canUseFeature(subscription?.plan || 'free', 'csv_export')) {
      setUpgradeFeatureName('CSV出力');
      setShowUpgradeModal(true);
      return;
    }
    exportToCSV();
  }}
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
    if (!canUseFeature(subscription?.plan || 'free', 'reject_function')) {
      setUpgradeFeatureName('差し戻し機能');
      setShowUpgradeModal(true);
      return;
    }
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

            {/* アップグレード促進モーダル */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              プラン機能の制限
            </h3>
            
            <p className="text-gray-600 text-center mb-6">
              <span className="font-semibold text-blue-600">{upgradeFeatureName}</span>
              は<span className="font-semibold">ベーシックプラン以上</span>の機能です。
              <br />
              アップグレードしますか?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <a
                href="/organizer/subscription"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                プランを見る
              </a>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
