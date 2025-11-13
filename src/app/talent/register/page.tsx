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

export default function TalentRegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // バリデーション
    if (!fullName || !email || !password || !confirmPassword) {
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
      // 1. メールアドレスの重複チェック（profilesテーブル）
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single()

      if (existingProfile) {
        setError(
          'このメールアドレスは既にタレントとして登録されています。ログインページからログインしてください。'
        )
        setLoading(false)
        return
      }

      // 2. メールアドレスの重複チェック（organizersテーブル）
      const { data: existingOrganizer } = await supabase
        .from('organizers')
        .select('email')
        .eq('email', email)
        .single()

      if (existingOrganizer) {
        setError(
          'このメールアドレスは既に主催者として登録されています。\n\n「請求書ぴっと」では、1つのメールアドレスで1つの役割のみを持つことができます。\n\nタレントとして登録したい場合は、別のメールアドレスをご使用ください。\n\n主催者としてログインする場合は、以下からログインしてください。'
        )
        setLoading(false)
        return
      }

      console.log('=== タレント登録開始 ===')
      console.log('メール:', email)
      console.log('氏名:', fullName)

      // 3. Supabase Authにユーザーを登録
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            role: 'talent',
            full_name: fullName,
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

      // 4. プロフィール情報をprofilesテーブルに挿入
      console.log('=== プロフィール情報を挿入します ===')

      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email: email,
            full_name: fullName,
          },
        ])

      if (insertError) {
        console.error('=== プロフィール情報の挿入エラー ===')
        console.error('エラー詳細:', insertError)
        setError(`プロフィール情報の作成に失敗しました。\n詳細: ${insertError.message}`)
        setLoading(false)
        return
      }

      console.log('=== プロフィール情報の挿入成功 ===')

      // 5. 成功
      setSuccess(true)
      setLoading(false)

      // 7秒後にログインページへリダイレクト
      setTimeout(() => {
        router.push('/talent/login')
      }, 7000)
    } catch (err) {
      console.error('予期しないエラー:', err)
      setError('予期しないエラーが発生しました。もう一度お試しください。')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          タレント新規登録
        </h1>
        <p className="text-center text-gray-600 mb-6 text-sm">
          請求書管理を始めましょう
        </p>

        {error && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800 whitespace-pre-line text-sm">
              {error}
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
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800 text-sm">
              登録が完了しました！
              <br />
              メールアドレス宛に確認メールを送信しました。
              <br />
              メール内のリンクをクリックして、メールアドレスを確認してください。
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <Label htmlFor="fullName" className="text-sm">氏名</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="山田太郎"
              required
              disabled={loading || success}
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
              placeholder="example@example.com"
              required
              disabled={loading || success}
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
              placeholder="••••••••"
              required
              disabled={loading || success}
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
              placeholder="••••••••"
              required
              disabled={loading || success}
              className="text-sm"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || success}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm"
          >
            {loading ? '登録中...' : '登録する'}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link
            href="/talent/login"
            className="text-purple-600 hover:text-purple-700 text-sm block"
          >
            既にアカウントをお持ちの方はこちら
          </Link>
          <Link
            href="/organizer"
            className="text-green-600 hover:text-green-700 text-sm block"
          >
            主催者の方はこちら
          </Link>
        </div>
      </div>
    </div>
  )
}
