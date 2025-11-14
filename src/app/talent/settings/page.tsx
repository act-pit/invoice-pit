'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Profile } from '@/types/database';
import { OCCUPATION_OPTIONS, ACTIVITY_AREA_OPTIONS } from '@/lib/profile-options';


export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Partial<Profile>>({
    occupation_types: [],
    activity_areas: [],
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadProfile();
    }
  }, [user, authLoading, router]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          ...data,
          occupation_types: data.occupation_types || [],
          activity_areas: data.activity_areas || [],
        });
      } else {
        // プロフィールが存在しない場合は初期値を設定
        setProfile({
          email: user!.email!,
          full_name: user!.user_metadata?.full_name || '',
          occupation_types: [],
          activity_areas: [],
        });
      }

    } catch (error: any) {
      console.error('プロフィール読み込みエラー:', error);
      setMessage('プロフィールの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSaving(true);
  setMessage('');

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        email: user!.email!,
        full_name: profile.full_name,
        phone: profile.phone,
        occupation: profile.occupation,
        area: profile.area,
        postal_code: profile.postal_code,
        address: profile.address,
        bank_name: profile.bank_name,
        branch_name: profile.branch_name,
        account_type: profile.account_type,
        account_number: profile.account_number,
        account_holder: profile.account_holder,
        invoice_reg_number: profile.invoice_reg_number,
        occupation_types: profile.occupation_types || [],
        activity_areas: profile.activity_areas || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', user!.id);

    // エラーハンドリング追加
    if (error) {
      // もしprofilesレコードが存在しない場合（稀なケース）
      if (error.code === 'PGRST116') {
        setMessage('プロフィールが見つかりません。ページを再読み込みしてください。');
        return;
      }
      throw error;
    }

    setMessage('保存しました！');
    setTimeout(() => setMessage(''), 3000);
  } catch (error: any) {
    console.error('保存エラー:', error);
    setMessage('保存に失敗しました: ' + error.message);
  } finally {
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


      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">設定</h2>
          <p className="text-gray-600">プロフィールと口座情報を設定してください</p>
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
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>お名前と連絡先を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    お名前 <span className="text-red-600">*</span>
                  </label>

                  <input
                    type="text"
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="山田 太郎"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">メールアドレス</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">電話番号</label>
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="090-1234-5678"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">職業（複数選択可能）</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border border-gray-300 rounded-md bg-white">
                    {OCCUPATION_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={profile.occupation_types?.includes(option.value) || false}
                          onChange={(e) => {
                            const currentTypes = profile.occupation_types || [];
                            if (e.target.checked) {
                              setProfile({
                                ...profile,
                                occupation_types: [...currentTypes, option.value],
                              });
                            } else {
                              setProfile({
                                ...profile,
                                occupation_types: currentTypes.filter((t) => t !== option.value),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>


                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">活動エリア（複数選択可能）</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border border-gray-300 rounded-md bg-white">
                    {ACTIVITY_AREA_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={profile.activity_areas?.includes(option.value) || false}
                          onChange={(e) => {
                            const currentAreas = profile.activity_areas || [];
                            if (e.target.checked) {
                              setProfile({
                                ...profile,
                                activity_areas: [...currentAreas, option.value],
                              });
                            } else {
                              setProfile({
                                ...profile,
                                activity_areas: currentAreas.filter((a) => a !== option.value),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>


                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    郵便番号 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.postal_code || ''}
                    onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="123-4567"
                    required                    
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">
                    住所 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.address || ''}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="東京都渋谷区..."
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 振込先情報 */}
          <Card>
            <CardHeader>
              <CardTitle>振込先情報</CardTitle>
              <CardDescription>請求書に記載される口座情報を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    銀行名 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.bank_name || ''}
                    onChange={(e) => setProfile({ ...profile, bank_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="例: 三菱UFJ銀行"
                    required

                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    支店名 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.branch_name || ''}
                    onChange={(e) => setProfile({ ...profile, branch_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="例: 渋谷支店"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    口座種別 <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={profile.account_type || ''}
                    onChange={(e) => setProfile({ ...profile, account_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  >
                    <option value="">選択してください</option>
                    <option value="普通">普通</option>
                    <option value="当座">当座</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    口座番号 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.account_number || ''}
                    onChange={(e) => setProfile({ ...profile, account_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="1234567"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">
                    口座名義（カナ） <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.account_holder || ''}
                    onChange={(e) => setProfile({ ...profile, account_holder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="ヤマダ タロウ"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">インボイス登録番号</label>
                  <input
                    type="text"
                    value={profile.invoice_reg_number || ''}
                    onChange={(e) => setProfile({ ...profile, invoice_reg_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="T1234567890123"
                  />
                  <p className="text-xs text-gray-500">インボイス制度に登録している場合のみ入力してください</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 保存ボタン */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/talent/dashboard')}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? '保存中...' : '保存する'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
