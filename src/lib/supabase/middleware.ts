// src/lib/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  const { data: { user } } = await supabase.auth.getUser()
  console.log('🔵 [Middleware] User:', user ? 'あり' : 'なし')

  const path = request.nextUrl.pathname

  // 保護されたルートの定義
  const isTalentProtected = path.startsWith('/talent') && 
    !path.startsWith('/talent/login') && 
    !path.startsWith('/talent/signup')
  
  const isOrganizerProtected = path.startsWith('/organizer') && 
    !path.startsWith('/organizer/login') && 
    !path.startsWith('/organizer/signup')

  // ✅ 未ログインで保護されたページにアクセス → ログインページへ（これだけ有効）
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

  // ❌ ログイン済み時のリダイレクトを一旦コメントアウト
  // if (user) {
  //   if (path === '/talent/login' || path === '/talent/signup') {
  //     console.log('🟢 [Middleware] 認証済み → /talent/dashboard へリダイレクト')
  //     const url = request.nextUrl.clone()
  //     url.pathname = '/talent/dashboard'
  //     return NextResponse.redirect(url)
  //   }
  //   if (path === '/organizer/login' || path === '/organizer/signup') {
  //     console.log('🟢 [Middleware] 認証済み → /organizer/dashboard へリダイレクト')
  //     const url = request.nextUrl.clone()
  //     url.pathname = '/organizer/dashboard'
  //     return NextResponse.redirect(url)
  //   }
  // }

  console.log('🔵 [Middleware] リダイレクトなし、そのまま通過')
  return response
}