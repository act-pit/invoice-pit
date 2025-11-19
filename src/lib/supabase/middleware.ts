// src/lib/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// タイムアウト付きでユーザー取得
async function getUserWithTimeout(supabase: any, timeout = 10000) {
  return Promise.race([
    supabase.auth.getUser(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Middleware timeout')), timeout)
    )
  ]);
}

export async function updateSession(request: NextRequest) {
  console.log('🔵 [Middleware] 実行開始:', request.nextUrl.pathname)
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log('🔵 [Middleware] Cookie設定:', name)
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          console.log('🔵 [Middleware] Cookie削除:', name)
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  let user = null;
  
  try {
    // タイムアウト付きでユーザー取得
    const result = await getUserWithTimeout(supabase, 10000);
    user = result?.data?.user || null;
    console.log('🔵 [Middleware] User:', user ? 'あり' : 'なし')
  } catch (error) {
    console.error('🔴 [Middleware] 認証チェックエラー:', error);
    // タイムアウトやエラー時はセッションなしとして扱う
    user = null;
  }

  const path = request.nextUrl.pathname

  // 保護されたルートの定義
  const isTalentProtected = path.startsWith('/talent') && 
    path !== '/talent' &&
    !path.startsWith('/talent/login') && 
    !path.startsWith('/talent/register')
  
  const isOrganizerProtected = path.startsWith('/organizer') && 
    path !== '/organizer' &&
    !path.startsWith('/organizer/login') && 
    !path.startsWith('/organizer/register')

  // ✅ 未ログインで保護されたページにアクセス → ログインページへ
  if (!user) {
    if (isTalentProtected) {
      console.log('🔴 [Middleware] 未認証 → /talent/login へリダイレクト')
      const url = request.nextUrl.clone()
      url.pathname = '/talent/login'
      return NextResponse.redirect(url)
    }
    if (isOrganizerProtected) {
      console.log('🔴 [Middleware] 未認証 → /organizer/login へリダイレクト')
      const url = request.nextUrl.clone()
      url.pathname = '/organizer/login'
      return NextResponse.redirect(url)
    }
  }

  console.log('🔵 [Middleware] リダイレクトなし、そのまま通過')
  return response
}
