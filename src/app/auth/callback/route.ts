// src/app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type'); // 'talent' or 'organizer'
  const next = requestUrl.searchParams.get('next'); // パスワードリセット用

  console.log('=== Auth Callback ===');
  console.log('Code:', code ? 'exists' : 'missing');
  console.log('Type:', type);
  console.log('Next:', next);

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
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('❌ Code exchange error:', exchangeError);
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    console.log('✅ Session created');
    
    // ✅ パスワードリセットの場合は /auth/update-password にリダイレクト
    if (next && next.includes('/auth/update-password')) {
      console.log('➡️ Redirecting to update-password');
      return NextResponse.redirect(new URL('/auth/update-password', request.url));
    }
    
    // user_metadataからuser_typeを取得（typeパラメータがない場合のフォールバック）
    const { data: { user } } = await supabase.auth.getUser();
    const userType = type || user?.user_metadata?.user_type;
    
    console.log('User type:', userType);
    
    // user_typeに応じてログイン画面にリダイレクト
    if (userType === 'talent') {
      console.log('➡️ Redirecting to talent login');
      return NextResponse.redirect(new URL('/talent/login', request.url));
    }
    
    if (userType === 'organizer') {
      console.log('➡️ Redirecting to organizer login');
      return NextResponse.redirect(new URL('/organizer/login', request.url));
    }
  }

  // タイプが不明な場合はトップページへ
  console.log('⚠️ Unknown type, redirecting to home');
  return NextResponse.redirect(new URL('/', request.url));
}
