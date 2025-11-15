import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type'); // 'talent' or 'organizer'

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // コードを交換してセッションを確立
    await supabase.auth.exchangeCodeForSession(code);
  }

  // リダイレクト先を決定
  if (type === 'organizer') {
    return NextResponse.redirect(new URL('/organizer/login?confirmed=true', request.url));
  } else {
    return NextResponse.redirect(new URL('/talent/login?confirmed=true', request.url));
  }
}