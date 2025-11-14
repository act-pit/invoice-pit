'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import type { Invoice, Profile, Organizer } from '@/types/database';

export default function InvoicePrintPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, router, invoiceId]);

  const loadData = async () => {
    try {
      // プロフィール取得
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // 請求書取得
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', user!.id)
        .single();

      if (invoiceError) throw invoiceError;
      setInvoice(invoiceData);

      // 主催者情報取得（存在する場合）
      if (invoiceData.organizer_id) {
        const { data: organizerData } = await supabase
          .from('organizers')
          .select('*')
          .eq('id', invoiceData.organizer_id)
          .single();
        
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
  const recipientName = organizer?.name || invoice.recipient_name || '';
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
            max-width: 100%;
            margin: 0;
            padding: 12mm 15mm;
            box-shadow: none;
          }
          @page {
            margin: 0;
            size: A4 portrait;
          }
        }
        @media screen {
          .print-container {
            max-width: 210mm;
            min-height: 297mm;
            margin: 20px auto;
            padding: 12mm 15mm;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      {/* 画面表示時のボタン */}
      <div className="no-print bg-gray-50 py-4 sticky top-0 z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <Button onClick={() => router.push('/talent/invoices')} variant="outline">
            ← 一覧に戻る
          </Button>
          <Button onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700">
            🖨️ 印刷・PDF保存
          </Button>
        </div>
      </div>

      {/* 印刷用コンテンツ */}
      <div className="print-container">
        {/* ヘッダー部分 */}
        <div className="mb-4">
          {/* 請求先住所と請求書情報 */}
          <div className="flex justify-between items-start mb-4">
            <div className="text-xs" style={{ lineHeight: '1.5', minHeight: '35px' }}>
              {recipientAddress && <p>{recipientAddress}</p>}
            </div>
            
            <div className="text-right">
              <h1 className="text-3xl font-bold mb-2 tracking-wide">請求書</h1>
              <div className="text-xs" style={{ lineHeight: '1.6' }}>
                <p>請求書No. : <span className="font-semibold">{invoice.invoice_number}</span></p>
                <p>請求日 : {new Date(invoice.created_at).toLocaleDateString('ja-JP')}</p>
              </div>
            </div>
          </div>

          {/* 請求先と請求元 */}
          <div className="flex justify-between items-start mb-4">
            {/* 請求先 */}
            <div className="flex-1">
              {recipientName && (
                <div>
                  <p className="text-base font-bold">
                    {recipientName} <span className="ml-1">{recipientSuffix}</span>
                  </p>
                </div>
              )}
            </div>

            {/* 請求元情報 */}
            <div className="border border-gray-400 p-2.5 bg-gray-50" style={{ minWidth: '180px', fontSize: '11px', lineHeight: '1.5' }}>
              <p className="font-bold mb-1.5">{profile.full_name || 'キャスト名未設定'}</p>
              {profile.postal_code && <p>〒{profile.postal_code}</p>}
              {profile.address && <p className="mb-1">{profile.address}</p>}
              {profile.email && <p>MAIL : {profile.email}</p>}
              {profile.invoice_reg_number && (
                <p>事業者番号：{profile.invoice_reg_number}</p>
              )}
            </div>
          </div>

          {/* 固定の挨拶文（2行） */}
          <div className="text-xs mb-4 text-gray-700" style={{ lineHeight: '1.6' }}>
            <p>平素は格別のご高配を賜り、厚く御礼申し上げます。</p>
            <p>下記の件につきまして、ご請求申し上げます。ご査収のほど、よろしくお願いいたします。</p>
          </div>

          {/* 件名 */}
          <div className="mb-4">
            <p className="text-sm">
              <span className="font-semibold">件名：</span>
              {invoice.subject || '（件名未設定）'}
            </p>
          </div>

          {/* 請求金額と支払期限（左右レイアウト） */}
          <div className="flex justify-between items-center mb-4">
            {/* 左側：請求金額 */}
            <div className="flex-1 border-b-2 border-gray-700 pb-2">
              <div className="flex items-center">
                <p className="text-base font-bold mr-4">ご請求額（税込）</p>
                <p className="text-xl font-bold">¥ {invoice.total.toLocaleString()} -</p>
              </div>
            </div>
            
            {/* 右側：支払期限 */}
            <div className="text-right" style={{ minWidth: '200px' }}>
              {invoice.payment_due_date && (
                <p className="text-sm">振込期限 ： {new Date(invoice.payment_due_date).toLocaleDateString('ja-JP')}</p>
              )}
            </div>
          </div>
        </div>

        {/* 請求項目テーブル */}
        <div className="mb-4">
          <table className="w-full border-collapse" style={{ fontSize: '11px' }}>

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
  
  // 税区分
  const taxLabel = item.isTaxExempt ? '非課税' : item.isTaxIncluded ? '税込' : '税抜';
  
  // 源泉徴収
  const withholdingLabel = item.isWithholdingTarget ? '対象' : '対象外';

  return (
    <tr key={index}>
      <td className="border border-gray-300 px-2 py-2 text-center">{index + 1}</td>
      <td className="border border-gray-300 px-2 py-2">{item.name}</td>
      <td className="border border-gray-300 px-2 py-2 text-center">{quantity}</td>
      <td className="border border-gray-300 px-2 py-2 text-right">
        ¥{unitPrice.toLocaleString()}
      </td>
      <td className="border border-gray-300 px-2 py-2 text-center text-xs">
        {taxLabel}
      </td>
      <td className="border border-gray-300 px-2 py-2 text-center text-xs">
        {withholdingLabel}
      </td>
      <td className={`border border-gray-300 px-2 py-2 text-right font-semibold ${isDiscount ? 'text-red-600' : ''}`}>
        ¥{displaySubtotal.toLocaleString()}
      </td>
    </tr>
  );
})}

              {/* 空行を1行追加 */}
              {invoice.items.length < 2 && (
  <tr>
    <td className="border border-gray-300 px-2 py-2 text-center">&nbsp;</td>
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

        {/* 金額サマリー（右半分） */}
        <div className="flex justify-end mb-4">
          <div style={{ width: '50%' }}>
            <table className="w-full border-collapse" style={{ fontSize: '11px' }}>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold">合計</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">¥{invoice.subtotal.toLocaleString()}</td>
                </tr>
                <tr>
  <td className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold">
    消費税 (10%)
  </td>
  <td className="border border-gray-300 px-3 py-2 text-right">¥{invoice.tax.toLocaleString()}</td>
</tr>
{invoice.withholding > 0 && (
  <tr>
    <td className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold">
      源泉徴収税 (10.21%)
    </td>
    <td className="border border-gray-300 px-3 py-2 text-right text-red-600 font-semibold">
      -¥{invoice.withholding.toLocaleString()}
    </td>
  </tr>
)}

                <tr>
                  <td className="border border-gray-300 px-3 py-2 bg-gray-700 text-white font-bold">総計</td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-bold">¥{invoice.total.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 振込先情報 */}
        {(profile.bank_name || profile.account_number) && (
          <div className="mb-4">
            <table className="w-full border-collapse" style={{ fontSize: '11px' }}>
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-3 py-2.5 bg-gray-700 text-white font-semibold text-center" style={{ width: '90px' }}>
                    口座情報
                  </td>
                  <td className="border border-gray-400 px-3 py-2.5 bg-gray-50">
                    <div style={{ lineHeight: '1.7' }}>
                      {profile.bank_name && (
                        <span className="mr-4"><span className="font-semibold">銀行名</span>：{profile.bank_name}</span>
                      )}
                      {profile.branch_name && (
                        <span className="mr-4"><span className="font-semibold">支店名</span>：{profile.branch_name}</span>
                      )}
                      {profile.account_type && (
                        <span className="mr-4"><span className="font-semibold">口座種別</span>：{profile.account_type === 'normal' ? '普通預金' : '当座預金'}</span>
                      )}
                      <br />
                      {profile.account_number && (
                        <span className="mr-4"><span className="font-semibold">口座番号</span>：{profile.account_number}</span>
                      )}
                      {profile.account_holder && (
                        <span><span className="font-semibold">口座名義</span>：{profile.account_holder}</span>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 備考欄（フッター） */}
        <div className="mt-4 border-t pt-3">
          <div className="text-xs text-gray-600" style={{ lineHeight: '1.6' }}>
            <p className="font-semibold mb-1.5">備考</p>
            <p>恐れ入りますが、振込手数料のご負担をお願いいたします。</p>
            <p>今後とも、どうぞよろしくお願いいたします。</p>
          </div>
        </div>
      </div>
    </>
  );
}
