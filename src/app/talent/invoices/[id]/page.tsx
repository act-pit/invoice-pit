'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();
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
      
      if (item.isTaxIncluded) {
        baseAmount = Math.floor(amount / 1.1);
      }
      
      return sum + Math.floor(baseAmount * 0.1021);
    }, 0);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('ユーザーが取得できませんでした');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (invoiceError) throw invoiceError;
      
      if (!invoiceData) {
        alert('請求書が見つかりません');
        router.push('/talent/invoices');
        return;
      }

      const calculatedWithholding = calculateWithholding(invoiceData.items || []);

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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            animation: 'spin 1s linear infinite', 
            borderRadius: '9999px', 
            height: '48px', 
            width: '48px', 
            borderWidth: '2px', 
            borderStyle: 'solid',
            borderColor: '#2563eb transparent transparent transparent',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '16px', color: '#4b5563' }}>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!invoice || !profile) {
    return null;
  }

  const recipientName = organizer?.name || organizer?.company_name || invoice.recipient_name || '';
  const recipientSuffix = organizer 
    ? '御中' 
    : invoice.recipient_type === 'individual' 
      ? '様' 
      : '御中';

  const recipientAddress = invoice.recipient_address || '';

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0;
            size: A4 portrait;
          }
        }
      `}</style>

      {/* 印刷ボタン */}
      <div className="no-print" style={{ 
        backgroundColor: '#f9fafb', 
        padding: '12px 0', 
        position: 'sticky', 
        top: 0, 
        zIndex: 50, 
        borderBottom: '1px solid #e5e7eb' 
      }}>
        <div style={{ 
          maxWidth: '1280px', 
          margin: '0 auto', 
          padding: '0 16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '8px' 
        }}>
          <Button 
            onClick={() => router.push('/talent/invoices')} 
            variant="outline"
            size="sm"
          >
            ← 一覧に戻る
          </Button>
          <Button 
            onClick={handlePrint} 
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            🖨️ 印刷・PDF保存
          </Button>
        </div>
      </div>

      {/* 請求書コンテンツ */}
      <div style={{ 
        maxWidth: '210mm', 
        minHeight: '297mm', 
        margin: '20px auto', 
        padding: '15mm', 
        backgroundColor: 'white', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
      }}>
        
        {/* ヘッダー */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', letterSpacing: '0.05em' }}>請求書</h1>
            <div style={{ fontSize: '13px', lineHeight: '1.6', textAlign: 'right' }}>
              <p>請求書No. : <span style={{ fontWeight: 600 }}>{invoice.invoice_number}</span></p>
              <p>請求日 : {new Date(invoice.invoice_date).toLocaleDateString('ja-JP')}</p>
            </div>
          </div>

          {recipientAddress && (
            <div style={{ marginBottom: '8px', fontSize: '13px', lineHeight: '1.5' }}>
              <p>{recipientAddress}</p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              {recipientName && (
                <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {recipientName} <span>{recipientSuffix}</span>
                </p>
              )}
            </div>

            <div style={{ 
              border: '1px solid #9ca3af', 
              padding: '10px', 
              backgroundColor: '#f9fafb', 
              minWidth: '180px',
              fontSize: '11px', 
              lineHeight: '1.5' 
            }}>
              <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>{profile.full_name || 'キャスト名未設定'}</p>
              {profile.postal_code && <p>〒{profile.postal_code}</p>}
              {profile.address && <p style={{ marginBottom: '4px' }}>{profile.address}</p>}
              {profile.email && <p>MAIL : {profile.email}</p>}
              <p>事業者番号：{profile.invoice_reg_number || '取得なし'}</p>
            </div>
          </div>

          <div style={{ fontSize: '13px', marginBottom: '16px', color: '#374151', lineHeight: '1.6' }}>
            <p>平素は格別のご高配を賜り、厚く御礼申し上げます。</p>
            <p>下記の件につきまして、ご請求申し上げます。</p>
            <p>ご査収のほど、よろしくお願いいたします。</p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '14px' }}>
              <span style={{ fontWeight: 600 }}>件名：</span>
              {invoice.subject || '（件名未設定）'}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
            <div style={{ flex: 1, borderBottom: '2px solid #374151', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <p style={{ fontSize: '14px', fontWeight: 'bold' }}>ご請求額（税込）</p>
                <p style={{ fontSize: '36px', fontWeight: 'bold' }}>¥ {invoice.total.toLocaleString()} -</p>
              </div>
            </div>
            
            {invoice.payment_due_date && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '14px', fontWeight: 600 }}>
                  振込期限 ： {new Date(invoice.payment_due_date).toLocaleDateString('ja-JP')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* テーブル */}
        <div style={{ marginBottom: '16px' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            fontSize: '11px',
            tableLayout: 'fixed'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#374151', color: 'white' }}>
                <th style={{ border: '1px solid #9ca3af', padding: '8px', textAlign: 'center', width: '35px' }}>No</th>
                <th style={{ border: '1px solid #9ca3af', padding: '8px', textAlign: 'left' }}>概要</th>
                <th style={{ border: '1px solid #9ca3af', padding: '8px', textAlign: 'center', width: '50px' }}>個数</th>
                <th style={{ border: '1px solid #9ca3af', padding: '8px', textAlign: 'right', width: '85px' }}>単価</th>
                <th style={{ border: '1px solid #9ca3af', padding: '8px', textAlign: 'center', width: '60px' }}>税区分</th>
                <th style={{ border: '1px solid #9ca3af', padding: '8px', textAlign: 'center', width: '70px' }}>源泉徴収</th>
                <th style={{ border: '1px solid #9ca3af', padding: '8px', textAlign: 'right', width: '100px' }}>金額</th>
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
                    <td style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>{item.name}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'center' }}>{quantity}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'right' }}>¥{unitPrice.toLocaleString()}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'center', fontSize: '10px' }}>{taxLabel}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'center', fontSize: '10px' }}>{withholdingLabel}</td>
                    <td style={{ 
                      border: '1px solid #d1d5db', 
                      padding: '8px', 
                      textAlign: 'right', 
                      fontWeight: 600,
                      color: isDiscount ? '#dc2626' : '#000' 
                    }}>
                      ¥{displaySubtotal.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {invoice.items.length < 2 && (
                <tr>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>&nbsp;</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 金額サマリー */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ width: '50%', marginLeft: 'auto' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d1d5db' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>合計</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>¥{invoice.subtotal.toLocaleString()}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>消費税 (10%)</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>¥{invoice.tax.toLocaleString()}</span>
              </div>
              
              {invoice.withholding && invoice.withholding > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fef2f2' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#991b1b' }}>源泉徴収税 (10.21%)</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc2626' }}>-¥{invoice.withholding.toLocaleString()}</span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#374151', color: 'white' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>総計</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>¥{invoice.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 振込先情報 */}
        {(profile.bank_name || profile.account_number) && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ border: '1px solid #9ca3af', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#374151', color: 'white', padding: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>口座情報</span>
              </div>
              <div style={{ backgroundColor: '#f9fafb', padding: '12px 16px' }}>
                <div style={{ fontSize: '13px', lineHeight: '1.7' }}>
                  <p>
                    {profile.bank_name && <><span style={{ fontWeight: 600 }}>銀行名：</span>{profile.bank_name}　</>}
                    {(profile.branch_name || profile.bank_branch) && <><span style={{ fontWeight: 600 }}>支店名：</span>{profile.branch_name || profile.bank_branch}　</>}
                    {profile.account_type && <><span style={{ fontWeight: 600 }}>口座種別：</span>{profile.account_type === 'normal' ? '普通預金' : '当座預金'}</>}
                  </p>
                  <p>
                    {profile.account_number && <><span style={{ fontWeight: 600 }}>口座番号：</span>{profile.account_number}　</>}
                    {profile.account_holder && <><span style={{ fontWeight: 600 }}>口座名義：</span>{profile.account_holder}</>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 備考欄 */}
        <div style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
          <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.6' }}>
            <p style={{ fontWeight: 600, marginBottom: '8px' }}>備考</p>
            {invoice.notes ? (
              <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{invoice.notes}</div>
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