'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ConfirmPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [message, setMessage] = useState('メールアドレスを確認しています...')

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // URLからエラーパラメータを取得
        const searchParams = new URLSearchParams(window.location.search)
        const errorCode = searchParams.get('error_code')
        const errorDescription = searchParams.get('error_description')

        // エラーがある場合
        if (errorCode === 'otp_expired') {
          setStatus('error')
          setMessage(
            'メールリンクの有効期限が切れています。\n\n' +
            '新しいメールアドレスで再度登録してください。\n' +
            'メールが届いたら、すぐに（1分以内に）リンクをクリックしてください。'
          )
          return
        }

        if (errorCode) {
          setStatus('error')
          setMessage(`認証エラー: ${errorDescription || errorCode}`)
          return
        }

        // URLからトークンを取得
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (!accessToken) {
          setStatus('error')
          setMessage('認証トークンが見つかりません。')
          return
        }

        // セッションを設定
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (sessionError) {
          console.error('セッション設定エラー:', sessionError)
          setStatus('error')
          setMessage('認証に失敗しました。もう一度お試しください。')
          return
        }

        const userId = sessionData.session?.user?.id

        if (!userId) {
          setStatus('error')
          setMessage('ユーザー情報が取得できませんでした。')
          return
        }

        setStatus('success')
        setMessage('認証に成功しました！ログイン画面に移行しています...')

        // 主催者かタレントかを判定
        const { data: organizerData } = await supabase
          .from('organizers')
          .select('id')
          .eq('id', userId)
          .single()

        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single()

          console.log('=== 役割判定 ===')
          console.log('organizerData:', organizerData)
          console.log('profileData:', profileData)

        // 役割に応じてリダイレクト
        if (organizerData) {
          // 主催者として登録されている
          console.log('主催者としてログインページへリダイレクト')
          setTimeout(() => {
            router.push('/organizer/login')
          }, 7000)
        } else if (profileData) {

          // タレントとして登録されている
          console.log('タレントとしてログインページへリダイレクト')
          setTimeout(() => {
            router.push('/talent/login')
          }, 7000)
        } else {
          
          // どちらにも登録されていない（データ挿入失敗の可能性）
          console.error('ユーザーデータが見つかりません:', userId)
          setStatus('error')
          setMessage('アカウント情報が見つかりません。もう一度登録をお試しください。')
          
          // 7秒後にトップページへリダイレクト
          setTimeout(() => {
            router.push('/')
          }, 7000)
        }
      } catch (error) {
        console.error('認証エラー:', error)
        setStatus('error')
        setMessage('予期しないエラーが発生しました。')
      }
    }

    handleEmailConfirmation()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          {status === 'checking' && (
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          )}
          {status === 'success' && (
            <div className="text-green-600 text-6xl mb-4">✓</div>
          )}
          {status === 'error' && (
            <div className="text-red-600 text-6xl mb-4">✗</div>
          )}
        </div>
        
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          {status === 'checking' && 'メール認証確認中'}
          {status === 'success' && '認証成功！'}
          {status === 'error' && '認証エラー'}
        </h1>
        
        <p className="text-gray-600 whitespace-pre-line">{message}</p>

        {status === 'error' && (
          <div className="mt-6">
            <a 
              href="/"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              トップページに戻る
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
