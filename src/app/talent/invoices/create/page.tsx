'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { isProfileComplete, getMissingProfileFields } from '@/lib/profile-check';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { checkSubscriptionLimits } from '@/lib/subscription-utils';
import { INVOICE_CATEGORIES, getCategoryById } from '@/lib/invoice-categories';

// 型定義
type Profile = Database['public']['Tables']['profiles']['Row'];
type Organizer = Database['public']['Tables']['organizers']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'];

interface InvoiceItem {
  name: string;
  quantity: number;
  amount: number;
  category: string;
  isTaxIncluded: boolean;
  isWithholdingTarget: boolean;
  isTaxExempt: boolean;
}

export default function CreateInvoicePage() {
  const supabase = createClientComponentClient<Database>();
  const { user, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [canCreate, setCanCreate] = useState(true);
  const [limitMessage, setLimitMessage] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showProfileWarning, setShowProfileWarning] = useState(false);

  // フォームの状態
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

  const taxRate = 10;

  const [notes, setNotes] = useState('平素は格別のご高配を賜り、厚く御礼申し上げます。\n下記の件につきまして、ご請求申し上げます。\nご査収のほど、よろしくお願いいたします。');
  const [recipientName, setRecipientName] = useState('');
  const [recipientType, setRecipientType] = useState<'company' | 'individual'>('company');
  const [recipientAddress, setRecipientAddress] = useState('');

  // 主催者連携
  const [organizerCode, setOrganizerCode] = useState('');
  const [verifiedOrganizer, setVerifiedOrganizer] = useState<Organizer | null>(null);
  const [verifying, setVerifying] = useState(false);

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/talent/login');
    }
  }, [user, authLoading, router]);

  // プロフィール読み込みと制限チェック
  useEffect(() => {
    const fetchProfileAndCheckLimits = async () => {
      if (!user) return;

      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('プロフィール取得エラー:', error);
          return;
        }

        if (!profileData) {
          console.warn('プロフィールが存在しません');
          setShowProfileWarning(true);
          return;
        }
        
        setProfile(profileData);

        // サブスクリプション情報を取得
        const { data: subscriptionData, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('talent_id', user.id)
          .maybeSingle();

        if (subError) {
          console.error('サブスクリプション取得エラー:', subError);
        } else {
          setSubscription(subscriptionData);
        }

        // プロフィール完全性チェック
        if (!isProfileComplete(profileData)) {
          setShowProfileWarning(true);
        }

        // サブスクリプション制限チェック
        const limits = await checkSubscriptionLimits(profileData);
        setCanCreate(limits.canCreateInvoice);
        
        if (limits.reason) {
          setLimitMessage(limits.reason);
        }
      } catch (error) {
        console.error('プロフィールチェックエラー:', error);
      }
    };

    fetchProfileAndCheckLimits();
  }, [user, supabase]);

  // 主催者コード確認
  const verifyOrganizerCode = async () => {
    if (!organizerCode.trim()) {
      setVerifiedOrganizer(null);
      return;
    }

    setVerifying(true);
    try {
      const { data, error } = await supabase
        .from('organizers')
        .select('*')
        .eq('organizer_code', organizerCode.trim().toUpperCase())
        .maybeSingle();

      if (error || !data) {
        alert('主催者コードが見つかりません');
        setVerifiedOrganizer(null);
      } else {
        setVerifiedOrganizer(data);
      }
    } catch (error) {
      console.error('主催者コード確認エラー:', error);
      setVerifiedOrganizer(null);
    } finally {
      setVerifying(false);
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

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 1);
      let amount = Number(item.amount || 0) * quantity;
      
      if (item.category === 'discount') {
        amount = -Math.abs(amount);
      }
      
      if (item.isTaxExempt) {
        return sum + amount;
      }
      
      if (item.isTaxIncluded && taxRate > 0) {
        const taxAmount = Math.floor(amount - (amount / (1 + taxRate / 100)));
        return sum + (amount - taxAmount);
      }
      
      return sum + amount;
    }, 0);
  };

  const calculateTax = () => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 1);
      let amount = Number(item.amount || 0) * quantity;
      
      if (item.category === 'discount') {
        amount = -Math.abs(amount);
      }
      
      if (item.isTaxExempt) {
        return sum;
      }
      
      if (item.isTaxIncluded && taxRate > 0) {
        return sum + Math.floor(amount - (amount / (1 + taxRate / 100)));
      }
      
      return sum + Math.floor(amount * (taxRate / 100));
    }, 0);
  };

  const calculateWithholdingTotal = () => {
    return items.reduce((sum, item) => {
      if (!item.isWithholdingTarget) return sum;
      
      const quantity = Number(item.quantity || 1);
      let amount = Number(item.amount || 0) * quantity;
      
      if (item.category === 'discount') {
        amount = -Math.abs(amount);
      }
      
      let baseAmount = amount;
      
      if (item.isTaxIncluded && taxRate > 0) {
        baseAmount = Math.floor(amount / (1 + taxRate / 100));
      }
      
      return sum + Math.floor(baseAmount * 0.1021);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const withholdingAuto = calculateWithholdingTotal();
    
    return subtotal + tax - withholdingAuto;
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // プロフィール未登録チェック
    if (!profile || !isProfileComplete(profile)) {
      setShowProfileWarning(true);
      return;
    }

    // 制限チェック
    if (!canCreate) {
      alert('請求書の作成制限に達しています。有料プランにアップグレードしてください。');
      router.push('/talent/subscription');
      return;
    }

    setShowPreviewModal(true);
  };

  const handleConfirmCreate = async () => {
    setLoading(true);
    setMessage('');
    setShowPreviewModal(false);

    try {
      const subtotal = calculateSubtotal();
      const tax = calculateTax();
      const withholdingTotal = calculateWithholdingTotal();
      const total = calculateTotal();
      const invoiceNumber = generateInvoiceNumber();

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          talent_id: user!.id,
          invoice_number: invoiceNumber,
          invoice_date: new Date().toISOString().split('T')[0],
          payment_due_date: paymentDueDate || new Date().toISOString().split('T')[0],
          recipient_company: recipientName || '',
          recipient_name: recipientName || null,
          recipient_address: recipientAddress || null,
          notes: notes || null,
          items: items as any,
          subtotal: subtotal,
          tax_amount: tax,
          total_amount: total,
          status: 'pending',
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // トライアルユーザーのカウント更新
      if (subscription?.status === 'trial') {
        await supabase
          .from('subscriptions')
          .update({ invoice_count: (subscription.invoice_count || 0) + 1 })
          .eq('talent_id', user!.id);
      }

      // 主催者への送信
      if (verifiedOrganizer && invoiceData) {
        const { error: orgInvoiceError } = await supabase
          .from('organizer_invoices')
          .insert({
            organizer_id: verifiedOrganizer.id,
            invoice_id: invoiceData.id,
            status: 'received',
          });

        if (orgInvoiceError) throw orgInvoiceError;
      }

      setMessage(verifiedOrganizer 
        ? '請求書を作成し、主催者に送信しました！'
        : '請求書を作成しました！');
      
      setTimeout(() => {
        router.push('/talent/invoices');
      }, 1500);
    } catch (error: any) {
      console.error('作成エラー:', error);
      setMessage('作成に失敗しました: ' + error.message);
      setLoading(false);
    }
  };

  if (authLoading) {
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
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4 flex justify-between items-center">
          <h1 className="text-lg sm:text-2xl font-bold text-purple-600">請求書ぴっと</h1>
          <Button onClick={() => router.push('/talent/dashboard')} variant="outline" size="sm" className="text-xs sm:text-sm">
            ← ダッシュボードに戻る
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">請求書作成</h2>
        </div>

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
          {/* 制限警告 */}
          {!canCreate && (
            <Card className="border-red-500 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-red-800 font-semibold mb-1">請求書作成が制限されています</h3>
                    <p className="text-red-700 text-sm mb-3">{limitMessage}</p>
                    <button
                      type="button"
                      onClick={() => router.push('/talent/subscription')}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      有料プランにアップグレード
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* トライアル情報 */}
          {canCreate && subscription?.status === 'trial' && limitMessage && (
            <Card className="border-yellow-500 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-yellow-800 font-semibold mb-1">トライアル期間中</h3>
                    <p className="text-yellow-700 text-sm mb-2">{limitMessage}</p>
                    <button
                      type="button"
                      onClick={() => router.push('/talent/subscription')}
                      className="text-yellow-800 text-sm font-medium hover:text-yellow-900 underline underline-offset-2 hover:underline-offset-4 transition-all"
                    >
                      プランを確認 →
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 主催者連携 */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle>主催者連携（任意）</CardTitle>
              <CardDescription>主催者コードを入力すると、請求書を直接送信できます</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={organizerCode}
                  onChange={(e) => setOrganizerCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="8桁のコードを入力"
                  maxLength={8}
                />
                <Button 
                  type="button" 
                  onClick={verifyOrganizerCode}
                  disabled={verifying || !organizerCode.trim()}
                >
                  {verifying ? '確認中...' : '確認'}
                </Button>
              </div>

              {verifiedOrganizer && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-green-800 font-medium">
                    ✅ {verifiedOrganizer.name || verifiedOrganizer.company_name || verifiedOrganizer.full_name} に送信されます
                  </p>
                </div>
              )}

              {!verifiedOrganizer && (
                <div className="border-t pt-4 space-y-4">
                  <p className="text-sm font-medium text-gray-700">
                    または、請求先を直接入力してください
                  </p>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">請求先名</label>
                    <input
                      type="text"
                      value={recipientName}
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
                          onChange={() => setRecipientType('company')}
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
                          onChange={() => setRecipientType('individual')}
                          className="rounded"
                        />
                        <span className="text-sm">様（個人）</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                  placeholder="平素は格別のご高配を賜り、厚く御礼申し上げます。"
                  rows={4}
                />
                <p className="text-xs text-gray-500">
                  デフォルトの文言が入力されています。必要に応じて編集してください。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 請求項目 */}
          <Card>
            <CardHeader>
              <CardTitle>請求項目</CardTitle>
              <CardDescription>項目を選択すると、一般的な税設定が自動で適用されます。(変更可能)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">項目ジャンル</label>
                    <select
                      value={item.category || ''}
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

                  {item.category === 'other' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">項目名</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="項目名を入力"
                        required
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">個数</label>
                      <input
                        type="number"
                        value={item.quantity}
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

                  {item.category && (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs font-medium text-gray-600 mb-2">詳細設定（変更可能）</p>
                      <div className="flex flex-wrap gap-3 sm:gap-4">
                        {!item.isTaxExempt && (
                          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.isTaxIncluded}
                              onChange={(e) => updateItem(index, 'isTaxIncluded', e.target.checked)}
                              className="rounded"
                            />
                            <span>税込</span>
                          </label>
                        )}

                        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.isWithholdingTarget}
                            onChange={(e) => updateItem(index, 'isWithholdingTarget', e.target.checked)}
                            className="rounded"
                          />
                          <span>源泉徴収対象</span>
                        </label>

                        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.isTaxExempt}
                            onChange={(e) => updateItem(index, 'isTaxExempt', e.target.checked)}
                            className="rounded"
                          />
                          <span>非課税</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {items.length > 1 && (
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

              <Button type="button" variant="outline" onClick={addItem} className="w-full">
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
              onClick={() => router.push('/talent/dashboard')}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={loading} className="border-1 border-purple-600">
              {loading ? '作成中...' : verifiedOrganizer ? '作成して送信' : '請求書を作成'}
            </Button>
          </div>
        </form>

        {/* プレビューモーダル */}
        {showPreviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4">
                <h3 className="text-xl font-bold text-gray-900">請求書プレビュー</h3>
                <p className="text-sm text-gray-600 mt-1">内容を確認して、問題なければ作成してください</p>
              </div>

              <div className="px-6 py-6 space-y-6">
                {verifiedOrganizer ? (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-purple-900 mb-1">送信先</p>
                    <p className="text-lg font-bold text-purple-700">{verifiedOrganizer.name || verifiedOrganizer.company_name || verifiedOrganizer.full_name} 御中</p>
                  </div>
                ) : recipientName ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">請求先</p>
                    <p className="text-lg font-bold text-gray-900">
                      {recipientName} {recipientType === 'company' ? '御中' : '様'}
                    </p>
                    {recipientAddress && (
                      <p className="text-sm text-gray-600 mt-1">{recipientAddress}</p>
                    )}
                  </div>
                ) : null}

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">件名</p>
                      <p className="font-medium text-gray-900">{subject || '（未入力）'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">作業日</p>
                      <p className="font-medium text-gray-900">{workDate || '（未設定）'}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">支払期日</p>
                      <p className="font-medium text-gray-900">{paymentDueDate || '（未設定）'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">請求項目</p>
                  <div className="space-y-2">
                    {items.map((item, index) => {
                      if (!item.name || !item.amount) return null;
                      const isDiscount = item.category === 'discount';
                      const quantity = item.quantity || 1;
                      const unitPrice = item.amount;
                      const subtotal = quantity * unitPrice;
                      const displaySubtotal = isDiscount ? -Math.abs(subtotal) : subtotal;
                      
                      return (
                        <div key={index} className="py-2 border-b border-gray-100">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className={`font-medium ${isDiscount ? 'text-red-600' : 'text-gray-900'}`}>
                                {item.name}
                              </p>
                              <div className="flex gap-2 mt-1">
                                {item.isTaxExempt && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">非課税</span>
                                )}
                                {!item.isTaxExempt && (
                                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                                    {item.isTaxIncluded ? '税込' : '税抜'}
                                  </span>
                                )}
                                {item.isWithholdingTarget && (
                                  <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded">源泉徴収対象</span>
                                )}
                              </div>
                            </div>
                            <p className={`font-bold text-lg ${isDiscount ? 'text-red-600' : 'text-gray-900'}`}>
                              {isDiscount && '-'}¥{Math.abs(displaySubtotal).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {quantity} × ¥{unitPrice.toLocaleString()} = ¥{Math.abs(displaySubtotal).toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">小計（税抜）</span>
                    <span className="font-medium">¥{calculateSubtotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">消費税 ({taxRate}%)</span>
                    <span className="font-medium">¥{calculateTax().toLocaleString()}</span>
                  </div>
                  {calculateWithholdingTotal() > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">源泉徴収</span>
                      <span className="font-medium text-red-600">-¥{calculateWithholdingTotal().toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-bold text-lg">合計</span>
                    <span className="font-bold text-2xl text-purple-600">¥{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>

                {profile && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">振込先情報</p>
                    <div className="text-sm text-blue-800 space-y-1">
                      {profile.bank_name && (profile.branch_name || profile.bank_branch) ? (
                        <>
                          <p>{profile.bank_name} {profile.branch_name || profile.bank_branch}</p>
                          <p>{profile.account_type === 'normal' ? '普通' : '当座'} {profile.account_number}</p>
                          <p>{profile.account_holder}</p>
                        </>
                      ) : (
                        <p className="text-orange-600">⚠️ 振込先情報が未設定です</p>
                      )}
                    </div>
                  </div>
                )}

                {notes && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">備考</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{notes}</p>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreviewModal(false)}
                  disabled={loading}
                >
                  修正する
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmCreate}
                  disabled={loading}
                  className="min-w-[120px]"
                >
                  {loading ? '作成中...' : verifiedOrganizer ? '確定して送信' : '確定して作成'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* プロフィール未登録警告モーダル */}
        {showProfileWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-12 w-12 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    プロフィール情報が未登録です
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    請求書を作成するには、以下の情報を登録してください：
                  </p>
                  {profile && (
                    <ul className="text-sm text-gray-700 space-y-1 mb-4">
                      {getMissingProfileFields(profile).map((field) => (
                        <li key={field} className="flex items-center gap-2">
                          <span className="text-orange-500">•</span>
                          {field}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-gray-500">
                    ※ 住所と振込先情報は請求書の印刷に必要です
                  </p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={() => router.push('/talent/settings')}
                  className="bg-orange-600 hover:bg-orange-700 px-8"
                >
                  プロフィール情報を登録する
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}