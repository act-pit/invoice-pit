import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type'); // 'talent' or 'organizer'

  if (code) {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // コードをセッションに交換
    await supabase.auth.exchangeCodeForSession(code);
  }

  // タイプに応じてリダイレクト
  if (type === 'talent') {
    return NextResponse.redirect(new URL('/talent/dashboard', request.url));
  }
  
  if (type === 'organizer') {
    return NextResponse.redirect(new URL('/organizer/dashboard', request.url));
  }

  // タイプが不明な場合はトップページへ
  return NextResponse.redirect(new URL('/', request.url));
}
