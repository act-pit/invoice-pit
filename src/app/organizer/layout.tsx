'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import type { Profile } from '@/types'

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 公開ページ（認証不要）
  const publicPaths = ['/organizer/login', '/organizer/register']
  const isPublicPath = publicPaths.includes(pathname)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session && !isPublicPath) {
          router.push('/organizer/login')
          return
        }

        if (session) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileData) {
            // 役割チェック
            if (profileData.role !== 'organizer' && profileData.role !== 'both') {
              await supabase.auth.signOut()
              router.push('/organizer/login')
              return
            }
            setProfile(profileData)
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router, supabase, isPublicPath])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/organizer/login')
    router.refresh()
  }

  // 公開ページはそのまま表示
  if (isPublicPath) {
    return <>{children}</>
  }

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  // 認証済み - 主催者専用レイアウト
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/organizer/dashboard" className="text-xl font-bold text-purple-600">
                Invoice Pit 主催者
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link
                  href="/organizer/dashboard"
                  className={`${
                    pathname === '/organizer/dashboard'
                      ? 'text-purple-600 font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  } transition`}
                >
                  ダッシュボード
                </Link>
                <Link
                  href="/organizer/invoices"
                  className={`${
                    pathname?.startsWith('/organizer/invoices')
                      ? 'text-purple-600 font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  } transition`}
                >
                  受信請求書
                </Link>
                <Link
                  href="/organizer/settings"
                  className={`${
                    pathname === '/organizer/settings'
                      ? 'text-purple-600 font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  } transition`}
                >
                  設定
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {profile?.organization_name || profile?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900 transition"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>

        {/* モバイルナビゲーション */}
        <nav className="md:hidden border-t border-gray-200 bg-white">
          <div className="flex justify-around py-2">
            <Link
              href="/organizer/dashboard"
              className={`flex-1 text-center py-2 text-sm ${
                pathname === '/organizer/dashboard'
                  ? 'text-purple-600 font-semibold'
                  : 'text-gray-600'
              }`}
            >
              ダッシュボード
            </Link>
            <Link
              href="/organizer/invoices"
              className={`flex-1 text-center py-2 text-sm ${
                pathname?.startsWith('/organizer/invoices')
                  ? 'text-purple-600 font-semibold'
                  : 'text-gray-600'
              }`}
            >
              請求書
            </Link>
            <Link
              href="/organizer/settings"
              className={`flex-1 text-center py-2 text-sm ${
                pathname === '/organizer/settings'
                  ? 'text-purple-600 font-semibold'
                  : 'text-gray-600'
              }`}
            >
              設定
            </Link>
          </div>
        </nav>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
