import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const path = request.nextUrl.pathname

  // 公開パス（認証不要）
  const publicPaths = ['/', '/login', '/register', '/organizer/login', '/organizer/register']
  
  // キャスト専用パス
  const castPaths = ['/dashboard', '/invoices', '/settings', '/subscription']
  
  // 主催者専用パス
  const organizerPaths = ['/organizer/dashboard', '/organizer/invoices', '/organizer/settings']

  // 公開パスまたはAPIはスキップ
  if (publicPaths.includes(path) || path.startsWith('/api')) {
    return response
  }

  // 未認証の場合
  if (!session) {
    // 主催者エリアへのアクセス
    if (path.startsWith('/organizer')) {
      return NextResponse.redirect(new URL('/organizer/login', request.url))
    }
    // キャストエリアへのアクセス
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 認証済みの場合、プロフィールから役割を取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const userRole = profile?.role

  // 主催者がキャスト専用エリアにアクセス
  if (userRole === 'organizer' && castPaths.some(p => path.startsWith(p))) {
    return NextResponse.redirect(new URL('/organizer/dashboard', request.url))
  }

  // キャストが主催者専用エリアにアクセス
  if (userRole === 'cast' && organizerPaths.some(p => path.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
