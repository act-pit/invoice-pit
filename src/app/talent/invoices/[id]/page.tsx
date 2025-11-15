'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { Button } from '@/components/ui/button';

// 型定義
type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  subject?: string;
  recipient_name?: string;
  recipient_type?: 'company' | 'individual';
  recipient_address?: string;
  organizer_id?: string | null;
  items: any;
  subtotal: number;
  tax: number;
  withholding?: number;
  total: number;
};

type Profile = Database['public']['Tables']['profiles']['Row'];
type Organizer = Database['public']['Tables']['organizers']['Row'];

export default function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const supabase = createClientComponentClient<Database>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);

  // 源泉徴収を計算する関数
  const calculateWithholding = (items: any[]) => {
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      // プロフィール取得
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // 請求書取得
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('talent_id', user!.id)
        .maybeSingle();

      if (invoiceError) throw invoiceError;
      
      if (!invoiceData) {
        alert('請求書が見つかりません');
        router.push('/talent/invoices');
        return;
      }

      // itemsから源泉徴収を計算
      const calculatedWithholding = calculateWithholding(invoiceData.items || []);

      // 型変換
      const extendedInvoice: Invoice = {
        ...invoiceData,
        subject: (invoiceData as any).subject || '',
        recipient_name: invoiceData.recipient_name || '',
        recipient_type: (invoiceData as any).recipient_type || 'company',
        recipient_address: (invoiceData as any).recipient_address || '',
        organizer_id: (invoiceData as any).organizer_id || null,
        subtotal: invoiceData.subtotal,
        tax: invoiceData.tax_amount,
        withholding: calculatedWithholding,
        total: invoiceData.total_amount,
      };

      setInvoice(extendedInvoice);

      // 主催者情報取得（存在する場合）
      if (extendedInvoice.organizer_id) {
        const { data: organizerData } = await supabase
          .from('organizers')
          .select('*')
          .eq('id', extendedInvoice.organizer_id)
          .maybeSingle();
        
        if (organizerData) setOrganizer(organizerData);
      }
    } catch (error: any) {
      console.error('データ読み込みエラー:', error);
      alert('請求書の読み込みに失敗しました');
      router.push('/talent/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
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

  if (!invoice || !profile) {
    return null;
  }

  // 請求先名を取得
  const recipientName = organizer?.name || organizer?.company_name || organizer?.full_name || invoice.recipient_name || '';
  const recipientSuffix = organizer 
    ? '御中' 
    : invoice.recipient_type === 'individual' 
      ? '様' 
      : '御中';

  // 請求先住所を取得
  const recipientAddress = invoice.recipient_address || '';

  return (
    <>
      {/* 印刷用CSS */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .print-container {
            max-width: 90%;
            margin: 0 auto;
            padding: 18mm 18mm;
            box-shadow: none;
          }
          .mobile-card-view {
            display: none !important;
          }
          .desktop-table-view {
            display: table !important;
          }
          @page {
            margin: 0;
            size: A4 portrait;
          }
        }
        
        /* 画面表示用のスタイル */
        @media screen {
          .print-container {
            max-width: 100%;
            margin: 0 auto;
            padding: 1rem;
            background: white;
          }
          
          /* PC画面 */
          @media (min-width: 768px) {
            .print-container {
              max-width: 210mm;
              min-height: 297mm;
              margin: 20px auto;
              padding: 15mm 15mm;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .mobile-card-view {
              display: none !important;
            }
            .desktop-table-view {
              display: table !important;
            }
          }
          
          /* スマホ画面 */
          @media (max-width: 767px) {
            .print-container {
              padding: 1rem 0.75rem;
            }
            .mobile-card-view {
              display: block !important;
            }
            .desktop-table-view {
              display: none !important;
            }
          }
        }
      `}</style>

      {/* 画面表示時のボタン */}
      <div className="no-print bg-gray-50 py-3 sm:py-4 sticky top-0 z-50 border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex justify-between items-center gap-2">
          <Button 
            onClick={() => router.push('/talent/invoices')} 
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm"
          >
            ← 一覧に戻る
          </Button>
          <Button 
            onClick={handlePrint} 
            className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm"
            size="sm"
          >
            🖨️ 印刷・PDF保存
          </Button>
        </div>
      </div>

    {/* 印刷用コンテンツ */}
      <div className="print-container">
        {/* ヘッダー部分 */}
        <div className="mb-4 sm:mb-6">
          {/* 請求書情報 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            {/* 左側：請求書タイトル */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">請求書</h1>
            
            {/* 右側：請求書番号と日付 */}
            <div className="text-xs sm:text-sm text-left sm:text-right" style={{ lineHeight: '1.6' }}>
              <p>請求書No. : <span className="font-semibold">{invoice.invoice_number}</span></p>
              <p>請求日 : {new Date(invoice.invoice_date).toLocaleDateString('ja-JP')}</p>
            </div>
          </div>

          {/* 請求先住所 */}
          {recipientAddress && (
            <div className="mb-2">
              <div className="text-xs sm:text-sm" style={{ lineHeight: '1.5' }}>
                <p className="break-words">{recipientAddress}</p>
              </div>
            </div>
          )}

          {/* 請求先と請求元 */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-4">
            {/* 請求先 */}
            <div className="flex-1">
              {recipientName && (
                <div>
                  <p className="text-base sm:text-lg font-bold break-words">
                    {recipientName} <span className="ml-1">{recipientSuffix}</span>
                  </p>
                </div>
              )}
            </div>

            {/* 請求元情報 */}
            <div className="border border-gray-400 p-2.5 bg-gray-50 w-full sm:w-auto sm:min-w-[180px]" style={{ fontSize: '11px', lineHeight: '1.5' }}>
              <p className="font-bold mb-1.5 break-words">{profile.full_name || 'キャスト名未設定'}</p>
              {profile.postal_code && <p>〒{profile.postal_code}</p>}
              {profile.address && <p className="mb-1 break-words">{profile.address}</p>}
              {profile.email && <p className="break-all">MAIL : {profile.email}</p>}
              <p className="break-all">
                事業者番号：{profile.invoice_reg_number || '取得なし'}
              </p>
            </div>
          </div>

          {/* 固定の挨拶文 */}
          <div className="text-xs sm:text-sm mb-4 text-gray-700" style={{ lineHeight: '1.6' }}>
            <p>平素は格別のご高配を賜り、厚く御礼申し上げます。</p>
            <p>下記の件につきまして、ご請求申し上げます。</p>
            <p>ご査収のほど、よろしくお願いいたします。</p>
          </div>

          {/* 件名 */}
          <div className="mb-4">
            <p className="text-sm sm:text-base break-words">
              <span className="font-semibold">件名：</span>
              {invoice.subject || '（件名未設定）'}
            </p>
          </div>

          {/* 請求金額と支払期限 */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
            {/* 請求金額 */}
            <div className="flex-1 border-b-2 border-gray-700 pb-2">
               <div className="flex flex-row items-center justify-center gap-2 sm:gap-4">
                <p className="text-sm sm:text-base font-bold">ご請求額（税込）</p>
                <p className="text-2xl sm:text-4xl font-bold">¥ {invoice.total.toLocaleString()} -</p>
              </div>
            </div>
            
            {/* 支払期限 */}
            <div className="sm:text-right">
              {invoice.payment_due_date && (
                <p className="text-sm sm:text-base font-semibold">振込期限 ： {new Date(invoice.payment_due_date).toLocaleDateString('ja-JP')}</p>
              )}
            </div>
          </div>
        </div>

        {/* スマホ用：カード表示 */}
        <div className="mobile-card-view mb-6">
          <h3 className="text-sm font-bold mb-3 pb-2 border-b-2 border-gray-700">請求項目</h3>
          <div className="space-y-3">
            {invoice.items.map((item: any, index: number) => {
              const quantity = item.quantity || 1;
              const unitPrice = item.amount;
              const isDiscount = item.category === 'discount';
              const subtotal = quantity * unitPrice;
              const displaySubtotal = isDiscount ? -Math.abs(subtotal) : subtotal;
              const taxLabel = item.isTaxExempt ? '非課税' : item.isTaxIncluded ? '税込' : '税抜';
              const withholdingLabel = item.isWithholdingTarget ? '対象' : '対象外';

              return (
                <div key={index} className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-sm">{item.name}</p>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">No.{index + 1}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div>
                      <span className="text-gray-600">個数:</span>
                      <span className="ml-1 font-semibold">{quantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">単価:</span>
                      <span className="ml-1 font-semibold">¥{unitPrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">税区分:</span>
                      <span className="ml-1">{taxLabel}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">源泉徴収:</span>
                      <span className="ml-1">{withholdingLabel}</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="text-xs text-gray-600">金額</span>
                    <span className={`text-base font-bold ${isDiscount ? 'text-red-600' : 'text-gray-900'}`}>
                      ¥{displaySubtotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PC用：テーブル表示 */}
        <div className="desktop-table-view mb-4">
          <table className="w-full border-collapse" style={{ fontSize: '11px', width: '100%', tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-gray-700 text-white">
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '35px' }}>No</th>
                <th className="border border-gray-400 px-2 py-2 text-left">概要</th>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '50px' }}>個数</th>
                <th className="border border-gray-400 px-2 py-2 text-right" style={{ width: '85px' }}>単価</th>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '60px' }}>税区分</th>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '70px' }}>源泉徴収</th>
                <th className="border border-gray-400 px-2 py-2 text-right" style={{ width: '100px' }}>金額</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, index: number) => {
                const quantity = item.quantity || 1;
                const unitPrice = item.amount;
                const isDiscount = item.category === 'discount';
                const subtotal = quantity * unitPrice;
                const displaySubtotal = isDiscount ? -Math.abs(subtotal) : subtotal;
                const taxLabel = item.isTaxExempt ? '非課税' : item.isTaxIncluded ? '税込' : '税抜';
                const withholdingLabel = item.isWithholdingTarget ? '対象' : '対象外';

                return (
                  <tr key={index}>
                    <td className="border border-gray-300 px-2 py-2 text-center">{index + 1}</td>
                    <td className="border border-gray-300 px-2 py-2">{item.name}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center">{quantity}</td>
                    <td className="border border-gray-300 px-2 py-2 text-right">¥{unitPrice.toLocaleString()}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center text-xs">{taxLabel}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center text-xs">{withholdingLabel}</td>
                    <td className={`border border-gray-300 px-2 py-2 text-right font-semibold ${isDiscount ? 'text-red-600' : ''}`}>
                      ¥{displaySubtotal.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {invoice.items.length < 2 && (
                <tr>
                  <td className="border border-gray-300 px-2 py-2">&nbsp;</td>
                  <td className="border border-gray-300 px-2 py-2">&nbsp;</td>
                  <td className="border border-gray-300 px-2 py-2">&nbsp;</td>
                  <td className="border border-gray-300 px-2 py-2">&nbsp;</td>
                  <td className="border border-gray-300 px-2 py-2">&nbsp;</td>
                  <td className="border border-gray-300 px-2 py-2">&nbsp;</td>
                  <td className="border border-gray-300 px-2 py-2">&nbsp;</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 金額サマリー */}
        <div className="mb-6">
          <div className="w-full sm:w-1/2 sm:ml-auto">
            <div className="bg-white rounded-lg overflow-hidden border border-gray-300">
              <div className="flex justify-between items-center px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">合計</span>
                <span className="text-sm sm:text-base font-bold">¥{invoice.subtotal.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">消費税 (10%)</span>
                <span className="text-sm sm:text-base font-bold">¥{invoice.tax.toLocaleString()}</span>
              </div>
              
              {invoice.withholding && invoice.withholding > 0 && (
                <div className="flex justify-between items-center px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 bg-red-50">
                  <span className="text-xs sm:text-sm font-semibold text-red-700">源泉徴収税 (10.21%)</span>
                  <span className="text-sm sm:text-base font-bold text-red-600">-¥{invoice.withholding.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center px-3 sm:px-4 py-3 sm:py-4 bg-gray-700 text-white">
                <span className="text-sm sm:text-base font-bold">総計</span>
                <span className="text-lg sm:text-xl font-bold">¥{invoice.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 振込先情報 */}
        {(profile.bank_name || profile.account_number) && (
          <div className="mb-4 sm:mb-6">
            <div className="border border-gray-400 rounded-lg overflow-hidden">
              <div className="bg-gray-700 text-white px-3 py-2 text-center">
                <span className="text-xs sm:text-sm font-semibold">口座情報</span>
              </div>
              <div className="bg-gray-50 px-3 sm:px-4 py-3">
               <div className="text-xs sm:text-sm" style={{ lineHeight: '1.7' }}>
                 {/* 画面表示用：3行レイアウト */}
                <div className="block print:hidden">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {profile.bank_name && (
                     <span><span className="font-semibold">銀行名：</span>{profile.bank_name}</span>
                    )}
                    {(profile.branch_name || profile.bank_branch) && (
                    <span><span className="font-semibold">支店名：</span>{profile.branch_name || profile.bank_branch}</span>
                    )}
                    {profile.account_type && (
                     <span><span className="font-semibold">口座種別：</span>{profile.account_type === 'normal' ? '普通預金' : '当座預金'}</span>
                    )}
                    {profile.account_number && (
                    <span><span className="font-semibold">口座番号：</span>{profile.account_number}</span>
                    )}
                  </div>
                    {profile.account_holder && (
                    <p className="mt-1.5"><span className="font-semibold">口座名義：</span>{profile.account_holder}</p>
                    )}
                </div>

                  {/* 印刷用：2行レイアウト */}
                  <div className="hidden print:block">
                    <p>
                    {profile.bank_name && (
                    <><span className="font-semibold">銀行名：</span>{profile.bank_name}　</>
                    )}
                    {(profile.branch_name || profile.bank_branch) && (
                    <><span className="font-semibold">支店名：</span>{profile.branch_name || profile.bank_branch}　</>
                    )}
                    {profile.account_type && (
                    <><span className="font-semibold">口座種別：</span>{profile.account_type === 'normal' ? '普通預金' : '当座預金'}</>
                    )}
                    </p>
                    <p>
                    {profile.account_number && (
                    <><span className="font-semibold">口座番号：</span>{profile.account_number}　</>
                    )}
                    {profile.account_holder && (
                    <><span className="font-semibold">口座名義：</span>{profile.account_holder}</>
                    )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 備考欄 */}
        <div className="mt-4 sm:mt-6 border-t pt-3">
          <div className="text-xs sm:text-sm text-gray-600" style={{ lineHeight: '1.6' }}>
            <p className="font-semibold mb-2">備考</p>
            {invoice.notes ? (
              <div className="whitespace-pre-wrap break-words">{invoice.notes}</div>
            ) : (
              <>
                <p>恐れ入りますが、振込手数料のご負担をお願いいたします。</p>
                <p>今後とも、どうぞよろしくお願いいたします。</p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}