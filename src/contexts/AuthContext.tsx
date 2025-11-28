'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type UserType = 'talent' | 'organizer' | null;

interface TalentData {
  id: string;
  email: string;
  full_name: string;
  bank_name?: string | null;
  branch_name?: string | null;
  account_type?: string | null;
  account_number?: string | null;
  account_holder?: string | null;
  invoice_reg_number?: string | null;
  postal_code?: string | null;
  address?: string | null;
  phone?: string | null;
  occupation_types?: string[] | null;
  activity_areas?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

interface OrganizerData {
  id: string;
  email: string;
  name: string | null;
  company_name: string | null;
  organizer_code: string | null;
  postal_code: string | null;
  address: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

type UserProfile = 
  | { type: 'talent'; data: TalentData }
  | { type: 'organizer'; data: OrganizerData }
  | null;

type AuthContextType = {
  user: User | null;
  session: Session | null;
  userType: UserType;
  profile: UserProfile;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [profile, setProfile] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const isInitializedRef = useRef(false); // ← 追加

  const determineUserType = async (userId: string): Promise<UserProfile> => {
    try {
      console.log('🔵 determineUserType: 開始', userId);
      
      const timeoutPromise = new Promise<UserProfile>((_, reject) => 
        setTimeout(() => reject(new Error('UserType判定タイムアウト')), 3000) // ← 3秒に短縮
      );

const checkUserType = async (): Promise<UserProfile> => {
  const supabase = createClient();
  
  // ✅ 先に主催者をチェック
  const { data: organizerData, error: organizerError } = await supabase
    .from('organizers')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  console.log('🔵 organizers結果:', organizerData, organizerError);

  if (organizerData) {
    console.log('✅ 主催者確認成功:', organizerData.company_name || organizerData.name);
    return { type: 'organizer', data: organizerData };
  }

  // 主催者でなければタレント
  const { data: talentData, error: talentError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  console.log('🔵 profiles結果:', talentData, talentError);

  if (talentData) {
    console.log('✅ タレント確認成功:', talentData.full_name);
    return { type: 'talent', data: talentData };
  }

  return null;
};


      const result = await Promise.race([checkUserType(), timeoutPromise]);
      console.log('🟢 determineUserType: 完了', result);
      return result;

    } catch (error) {
      console.error('🔴 determineUserType: エラー', error);
      return null;
    }
  };

  useEffect(() => {
    const supabase = createClient();

    const init = async () => {
      try {
        console.log('🔵 AuthContext: 初期化開始');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔴 AuthContext: セッション取得エラー:', error);
          setLoading(false);
          return;
        }

        console.log('🔵 AuthContext: セッション取得完了', session ? 'あり' : 'なし');
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const userProfile = await determineUserType(session.user.id);
          console.log('🔵 AuthContext: ユーザープロフィール:', userProfile);
          setProfile(userProfile);
          setUserType(userProfile?.type || null);
        }
        
        isInitializedRef.current = true; // ← 初期化完了フラグを立てる
      } catch (error) {
        console.error('🔴 AuthContext: 初期化エラー:', error);
      } finally {
        console.log('🟢 AuthContext: 初期化完了、loading=false');
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔵 AuthContext: 認証状態変更:', event);
        
        // ← 初回のSIGNED_INイベントをスキップ
        if (!isInitializedRef.current && event === 'SIGNED_IN') {
          console.log('⏭️ AuthContext: 初回SIGNED_INをスキップ');
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('🔵 AuthContext: プロフィール取得開始');
          const userProfile = await determineUserType(session.user.id);
          setProfile(userProfile);
          setUserType(userProfile?.type || null);
          console.log('✅ AuthContext: プロフィール取得完了');
        } else {
          setProfile(null);
          setUserType(null);
        }

        setLoading(false);
      }
    );

    return () => {
      console.log('🔵 AuthContext: クリーンアップ');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserType(null);
    setProfile(null);
    router.push('/');
  };

  const refreshSession = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
    
    if (session?.user) {
      const userProfile = await determineUserType(session.user.id);
      setProfile(userProfile);
      setUserType(userProfile?.type || null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userType,
        profile,
        loading,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
