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
    path !== '/talent' &&
    !path.startsWith('/talent/login') && 
    !path.startsWith('/talent/register')
  
  const isOrganizerProtected = path.startsWith('/organizer') && 
    path !== '/organizer' &&
    !path.startsWith('/organizer/login') && 
    !path.startsWith('/organizer/register')

  // 未ログインで保護されたページにアクセス → ログインページへ
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
