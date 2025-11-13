'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Profile } from '@/types'

export default function OrganizerSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    organization_name: '',
    full_name: '',
    phone: '',
    address: '',
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      setProfile(data)
      setFormData({
        organization_name: data.organization_name || '',
        full_name: data.full_name || '',
        phone: data.phone || '',
        address: data.address || '',
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      setMessage({ type: 'error', text: 'プロフィールの取得に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('認証が必要です')

      const { error } = await supabase
        .from('profiles')
        .update({
          organization_name: formData.organization_name,
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id)

      if (error) throw error

      setMessage({ type: 'success', text: '設定を保存しました' })
      fetchProfile()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: error.message || '設定の保存に失敗しました' })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">設定</h1>

      {/* メッセージ表示 */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 主催者コード（読み取り専用） */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-purple-900 mb-2">主催者コード</h2>
        <p className="text-sm text-purple-700 mb-3">
          キャストがこのコードを使って請求書を送信します
        </p>
        <div className="bg-white rounded-lg p-4 border-2 border-purple-300">
          <code className="text-2xl font-mono font-bold text-purple-600">
            {profile?.organizer_code || '未設定'}
          </code>
        </div>
      </div>

      {/* プロフィール編集フォーム */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 border-b pb-3">
          プロフィール情報
        </h2>

        <div>
          <label htmlFor="organization_name" className="block text-sm font-medium text-gray-700 mb-2">
            団体名・組織名 <span className="text-red-500">*</span>
          </label>
          <input
            id="organization_name"
            name="organization_name"
            type="text"
            value={formData.organization_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="株式会社〇〇"
          />
        </div>

        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
            担当者名
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="山田 太郎"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            電話番号
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="03-1234-5678"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            住所
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="〒100-0001&#10;東京都千代田区..."
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button
            type="button"
            onClick={fetchProfile}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            リセット
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </form>

      {/* アカウント情報 */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 border-b pb-3">
          アカウント情報
        </h2>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">メールアドレス</span>
            <span className="text-sm font-medium text-gray-900">{profile?.email}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">アカウント種別</span>
            <span className="text-sm font-medium text-gray-900">主催者</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">登録日</span>
            <span className="text-sm font-medium text-gray-900">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ja-JP') : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
