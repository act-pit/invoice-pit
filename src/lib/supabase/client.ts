// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

// タイムアウト付きfetch
function fetchWithTimeout(timeout = 15000) {
  return (url: RequestInfo | URL, options: RequestInit = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    return fetch(url, {
      ...options,
      signal: controller.signal,
    })
      .catch((error) => {
        // タイムアウトまたはネットワークエラー
        if (error.name === 'AbortError') {
          console.error('🔴 [Supabase] リクエストタイムアウト:', url);
          throw new Error('ネットワークタイムアウト。もう一度お試しください。');
        }
        throw error;
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });
  };
}

export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'supabase-auth-token',
        // セッションの自動リフレッシュ
        autoRefreshToken: true,
        persistSession: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'invoice-pit-mobile',
        },
        // タイムアウト付きfetchを使用
        fetch: fetchWithTimeout(15000),
      },
    }
  );

  return client;
}

// 強制的にセッションをクリアする関数（緊急用）
export async function forceSignOut() {
  try {
    const client = createClient();
    await client.auth.signOut();
  } catch (error) {
    console.error('signOut失敗、ローカルのみクリア:', error);
  } finally {
    // エラーでも必ずローカルストレージをクリア
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase-auth-token');
      // すべてのsupabase関連のキーを削除
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
    }
  }
}
