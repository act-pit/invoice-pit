'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// shadcn/ui コンポーネント
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

// 8桁のランダムコード生成関数（紛らわしい文字を除外）
function generateOrganizerCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // I, O, 0, 1 を除外
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export default function OrganizerRegisterPage() {
  const [organizerName, setOrganizerName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')  // string型
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // バリデーション
    if (!organizerName || !email || !password || !confirmPassword) {
      setError('全ての項目を入力してください。')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上である必要があります。')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません。')
      setLoading(false)
      return
    }

    try {
      // 1. メールアドレスの重複チェック（organizersテーブル）
      const { data: existingOrganizer } = await supabase
        .from('organizers')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingOrganizer) {
        setError(
          'このメールアドレスは既に主催者として登録されています。ログインページからログインしてください。'
        )
        setLoading(false)
        return
      }

      // 2. メールアドレスの重複チェック（profilesテーブル）
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single()

      if (existingProfile) {
        setError(
          'このメールアドレスは既にタレントとして登録されています。\n\n「請求書ぴっと」では、1つのメールアドレスで1つの役割のみを持つことができます。\n\n主催者として登録したい場合は、別のメールアドレスをご使用ください。\n\nタレントとしてログインする場合は、以下からログインしてください。'
        )
        setLoading(false)
        return
      }

      // 3. ユニークな主催者コードを生成
      let organizerCode = ''
      let isUnique = false
      let attempts = 0
      const maxAttempts = 10

      while (!isUnique && attempts < maxAttempts) {
        organizerCode = generateOrganizerCode()
        const { data: existingCode } = await supabase
          .from('organizers')
          .select('organizer_code')
          .eq('organizer_code', organizerCode)
          .single()

        if (!existingCode) {
          isUnique = true
        }
        attempts++
      }

      if (!isUnique) {
        setError('主催者コードの生成に失敗しました。もう一度お試しください。')
        setLoading(false)
        return
      }

      console.log('=== 主催者登録開始 ===')
      console.log('メール:', email)
      console.log('主催者名:', organizerName)
      console.log('主催者コード:', organizerCode)

      // 4. Supabase Authにユーザーを登録
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            role: 'organizer',
            organizer_name: organizerName,
            organizer_code: organizerCode,
          },
        },
      })

      if (signUpError) {
        console.error('サインアップエラー:', signUpError)
        setError(`登録に失敗しました: ${signUpError.message}`)
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('ユーザー情報の取得に失敗しました。')
        setLoading(false)
        return
      }

      console.log('=== Auth登録成功 ===')
      console.log('ユーザーID:', data.user.id)
      console.log('※ トリガーにより自動的にorganizersテーブルに挿入されます')

      // 5. 成功（トリガーが自動的にorganizersに挿入）
      setSuccess('登録が完了しました！\nメールアドレス宛に確認メールを送信しました。\nメール内のリンクをクリックして、メールアドレスを確認してください。')
      setLoading(false)

      // 7秒後にログインページへリダイレクト
      setTimeout(() => {
        router.push('/organizer/login')
      }, 7000)
    } catch (err) {
      console.error('予期しないエラー:', err)
      setError('予期しないエラーが発生しました。もう一度お試しください。')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          主催者新規登録
        </h1>
        <p className="text-center text-gray-600 mb-6 text-sm">
          請求書管理を始めましょう
        </p>

        {error && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800 whitespace-pre-line text-sm">
              {error}
              {error.includes('タレントとして登録') && (
                <div className="mt-3">
                  <Link
                    href="/talent/login"
                    className="text-purple-600 hover:text-purple-700 underline font-medium"
                  >
                    タレントログインはこちら
                  </Link>
                </div>
              )}
              {error.includes('主催者として登録') && (
                <div className="mt-3">
                  <Link
                    href="/organizer/login"
                    className="text-green-600 hover:text-green-700 underline font-medium"
                  >
                    主催者ログインはこちら
                  </Link>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800 text-sm whitespace-pre-line">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <Label htmlFor="organizerName" className="text-sm">主催者名</Label>
            <Input
              id="organizerName"
              type="text"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              placeholder="株式会社◯◯◯◯"
              required
              disabled={loading || success !== ''}
              className="text-sm"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || success !== ''}
              className="text-sm"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm">パスワード（8文字以上）</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || success !== ''}
              className="text-sm"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-sm">パスワード（確認）</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading || success !== ''}
              className="text-sm"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || success !== ''}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-sm"
          >
            {loading ? '登録中...' : success ? '登録完了' : '登録する'}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link
            href="/organizer/login"
            className="text-green-600 hover:text-green-700 text-sm block"
          >
            既にアカウントをお持ちの方はこちら
          </Link>
          <Link
            href="/talent"
            className="text-purple-600 hover:text-purple-700 text-sm block"
          >
            タレントの方はこちら
          </Link>
        </div>
      </div>
    </div>
  )
}
