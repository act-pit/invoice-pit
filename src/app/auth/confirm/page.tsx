'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// メインコンポーネント（useSearchParamsを使用）
function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('メールアドレスを確認しています...')
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const confirmEmail = async () => {
      console.log('=== メール認証確認ページ ===')
      
      const supabase = createClientComponentClient()
      
      // URLからパラメータを取得
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      const error = searchParams.get('error')
      const error_code = searchParams.get('error_code')
      const error_description = searchParams.get('error_description')
      
      console.log('URL Parameters:', { 
        token_hash: token_hash ? 'あり' : 'なし', 
        type, 
        error, 
        error_code,
        error_description 
      })

      // エラーパラメータのチェック
      if (error || error_code) {
        console.error('認証エラー:', error_code, error_description)
        setIsError(true)
        
        if (error_code === 'otp_expired') {
          setMessage(
            'メールリンクの有効期限が切れています。\n\n' +
            '新しく登録し直してください。\n' +
            'メールが届いたら、すぐに（60分以内に）リンクをクリックしてください。'
          )
        } else {
          setMessage(error_description || '認証に失敗しました。')
        }
        return
      }

      // トークンがない場合
      if (!token_hash) {
        console.error('token_hashが見つかりません')
        setIsError(true)
        setMessage('認証トークンが見つかりません。メールのリンクが正しくありません。')
        return
      }

      try {
        console.log('OTP検証を開始...')
        
        // 新しいフロー: verifyOtpを使用
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        })

        if (verifyError) {
          console.error('OTP検証エラー:', verifyError)
          setIsError(true)
          setMessage('メールアドレスの確認に失敗しました。\n\nもう一度登録からやり直してください。')
          return
        }

        console.log('✅ OTP検証成功')
        
        const userId = data?.user?.id

        if (!userId) {
          console.error('ユーザーIDが取得できません')
          setIsError(true)
          setMessage('ユーザー情報の取得に失敗しました。')
          return
        }

        console.log('ユーザーID:', userId)

        // 役割を判定（organizersテーブルを先にチェック）
        console.log('=== 役割判定 ===')
        
        const { data: organizerData, error: orgError } = await supabase
          .from('organizers')
          .select('id')
          .eq('id', userId)
          .maybeSingle()

        console.log('organizers チェック:', organizerData, orgError)

        const { data: profileData, error: profError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle()

        console.log('profiles チェック:', profileData, profError)

        setMessage('✅ メールアドレスの確認が完了しました！\n\nログインページにリダイレクトします...')

        // 3秒後にリダイレクト
        setTimeout(() => {
          if (organizerData) {
            console.log('✅ 主催者としてログインページへリダイレクト')
            router.push('/organizer/login')
          } else if (profileData) {
            console.log('✅ タレントとしてログインページへリダイレクト')
            router.push('/talent/login')
          } else {
            console.error('❌ どちらのテーブルにもデータが見つかりません')
            setIsError(true)
            setMessage('アカウント情報が見つかりません。\n\nもう一度登録をお試しください。')
            
            setTimeout(() => {
              router.push('/')
            }, 3000)
          }
        }, 3000)

      } catch (error) {
        console.error('予期しないエラー:', error)
        setIsError(true)
        setMessage('予期しないエラーが発生しました。')
      }
    }

    confirmEmail()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          {isError ? (
            <div className="text-red-600 text-6xl mb-4">✗</div>
          ) : (
            <>
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mt-4"></div>
            </>
          )}
        </div>
        
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          {isError ? '認証エラー' : 'メール認証確認中'}
        </h1>
        
        <p className="text-gray-600 whitespace-pre-line">{message}</p>

        {isError && (
          <div className="mt-6">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              トップページに戻る
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ローディングコンポーネント
function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">読み込み中...</p>
      </div>
    </div>
  )
}

// エクスポートするコンポーネント（Suspenseでラップ）
export default function ConfirmPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ConfirmContent />
    </Suspense>
  )
}
