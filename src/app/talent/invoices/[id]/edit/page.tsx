'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceItem, Organizer } from '@/types/database';
import { INVOICE_CATEGORIES, getCategoryById } from '@/lib/invoice-categories';

export default function EditInvoicePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [invoice, setInvoice] = useState(null as any);

  // フォームの状態
  const [projectName, setProjectName] = useState('');
  const [workDate, setWorkDate] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [subject, setSubject] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      name: '',
      quantity: 1,
      amount: 0,
      category: '',
      isTaxIncluded: false,
      isWithholdingTarget: false,
      isTaxExempt: false,
    }
  ]);
  const taxRate = 10; // 消費税率を10%固定
  const [notes, setNotes] = useState('平素は格別のご高配を賜り、厚く御礼申し上げます。\n下記の件につきまして、ご請求申し上げます。\nご査収のほど、よろしくお願いいたします。');
  const [recipientName, setRecipientName] = useState('');
  const [recipientType, setRecipientType] = useState<'company' | 'individual'>('company');
  const [recipientAddress, setRecipientAddress] = useState('');

  // 主催者連携
const [organizerId, setOrganizerId] = useState<string | null>(null);
const [organizer, setOrganizer] = useState<Organizer | null>(null);
const isReturned = invoice?.return_status === 'returned';
const isEditable = !organizerId || isReturned;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadInvoice();
    }
  }, [user, authLoading, router, invoiceId]);

  const loadInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
          
      setInvoice(data);

      // データをフォームにセット
      setProjectName(data.subject || '');
      setWorkDate(data.work_date || '');
      setPaymentDueDate(data.payment_due_date || '');
      setSubject(data.subject || '');
      setItems(data.items || [{
        name: '',
        quantity: 1,
        amount: 0,
        category: '',
        isTaxIncluded: false,
        isWithholdingTarget: false,
        isTaxExempt: false,
      }]);
      setNotes(data.notes || '');
      setRecipientName(data.recipient_name || '');
      setRecipientType(data.recipient_type || 'company');
      setRecipientAddress(data.recipient_address || '');
      setOrganizerId(data.organizer_id);

      // 主催者情報を取得
      if (data.organizer_id) {
        const { data: organizerData } = await supabase
          .from('organizers')
          .select('*')
          .eq('id', data.organizer_id)
          .single();
        
        if (organizerData) setOrganizer(organizerData);
      }

    } catch (error: any) {
      console.error('請求書読み込みエラー:', error);
      alert('請求書の読み込みに失敗しました');
      router.push('/talent/invoices');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, {
      name: '',
      quantity: 1,
      amount: 0,
      category: '',
      isTaxIncluded: false,
      isWithholdingTarget: false,
      isTaxExempt: false,
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // カテゴリー選択時のプリセット適用
  const updateItemCategory = (index: number, categoryId: string) => {
    const category = getCategoryById(categoryId);
    const newItems = [...items];
    
    if (category) {
      newItems[index] = {
        ...newItems[index],
        category: categoryId,
        name: category.id === 'other' ? newItems[index].name : category.label,
        isTaxIncluded: category.isTaxIncluded,
        isWithholdingTarget: category.isWithholdingTarget,
        isTaxExempt: category.isTaxExempt,
      };
    }
    
    setItems(newItems);
  };

  // 税抜金額の合計を計算
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 1);
      let amount = Number(item.amount || 0) * quantity;
      
      // 値引き項目は自動的にマイナスにする
      if (item.category === 'discount') {
        amount = -Math.abs(amount);
      }
      
      // 非課税の場合はそのまま
      if (item.isTaxExempt) {
        return sum + amount;
      }
      
      // 税込の場合は税込金額から消費税を引いて税抜を算出
      if (item.isTaxIncluded && taxRate > 0) {
        const taxAmount = Math.floor(amount - (amount / (1 + taxRate / 100)));
        return sum + (amount - taxAmount);
      }
      
      // 税抜の場合はそのまま
      return sum + amount;
    }, 0);
  };

  // 消費税の合計を計算
  const calculateTax = () => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 1);
      let amount = Number(item.amount || 0) * quantity;
      
      // 値引き項目は自動的にマイナスにする
      if (item.category === 'discount') {
        amount = -Math.abs(amount);
      }
      
      // 非課税の場合は0
      if (item.isTaxExempt) {
        return sum;
      }
      
      // 税込の場合は税込金額から税抜を引いて消費税を算出
      if (item.isTaxIncluded && taxRate > 0) {
        return sum + Math.floor(amount - (amount / (1 + taxRate / 100)));
      }
      
      // 税抜の場合は税率から計算
      return sum + Math.floor(amount * (taxRate / 100));
    }, 0);
  };

  // 源泉徴収の合計を計算（自動計算）
  const calculateWithholdingTotal = () => {
    return items.reduce((sum, item) => {
      if (!item.isWithholdingTarget) return sum;
      
      const quantity = Number(item.quantity || 1);
      let amount = Number(item.amount || 0) * quantity;
      
      // 値引き項目は自動的にマイナスにする
      if (item.category === 'discount') {
        amount = -Math.abs(amount);
      }
      
      let baseAmount = amount;
      
      // 税込の場合は税抜に戻す
      if (item.isTaxIncluded && taxRate > 0) {
        baseAmount = Math.floor(amount / (1 + taxRate / 100));
      }
      
      // 源泉徴収額を計算（10.21%）
      return sum + Math.floor(baseAmount * 0.1021);
    }, 0);
  };

  // 合計金額を計算
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const withholdingAuto = calculateWithholdingTotal();
    
    return subtotal + tax - withholdingAuto;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSaving(true);
  setMessage('');

  try {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const withholdingTotal = calculateWithholdingTotal();
    const total = calculateTotal();

    // 1. invoicesテーブルを更新
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({
        work_date: workDate || null,
        payment_due_date: paymentDueDate || null,
        subject: subject,
        recipient_name: recipientName || null,
        recipient_type: recipientType || null,
        recipient_address: recipientAddress || null,
        notes: notes || null,
        items: items,
        subtotal: subtotal,
        tax: tax,
        withholding: withholdingTotal,
        total: total,
        ...(isReturned && {
          return_status: 'resubmitted',
          status: 'sent',
        }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (invoiceError) throw invoiceError;

    // 2. 差し戻し中の請求書を再提出した場合、主催者側も更新
    if (isReturned && organizerId) {
      const { error: orgError } = await supabase
        .from('organizer_invoices')
        .update({
          status: 'pending',  // 承認待ちに戻す
          work_date: workDate || null,
          payment_due_date: paymentDueDate || null,
          subject: subject,
          items: items,
          subtotal: subtotal,
          tax: tax,
          withholding: withholdingTotal,
          total: total,
          updated_at: new Date().toISOString(),
        })
        .eq('invoice_id', invoiceId)
        .eq('organizer_id', organizerId);

      if (orgError) {
        console.error('主催者側の更新エラー:', orgError);
        throw orgError;
      }
    }

    setMessage('更新しました！');
    setTimeout(() => {
      router.push('/talent/invoices');
    }, 1500);
  } catch (error: any) {
    console.error('更新エラー:', error);
    setMessage('更新に失敗しました: ' + error.message);
    setSaving(false);
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4 flex justify-between items-center">
          <h1 className="text-lg sm:text-2xl font-bold text-purple-600">請求書ぴっと</h1>
          <Button onClick={() => router.push('/talent/invoices')} variant="outline" size="sm" className="text-xs sm:text-sm">
            ← 請求書一覧に戻る
          </Button>
        </div>
      </header>


      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">請求書編集</h2>
          <p className="text-gray-600">請求書の内容を編集します</p>
        </div>

                {isReturned && invoice?.return_comment && (
          <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-orange-800">差し戻しがあります</h3>
                <div className="mt-2 text-sm text-orange-700">
                  <p className="whitespace-pre-wrap">{invoice.return_comment}</p>
                </div>
                {invoice.return_date && (
                  <p className="mt-2 text-xs text-orange-600">
                    差し戻し日時: {new Date(invoice.return_date).toLocaleString('ja-JP')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className={`mb-6 p-4 rounded-md ${message.includes('失敗') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </div>
        )}

        <form 
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              e.preventDefault();
            }
          }}
          className="space-y-6"
        >
          {/* 主催者情報（表示のみ） */}
          {organizer && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle>送信先</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-purple-700">{organizer.name} 御中</p>
                <p className="text-sm text-purple-600 mt-2">※ 主催者への送信済み請求書です</p>
              {!isReturned && (
                <p className="text-sm text-red-600 mt-1 font-medium">※ 確定済みのため編集できません</p>
                )}
                </CardContent>
            </Card>
          )}

          {/* 基本情報 */}
           <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>件名と日付を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                <label className="text-sm font-medium">件名</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="例: 2024年12月分出演料"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">作業日</label>
                  <input
                    type="date"
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">支払期日</label>
                  <input
                    type="date"
                    value={paymentDueDate}
                    onChange={(e) => setPaymentDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 備考 */}
          <Card>
            <CardHeader>
              <CardTitle>備考（任意）</CardTitle>
              <CardDescription>請求書に記載する備考を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">備考欄</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!isEditable} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                  placeholder="平素は格別のご高配を賜り、厚く御礼申し上げます。"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* 請求先情報（主催者未連携の場合のみ編集可能） */}
          {!organizer && (
            <Card>
              <CardHeader>
                <CardTitle>請求先情報</CardTitle>
                <CardDescription>請求先の情報を入力してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">請求先名</label>
                  <input
                    type="text"
                    value={recipientName}
                    disabled={!isEditable} 
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="例: 株式会社〇〇 または 山田太郎"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">請求先住所（任意）</label>
                  <input
                    type="text"
                    value={recipientAddress}
                    disabled={!isEditable} 
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="例: 東京都渋谷区〇〇1-2-3"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">敬称</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="recipientType"
                        value="company"
                        checked={recipientType === 'company'}
                        disabled={!isEditable} 
                        onChange={(e) => setRecipientType('company')}
                        className="rounded"
                      />
                      <span className="text-sm">御中（会社・団体）</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="recipientType"
                        value="individual"
                        checked={recipientType === 'individual'}
                        disabled={!isEditable} 
                        onChange={(e) => setRecipientType('individual')}
                        className="rounded"
                      />
                      <span className="text-sm">様（個人）</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 請求項目 */}
          <Card>
            <CardHeader>
              <CardTitle>請求項目</CardTitle>
              <CardDescription>項目ジャンルを選択すると、税設定が自動で適用されます</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                  {/* カテゴリー選択 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">項目ジャンル</label>
                    <select
                      value={item.category || ''}
                      disabled={!isEditable} 
                      onChange={(e) => updateItemCategory(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">選択してください</option>
                      {INVOICE_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 項目名（その他の場合のみ編集可能） */}
                  {item.category === 'other' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">項目名</label>
                      <input
                        type="text"
                        value={item.name}
                        disabled={!isEditable} 
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="項目名を入力"
                        required
                      />
                    </div>
                  )}

                  {/* 個数と単価 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">個数</label>
                      <input
                        type="number"
                        value={item.quantity}
                        disabled={!isEditable} 
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="1"
                        step="1"
                        required
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <label className="text-sm font-medium">
                        単価
                        {item.category === 'discount' && <span className="ml-2 text-xs text-red-600">(値引き額)</span>}
                        {item.isTaxExempt && <span className="ml-2 text-xs text-gray-500">(非課税)</span>}
                        {!item.isTaxExempt && item.isTaxIncluded && <span className="ml-2 text-xs text-gray-500">(税込)</span>}
                        {!item.isTaxExempt && !item.isTaxIncluded && <span className="ml-2 text-xs text-gray-500">(税抜)</span>}
                      </label>
                      <div className="relative">
                        {item.category === 'discount' && item.amount > 0 && (
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-600 font-bold pointer-events-none">
                            -
                          </div>
                        )}
                        <input
                          type="number"
                          value={item.amount === 0 ? '' : item.amount}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : Number(e.target.value);
                            updateItem(index, 'amount', Math.abs(value));
                          }}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                            item.category === 'discount'
                              ? 'border-red-300 text-red-600 font-semibold focus:ring-red-500 pl-8'
                              : 'border-gray-300 focus:ring-purple-500'
                          }`}
                          placeholder={item.category === 'discount' ? '値引き額' : '単価'}
                          required
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 小計表示 */}
                  {item.quantity && item.amount > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-md px-3 py-2">
                      <p className="text-sm text-purple-900">
                        <span className="font-medium">小計:</span>{' '}
                        {item.quantity} × ¥{item.amount.toLocaleString()} = {' '}
                        <span className="font-bold text-purple-700">
                          ¥{(item.quantity * item.amount).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* 詳細設定 */}
                  {item.category && (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs font-medium text-gray-600 mb-2">詳細設定（変更可能）</p>
                      
                      {/* チェックボックスを横並びに */}
                      <div className="flex flex-wrap gap-3 sm:gap-4">
                        {/* 税込/税抜切り替え（非課税以外） */}
                        {!item.isTaxExempt && (
                          <label className="flex items-center gap-1.5 text-sm sm:text-base cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.isTaxIncluded}
                              onChange={(e) => updateItem(index, 'isTaxIncluded', e.target.checked)}
                              disabled={!isEditable}
                              className="rounded"
                            />
                            <span>税込</span>
                          </label>
                        )}

                        {/* 源泉徴収対象 */}
                        <label className="flex items-center gap-1.5 text-sm sm:text-base cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.isWithholdingTarget}
                            onChange={(e) => updateItem(index, 'isWithholdingTarget', e.target.checked)}
                            disabled={!isEditable}
                            className="rounded"
                          />
                          <span>源泉徴収</span>
                        </label>

                        {/* 非課税 */}
                        <label className="flex items-center gap-1.5 text-sm sm:text-base cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.isTaxExempt}
                            onChange={(e) => updateItem(index, 'isTaxExempt', e.target.checked)}
                            disabled={!isEditable}
                            className="rounded"
                          />
                          <span>非課税</span>
                        </label>
                      </div>
                    </div>
                  )}


                  {items.length > 1 && isEditable && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-xs text-red-600 hover:text-red-700 underline py-1"
                    >
                      この項目を削除
                    </button>
                  )}

                </div>
              ))}

              <Button 
                type="button" 
                variant="outline" 
                onClick={addItem} 
                disabled={!isEditable}
                className="w-full">
                + 項目を追加
              </Button>
            </CardContent>
          </Card>

          {/* 金額計算 */}
          <Card>
            <CardHeader>
              <CardTitle>金額計算</CardTitle>
              <CardDescription>消費税や源泉徴収が自動計算されます。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* 金額サマリー */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">小計（税抜）:</span>
                  <span className="font-medium">¥{calculateSubtotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">消費税 (10%):</span>
                  <span className="font-medium">¥{calculateTax().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">源泉徴収（自動計算）:</span>
                  <span className="font-medium text-red-600">-¥{calculateWithholdingTotal().toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-bold text-lg">合計:</span>
                  <span className="font-bold text-lg text-purple-600">¥{calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              {/* 計算の説明 */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>• 源泉徴収対象の項目から自動で10.21%が計算されます</p>
                <p>• 税込入力の項目は自動で税抜に換算されます</p>
                <p>• 非課税の項目には消費税がかかりません</p>
              </div>
            </CardContent>
          </Card>

          {/* 送信ボタン */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/talent/invoices')}
            >
              キャンセル
            </Button>
            
            <Button type="submit" disabled={loading || !isEditable} className="border-1 border-purple-600">
              {loading ? '更新中...' : '更新する'}
            </Button>

            
          </div>
        </form>
      </main>
    </div>
  );
}
