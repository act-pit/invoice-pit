'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type UserType = 'talent' | 'organizer' | null;

type AuthContextType = {
  user: User | null;
  session: Session | null;
  userType: UserType;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userType: null,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  // ユーザータイプを判定する関数
  async function determineUserType(userId: string): Promise<UserType> {
    try {
      // profilesテーブルをチェック（タレント）
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        console.log('✅ タレントとして識別');
        return 'talent';
      }

      // organizersテーブルをチェック（主催者）
      const { data: organizer } = await supabase
        .from('organizers')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (organizer) {
        console.log('✅ 主催者として識別');
        return 'organizer';
      }

      // どちらのテーブルにも存在しない
      console.warn('⚠️ ユーザーがprofiles/organizersテーブルに存在しません');
      return null;
    } catch (error) {
      console.error('❌ ユーザータイプ判定エラー:', error);
      return null;
    }
  }

  // 初期化処理
  useEffect(() => {
    initializeAuth();
  }, []);

  // 認証状態の変更を監視
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔔 Auth状態変更:', event);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const currentUser = newSession?.user ?? null;

        // メール確認チェック
        if (currentUser && !currentUser.email_confirmed_at) {
          console.warn('⚠️ メールアドレスが未確認');
          // メール未確認の場合はサインアウト
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setUserType(null);
          setLoading(false);
          return;
        }

        setSession(newSession);
        setUser(currentUser);

        // ユーザータイプを判定
        if (currentUser) {
          const type = await determineUserType(currentUser.id);
          setUserType(type);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setUserType(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function initializeAuth() {
    try {
      console.log('🔄 認証初期化開始');

      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ セッション取得エラー:', error);
        setLoading(false);
        return;
      }

      if (currentSession) {
        const currentUser = currentSession.user;

        // メール確認チェック
        if (!currentUser.email_confirmed_at) {
          console.warn('⚠️ メールアドレスが未確認 - サインアウト');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        console.log('✅ セッション存在:', {
          userId: currentUser.id,
          email: currentUser.email,
          emailConfirmed: !!currentUser.email_confirmed_at,
        });

        setSession(currentSession);
        setUser(currentUser);

        // ユーザータイプを判定
        const type = await determineUserType(currentUser.id);
        setUserType(type);
      } else {
        console.log('ℹ️ セッションなし');
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ 認証初期化エラー:', error);
      setLoading(false);
    }
  }

  async function refreshSession() {
    try {
      console.log('🔄 セッション更新開始');

      const {
        data: { session: newSession },
        error,
      } = await supabase.auth.refreshSession();

      if (error) {
        console.error('❌ セッション更新エラー:', error);
        return;
      }

      if (newSession) {
        const currentUser = newSession.user;

        // メール確認チェック
        if (!currentUser.email_confirmed_at) {
          console.warn('⚠️ メールアドレスが未確認');
          await supabase.auth.signOut();
          return;
        }

        console.log('✅ セッション更新成功');
        setSession(newSession);
        setUser(currentUser);

        // ユーザータイプを再判定
        const type = await determineUserType(currentUser.id);
        setUserType(type);
      }
    } catch (error) {
      console.error('❌ セッション更新エラー:', error);
    }
  }

  async function signOut() {
    try {
      console.log('🔄 サインアウト開始');

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ サインアウトエラー:', error);
        throw error;
      }

      console.log('✅ サインアウト成功');
      setSession(null);
      setUser(null);
      setUserType(null);
    } catch (error) {
      console.error('❌ サインアウトエラー:', error);
      throw error;
    }
  }

  const value = {
    user,
    session,
    userType,
    loading,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
