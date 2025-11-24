'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, CheckCircle, Star, Users, Zap, Shield, Calculator, FileText, Award, ArrowRight, Clock, Smartphone, TrendingUp, BarChart3, Sparkles, Globe, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client'; // 🆕 追加

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});

  // 🆕 登録フォーム用のstate
  const [registrationType, setRegistrationType] = useState<'talent' | 'organizer' | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerCode, setOrganizerCode] = useState('');

  const supabase = createClient();


  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

    const handleEarlyAccess = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('事前登録:', email);
  };

  // 🆕 主催者コード生成関数
  const generateOrganizerCode = (length = 8) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const generateUniqueOrganizerCode = async (): Promise<string> => {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const code = generateOrganizerCode();
      const { data } = await supabase
        .from('organizers')
        .select('organizer_code')
        .eq('organizer_code', code)
        .maybeSingle();
      
      if (!data) return code;
      attempts++;
    }
    
    throw new Error('主催者コードの生成に失敗しました。');
  };

  // 🆕 キャスト登録処理（/talent/register と同じロジック）
  const handleTalentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationError('');
    setRegistrationLoading(true);

    if (!fullName || !email || !password) {
      setRegistrationError('すべての項目を入力してください');
      setRegistrationLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setRegistrationError('パスワードが一致しません');
      setRegistrationLoading(false);
      return;
    }

    if (password.length < 8) {
      setRegistrationError('パスワードは8文字以上にしてください');
      setRegistrationLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=talent`,
          data: { full_name: fullName },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
        });

        if (profileError) throw profileError;

        const { error: subscriptionError } = await supabase.from('subscriptions').insert({
          user_id: authData.user.id,
          plan: 'free',
          status: 'active',
          invoice_count: 0,
        });

        if (subscriptionError) throw subscriptionError;

        setRegistrationSuccess(true);
      }
    } catch (err: any) {
      setRegistrationError(err.message || '登録に失敗しました');
    } finally {
      setRegistrationLoading(false);
    }
  };

  // 🆕 主催者登録処理（/organizer/register と同じロジック）
  const handleOrganizerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationError('');
    setRegistrationLoading(true);

    if (!organizerName || !email || !password || !confirmPassword) {
      setRegistrationError('全ての項目を入力してください。');
      setRegistrationLoading(false);
      return;
    }

    if (password.length < 8) {
      setRegistrationError('パスワードは8文字以上である必要があります。');
      setRegistrationLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setRegistrationError('パスワードが一致しません。');
      setRegistrationLoading(false);
      return;
    }

    try {
      const newOrganizerCode = await generateUniqueOrganizerCode();
      setOrganizerCode(newOrganizerCode);

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role: 'organizer',
            organizer_name: organizerName,
            organizer_code: newOrganizerCode,
          },
        },
      });

      if (signUpError) throw signUpError;
      
      const userId = authData.user?.id;
      if (!userId) throw new Error('ユーザー情報の取得に失敗しました。');

      const { error: orgInsertError } = await supabase
        .from('organizers')
        .insert({
          id: userId,
          organizer_code: newOrganizerCode,
          company_name: organizerName,
          name: organizerName,
          email: email,
        });

      if (orgInsertError) throw orgInsertError;

      setRegistrationSuccess(true);
    } catch (err: any) {
      setRegistrationError(err.message || '予期しないエラーが発生しました。');
    } finally {
      setRegistrationLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 animate-fade-in">
              <div className="relative group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <FileText className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                請求書ぴっと
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-all duration-300 font-medium hover:scale-105">機能</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-all duration-300 font-medium hover:scale-105">料金</a>
              <a href="#about" className="text-gray-600 hover:text-blue-600 transition-all duration-300 font-medium hover:scale-105">概要</a>
              <Link href="talent/login" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold">
                タレントログイン
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 md:py-16 lg:py-20 overflow-hidden">
        {/* Animated Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="space-y-6" id="hero-content" data-animate>
              <div className={`inline-flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold shadow-sm transition-all duration-700 ${isVisible['hero-content'] ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
                <Sparkles className="h-4 w-4 mr-2 text-yellow-500 animate-pulse" />
                11月末公式リリース - 新規登録受付中
              </div>
              
              <h1 className={`text-4xl sm:text-5xl lg:text-7xl font-black leading-tight tracking-tight transition-all duration-1000 delay-100 ${isVisible['hero-content'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <span className="block bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent animate-gradient">
                  芸能フリーランスの
                </span>
                <span className="block bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent animate-gradient">
                  請求書作成
                </span>
                <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                  質問に答えるだけで
                </span>
                <span className="block relative inline-block">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                    たった1分で作成完了
                  </span>
                  <div className="absolute -bottom-3 left-0 right-0 h-3 bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-200 opacity-30 blur-sm animate-pulse"></div>
                </span>
              </h1>

              
              <p className={`text-m lg:text-m text-gray-700 leading-relaxed max-w-m mx-auto font-medium transition-all duration-1000 delay-300 ${isVisible['hero-content'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                源泉徴収の自動計算、公演数×ギャラ計算、税の対応/非対応、チケットバックやロイヤリティ、インボイス全て対応。<br />
                主催者連携機能を使えば、ワンクリックで送信、承認、入金まで完了。<br />
                <span className="text-blue-600 font-bold">芸能業界特化</span>の請求書管理で、創作活動に集中できます。
              </p>
            </div>

                        {/* CTA Form */}
            <div className={`max-w-2xl mx-auto transition-all duration-1000 delay-500 ${isVisible['hero-content'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              
              {/* 選択カード（Hero版） */}
              {!registrationType && !registrationSuccess && (
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => setRegistrationType('talent')}
                    className="bg-white border-2 border-blue-200 hover:border-blue-400 rounded-2xl p-5 transition-all duration-300 hover:scale-105 hover:shadow-xl text-center group"
                  >
                    <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🎭</div>
                    <h3 className="text-xl font-black text-gray-900 mb-1">キャスト-無料新規登録</h3>
                    <p className="text-sm text-gray-600">請求書の自動作成・送信</p>
                  </button>

                  <button
                    onClick={() => setRegistrationType('organizer')}
                    className="bg-white border-2 border-purple-200 hover:border-purple-400 rounded-2xl p-5 transition-all duration-300 hover:scale-105 hover:shadow-xl text-center group"
                  >
                    <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🎪</div>
                    <h3 className="text-xl font-black text-gray-900 mb-1">主催者-無料新規登録</h3>
                    <p className="text-sm text-gray-600">月0円スタート/請求書無制限管理</p>
                  </button>
                </div>
              )}

              {/* キャスト登録フォーム（Hero版） */}
              {registrationType === 'talent' && !registrationSuccess && (
                <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-blue-200">
                  <h3 className="text-2xl font-black mb-5 text-center text-gray-900">🎭 キャスト新規登録</h3>
                  
                  {registrationError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm text-center">
                      {registrationError}
                    </div>
                  )}

                  <form onSubmit={handleTalentRegister} className="space-y-3">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="お名前"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                      disabled={registrationLoading}
                      required
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="メールアドレス"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                      disabled={registrationLoading}
                      required
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="パスワード（8文字以上）"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                      disabled={registrationLoading}
                      required
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="パスワード（確認）"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                      disabled={registrationLoading}
                      required
                    />
                    <button
                      type="submit"
                      disabled={registrationLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {registrationLoading ? '登録中...' : '登録する'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegistrationType(null)}
                      className="w-full text-gray-600 py-2 hover:bg-gray-100 rounded-xl transition-all font-semibold"
                    >
                      ← 戻る
                    </button>
                  </form>
                </div>
              )}

              {/* 主催者登録フォーム（Hero版） */}
              {registrationType === 'organizer' && !registrationSuccess && (
                <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-purple-200">
                  <h3 className="text-2xl font-black mb-5 text-center text-gray-900">🎪 主催者新規登録</h3>
                  
                  {registrationError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm text-center">
                      {registrationError}
                    </div>
                  )}

                  <form onSubmit={handleOrganizerRegister} className="space-y-3">
                    <input
                      type="text"
                      value={organizerName}
                      onChange={(e) => setOrganizerName(e.target.value)}
                      placeholder="団体名・事務所名"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center"
                      disabled={registrationLoading}
                      required
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="メールアドレス"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center"
                      disabled={registrationLoading}
                      required
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="パスワード（8文字以上）"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center"
                      disabled={registrationLoading}
                      required
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="パスワード（確認）"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center"
                      disabled={registrationLoading}
                      required
                    />
                    <button
                      type="submit"
                      disabled={registrationLoading}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {registrationLoading ? '登録中...' : '登録する'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegistrationType(null)}
                      className="w-full text-gray-600 py-2 hover:bg-gray-100 rounded-xl transition-all font-semibold"
                    >
                      ← 戻る
                    </button>
                  </form>
                </div>
              )}

              {/* 登録成功画面（Hero版） */}
              {registrationSuccess && (
                <div className="bg-white rounded-2xl shadow-2xl p-8 text-center border-2 border-green-200">
                  <div className="text-6xl mb-4">✉️</div>
                  <h3 className="text-2xl font-black text-gray-900 mb-4">確認メールを送信しました</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    <span className="font-bold text-blue-600">{email}</span> に確認メールを送信しました。<br />
                    メール内のリンクをクリックして、登録を完了してください。
                  </p>
                  {registrationType === 'organizer' && organizerCode && (
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-6">
                      <p className="text-sm text-purple-800 font-bold mb-1">あなたの主催者コード</p>
                      <p className="text-2xl font-black text-purple-600">{organizerCode}</p>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setRegistrationSuccess(false);
                      setRegistrationType(null);
                      setEmail('');
                      setPassword('');
                      setConfirmPassword('');
                      setFullName('');
                      setOrganizerName('');
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition-all"
                  >
                    トップページに戻る
                  </button>
                </div>
              )}

              {/* 注意書き（選択カード表示時のみ） */}
              {!registrationType && !registrationSuccess && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  会計知識/PC不要 • 初期利用無料 • スマホ完全対応
                </p>
              )}
            </div>


            {/* Key Features Pills */}
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              {[
                { icon: Clock, text: "0円スタート", color: "from-green-500 to-emerald-500", delay: 600 },
                { icon: Shield, text: "会計知識不要", color: "from-blue-500 to-indigo-500", delay: 700 },
                { icon: Smartphone, text: "スマホ対応", color: "from-purple-500 to-pink-500", delay: 800 },
                { icon: Calculator, text: "自動作成", color: "from-orange-500 to-red-500", delay: 900 }
              ].map((item, index) => (
                <div key={index} className={`group transition-all duration-700 delay-${item.delay} ${isVisible['hero-content'] ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                  <div className={`flex items-center space-x-2 bg-white px-5 py-3 rounded-full shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-110`}>
                    <div className={`bg-gradient-to-r ${item.color} p-2 rounded-full transition-transform duration-300 group-hover:rotate-12`}>
                      <item.icon className="h-4 w-4 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="font-semibold text-gray-700">{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 md:py-10 bg-white border-y border-gray-200" id="stats" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-8 transition-all duration-700 ${isVisible['stats'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <p className="text-gray-600 font-medium">
              <span className="text-blue-600 font-bold">ACTぴっと</span>運営チームが開発
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "3万人+", label: "ACTぴっとユーザー", icon: Users, delay: 100 },
              { number: "100社+", label: "登録団体・事務所", icon: Globe, delay: 200 },
              { number: "15年", label: "制作活動実績", icon: Calculator, delay: 300 },
              { number: "1分", label: "請求書作成時間", icon: Zap, delay: 400 }
            ].map((stat, index) => (
              <div key={index} className={`text-center group cursor-pointer transition-all duration-700 delay-${stat.delay} ${isVisible['stats'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-3 group-hover:scale-110 transition-all duration-300 group-hover:rotate-6">
                  <stat.icon className="h-7 w-7 text-blue-600" strokeWidth={2} />
                </div>
                <div className="text-3xl font-black text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300">{stat.number}</div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
                {/* 🆕 ACTぴっとへのリンク追加 */}
          <div className="text-center mt-8">
            <a 
              href="https://act-pit.com/lp/new/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-blue-600 transition-all duration-300 inline-flex items-center gap-1"
            >
              ACTぴっと（演劇特化型チケット販売システム）はこちら
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50" id="problems" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-10 md:mb-14 transition-all duration-700 ${isVisible['problems'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-3">
              こんなお悩み、
              <span className="relative inline-block">
                <span className="text-red-500">ありませんか？</span>
                <div className="absolute -bottom-2 left-0 right-0 h-3 bg-red-200 opacity-30 animate-pulse"></div>
              </span>
            </h2>
              <p className="text-base md:text-lg lg:text-xl text-gray-600">芸能フリーランス特有の課題を解決</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              { emoji: "😵‍💫", title: "源泉徴収の計算が複雑", desc: "10.21%と20.42%の使い分けや税込・税抜の計算が分からない", color: "from-red-500 to-orange-500", delay: 100 },
              { emoji: "⏰", title: "請求書作成に時間がかかる", desc: "創作活動の時間が削られるし、内容が合ってるかどうかも分からない", color: "from-orange-500 to-yellow-500", delay: 200 },
              { emoji: "📱", title: "スマホで作業できない", desc: "そもそもExcelもPCも持ってないからスマホでサッと作りたい...", color: "from-yellow-500 to-green-500", delay: 300 },
              { emoji: "💸", title: "既存ツールが高すぎる", desc: "月額1,000円は収入が不安定な時期には重いしスマホでは使いづらい...", color: "from-green-500 to-blue-500", delay: 400 },
              { emoji: "🎭", title: "業界特有の項目に非対応", desc: "公演数×ギャラ、チケットバック、ロイヤリティに対応していない...", color: "from-blue-500 to-indigo-500", delay: 500 },
              { emoji: "📄", title: "請求書管理がバラバラ", desc: "送った後のやりとりも、過去の請求書を探すのも一苦労...", color: "from-indigo-500 to-purple-500", delay: 600 }
            ].map((item, index) => (
              <div key={index} className={`group relative transition-all duration-700 delay-${item.delay} ${isVisible['problems'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl blur-xl`}></div>
                <div className="relative bg-white p-5 md:p-6 lg:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-transparent hover:-translate-y-2">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="text-3xl md:text-4xl lg:text-5xl group-hover:scale-110 transition-transform duration-300">{item.emoji}</div>
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${item.color} animate-pulse`}></div>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">{item.title}</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Solution Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" id="features" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-10 md:mb-14 transition-all duration-700 ${isVisible['features'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold mb-4 md:mb-5 animate-bounce-slow">
              <Zap className="h-4 w-4 mr-2" />
              ソリューション
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4 md:mb-5">
              すべて
              <span className="relative inline-block mx-3">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">自動化</span>
                <div className="absolute -bottom-2 left-0 right-0 h-3 bg-blue-200 opacity-30 animate-pulse"></div>
              </span>
              します
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              面倒な計算や入力作業から解放され、<br className="hidden sm:block" />
              本当に大切な<span className="font-bold text-blue-600">創作活動</span>に時間を使えます
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
            {[
              {
                icon: Calculator,
                title: "源泉徴収10.21%自動計算",
                desc: "複雑な税計算も項目を選ぶだけで一発完了。ギャラとロイヤリティの区別も自動判定。",
                gradient: "from-blue-500 to-cyan-500",
                delay: 100
              },
              {
                icon: Smartphone,
                title: "スマホ完全対応",
                desc: "現場でも移動中でもサクッと作成。PCもExcelも税知識も一切不要。スマホだけで完結。",
                gradient: "from-purple-500 to-pink-500",
                delay: 200
              },
              {
                icon: Zap,
                title: "1分で請求書完成",
                desc: "質問の項目を選んで金額を入力するだけ。後は、自動で計算・生成・送信・PDF化まで全て完了。",
                gradient: "from-orange-500 to-red-500",
                delay: 300
              },
              {
                icon: Shield,
                title: "インボイス制度対応",
                desc: "T番号の管理・記載、適格請求書の要件を完全クリア。法改正にも自動対応で確定申告も安心。",
                gradient: "from-green-500 to-emerald-500",
                delay: 400
              },
              {
                icon: FileText,
                title: "データ永久保存",
                desc: "作成した請求書は自動でクラウド保存。検索・フィルターで過去のデータも瞬時に発見。",
                gradient: "from-indigo-500 to-blue-500",
                delay: 500
              },
              {
                icon: Users,
                title: "主催者連携機能",
                desc: "主催者コードを入力すれば、主催者にアプリ上で請求書の送付が可能。承認フローも入金管理も簡単実現。",
                gradient: "from-pink-500 to-rose-500",
                delay: 600
              }
            ].map((feature, index) => (
              <div key={index} className={`group relative transition-all duration-700 delay-${feature.delay} ${isVisible['features'] ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl blur-xl`}></div>
                <div className="relative bg-white p-5 md:p-6 lg:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-transparent hover:-translate-y-2">
                  <div className="flex items-start space-x-3 md:space-x-4 lg:space-x-5">
                    <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                      <feature.icon className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">{feature.title}</h3>
                      <p className="text-sm md:text-base text-gray-600 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section id="pricing" className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-10 md:mb-14 transition-all duration-700 ${isVisible['pricing'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold mb-4 md:mb-5 animate-bounce-slow">
              <TrendingUp className="h-4 w-4 mr-2" />
              料金プラン
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4 md:mb-5">
              <span className="relative inline-block">
                <span className="text-green-600">圧倒的</span>
                <div className="absolute -bottom-2 left-0 right-0 h-3 bg-green-200 opacity-30 animate-pulse"></div>
              </span>
              なコスパ
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600">
              3ヶ月無料<br/>月額わずか<span className="font-black text-green-600 text-xl md:text-2xl">165円</span>で、<br/>請求書作成の悩みから完全解放
            </p>
          </div>


          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* キャスト向けプラン */}
            <div className={`relative group transition-all duration-700 delay-200 ${isVisible['pricing'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl blur-2xl"></div>
              <div className="relative bg-white rounded-3xl shadow-xl p-10 border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce-slow">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    キャスト向け
                  </div>
                </div>
                
                <div className="text-center mb-8 mt-4 -mx-4 sm:mx-0">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 px-4 sm:px-0">シンプルな料金体系</h3>
                  
                  {/* 1つのプランカード */}
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-300 relative">
                                        
                    {/* ステップ1: 無料期間 */}
                    <div className="bg-white rounded-xl p-6 sm:p-7 mb-5 border-2 border-green-300 shadow-lg">
                      <div className="inline-block bg-green-500 text-white px-5 py-2 rounded-full text-sm font-black mb-4 animate-pulse">
                        🎉 まずは完全無料で開始
                      </div>
                      <div className="flex items-baseline justify-center mb-3">
                        <span className="text-6xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">¥0</span>
                      </div>
                      <p className="text-base text-gray-700 font-bold mb-2">
                        <span className="text-green-600 text-lg">3ヶ月間</span> または <span className="text-green-600 text-lg">3通まで</span>
                      </p>
                      <p className="text-sm text-gray-600 font-semibold">全機能使い放題！</p>
                      <p className="text-xs text-gray-500 mt-2">※どちらか早い方まで</p>
                    </div>

                    {/* 矢印 */}
                    <div className="flex justify-center mb-5">
                      <div className="bg-white rounded-full px-5 py-2 border-2 border-gray-300 text-sm font-bold text-gray-600">
                        無料期間終了後は...
                      </div>
                    </div>

                    {/* ステップ2: 選択肢 */}
                    <div className="bg-white rounded-xl p-6 sm:p-7 border-2 border-blue-300 shadow-lg">
                      <p className="text-base font-bold text-gray-700 mb-5">
                        👉 あなたが<span className="text-blue-600 text-lg">選択できます</span>
                      </p>
                      
                      <div className="space-y-4 text-left mb-5">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">✅</span>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 text-base">そのまま継続する</p>
                            <p className="text-xs text-gray-600">1,980円/年で使い放題</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">✅</span>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 text-base">無料期間で終了</p>
                            <p className="text-xs text-gray-600">料金は一切かかりません</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-xs text-blue-800 font-bold mb-2">
                          💡 継続する場合の料金
                        </p>
                        <div className="flex items-baseline justify-center mt-2 mb-2">
                          <span className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">¥1,980</span>
                          <span className="text-lg text-gray-500 ml-2">/年</span>
                        </div>
                        <p className="text-xs text-gray-600">月額わずか165円<br/>請求書作成・管理無制限<br/>案件情報も取得可能</p>
                      </div>
                    </div>

                  </div>

                  <p className="text-sm text-gray-600 mt-4 font-bold px-4 sm:px-0">
                    ✨ リスクゼロ！まずは無料で始めて、気に入ったら続けるだけ
                  </p>
                </div>


                
                <div className="space-y-4 mb-8">
                  {[
                    "データ永久保存",
                    "源泉徴収自動計算",
                    "モバイル完全対応", 
                    "主催者連携/自動送受信",
                    "3ヶ月無料体験",
                    "請求書作成無制限",
                    "オーディション情報取得",
                    "仕事依頼を受けることが可能"
                  ].map((feature, index) => (
                    <div key={index} className={`flex items-center space-x-3 transition-all duration-300 delay-${index * 100} ${isVisible['pricing'] ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-5'}`}>
                      <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <CheckCircle className="h-4 w-4 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link href="/talent/register" className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 text-center">
                  今すぐ無料で始める
                </Link>
              </div>
            </div>

            {/* 主催者向けプラン */}
            <div className={`relative group transition-all duration-700 delay-400 ${isVisible['pricing'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 rounded-3xl blur-2xl animate-pulse-slow"></div>
              <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-3xl shadow-2xl p-10 hover:-translate-y-2 hover:shadow-3xl transition-all duration-300">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce-slow">
                  <div className="bg-white text-purple-600 px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    主催者向け
                  </div>
                </div>
                
                <div className="text-center mb-8 mt-4 -mx-4 sm:mx-0">
                  <h3 className="text-2xl font-bold mb-6 px-4 sm:px-0">シンプルな料金体系</h3>
                  
                  {/* プランカード */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 border-2 border-white/30 relative">
                    
                    {/* フリープラン */}
                    <div className="bg-white/95 text-gray-900 rounded-xl p-5 sm:p-6 mb-4 border-2 border-green-300 shadow-lg">
                      <div className="inline-block bg-green-500 text-white px-5 py-2 rounded-full text-sm font-black mb-3 animate-pulse">
                        🎉 まずは完全無料でスタート
                      </div>
                      <div className="flex items-baseline justify-center mb-2">
                        <span className="text-5xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">¥0</span>
                        <span className="text-lg text-gray-500 ml-2">/月</span>
                      </div>
                      <p className="text-sm font-bold text-gray-700 mb-2">基本機能が無料</p>
                      <div className="text-left space-y-1 text-xs text-gray-600">
                        <p>✓ 請求書受領・承認</p>
                        <p>✓ 基本管理機能</p>
                      </div>
                    </div>

                    {/* 矢印 */}
                    <div className="flex justify-center mb-4">
                      <div className="bg-white/90 text-gray-700 rounded-full px-4 py-2 border-2 border-white/50 text-xs font-bold">
                        必要に応じてアップグレード
                      </div>
                    </div>

                    {/* 有料プラン選択 */}
                    <div className="bg-white/95 text-gray-900 rounded-xl p-5 sm:p-6 border-2 border-white/50 shadow-lg">
                      <p className="text-sm font-bold mb-4">
                        👉 <span className="text-purple-600 text-base">3つのプランから選択</span>
                      </p>
                      
                      <div className="space-y-3 text-left">
                        {/* ベーシック */}
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <div className="flex justify-between items-baseline mb-2">
                            <span className="font-black text-blue-600">ベーシック</span>
                            <div>
                              <span className="text-2xl font-black text-blue-600">¥980</span>
                              <span className="text-sm text-gray-500">/月</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>✓ 支払期日アラート表示</p>
                            <p>✓ 差し戻し機能</p>
                            <p>✓ 承認待ち一覧表示</p>
                            <p>✓ CSV出力</p>
                          </div>
                        </div>

                        {/* アドバンス */}
                        <div className="bg-purple-50 rounded-lg p-3 border-2 border-purple-300">
                          <div className="inline-block bg-purple-500 text-white px-2 py-1 rounded text-xs font-bold mb-2">
                            人気
                          </div>
                          <div className="flex justify-between items-baseline mb-2">
                            <span className="font-black text-purple-600">アドバンス</span>
                            <div>
                              <span className="text-2xl font-black text-purple-600">¥1,980</span>
                              <span className="text-sm text-gray-500">/月</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>✓ ベーシック機能すべて</p>
                            <p>✓ CSVカスタム・会計フォーマット</p>
                            <p>✓ 月次支払いレポート（手動）</p>
                            <p>✓ 案件・AD情報掲載 1件/月</p>
                          </div>
                        </div>

                        {/* プロ */}
                        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-3 border border-pink-200">
                          <div className="flex justify-between items-baseline mb-2">
                            <span className="font-black text-pink-600">プロ</span>
                            <div>
                              <span className="text-2xl font-black text-pink-600">¥2,980</span>
                              <span className="text-sm text-gray-500">/月</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>✓ アドバンス機能すべて</p>
                            <p>✓ 全銀協・API連携</p>
                            <p>✓ 月次支払い自動レポート</p>
                            <p>✓ 案件・AD情報掲載 2件/月</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <p className="text-xs text-yellow-800 font-bold text-center">
                          🎁 ACTぴっと連動で<span className="text-base">全プラン30%OFF</span>
                        </p>
                      </div>
                    </div>

                  </div>

                  <p className="text-xs text-white/80 mt-4 font-semibold px-4 sm:px-0">
                    ✨ フリープランで始めて、必要な機能だけ追加可能
                  </p>
                </div>

                <Link href="/organizer/register" className="block w-full bg-white text-purple-600 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 text-center mt-6">
                  今すぐ無料で始める
                </Link>

              </div>
            </div>

          </div>

          <div className={`text-center mt-12 transition-all duration-700 delay-600 ${isVisible['pricing'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <p className="text-gray-600 mb-6 text-lg">
              まずは<span className="font-black text-blue-600 text-xl">無料</span>で3ヶ月お試し
            </p>
          </div>
        </div>
      </section>

      {/* ACTぴっと連携 */}
      <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50" id="about" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-10 md:mb-14 transition-all duration-700 ${isVisible['about'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4 md:mb-5">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">ACTぴっと</span>
              連携で
              <br />
              さらに便利に
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              3万人が利用する演劇チケットシステム「ACTぴっと」との連携で、
              <br className="hidden sm:block" />
              チケット販売から請求まで<br/><span className="font-bold text-purple-600">一気通貫</span>
            </p>
          </div>


          <div className="grid lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {[
              {
                icon: Award,
                title: "シームレス連携",
                desc: "ACTぴっとでチケット販売した後、売上データやチケットバック金額を請求書に反映。",
                gradient: "from-purple-500 to-pink-500",
                delay: 200
              },
              {
                icon: Users,
                title: "3万人のネットワーク",
                desc: "既存の演劇・芸能コミュニティとの連携で出演募集、応募、チケット販売までスムーズ導入。",
                gradient: "from-blue-500 to-indigo-500",
                delay: 400
              },
              {
                icon: CheckCircle,
                title: "特別割引永年30%OFF",
                desc: "ACTぴっと登録事業者は主催者プランが30%OFF。公演をDXの面から充実サポート！",
                gradient: "from-green-500 to-emerald-500",
                delay: 600
              }
            ].map((item, index) => (
              <div key={index} className={`group relative transition-all duration-700 delay-${item.delay} ${isVisible['about'] ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl blur-xl`}></div>
                <div className="relative text-center p-5 md:p-6 lg:p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2">
                  <div className={`inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-r ${item.gradient} rounded-2xl mb-4 md:mb-5 lg:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                    <item.icon className="h-7 w-7 md:h-8 md:w-8 lg:h-10 lg:w-10 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">{item.title}</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


            {/* Final CTA Section */}
            <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-float-delayed"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10" id="cta" data-animate>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 md:mb-4 lg:mb-5 transition-all duration-700 ${isVisible['cta'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            創作活動に集中しませんか？
          </h2>
          <p className={`text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-6 md:mb-8 lg:mb-10 leading-relaxed transition-all duration-700 delay-200 ${isVisible['cta'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            面倒な請求書作成や管理から解放されて、<br />圧倒的な時間の有効活用。<br />
            今なら、タレント機能を<br/><span className="font-black text-white text-lg sm:text-xl md:text-2xl animate-pulse">3ヶ月完全無料</span>でご利用いただけます。
          </p>


          
          {/* 選択カード */}
          {!registrationType && !registrationSuccess && (
            <div className={`grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8 transition-all duration-700 delay-400 ${isVisible['cta'] ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <button
                onClick={() => setRegistrationType('talent')}
                className="bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:border-white hover:bg-white/20 rounded-2xl p-6 transition-all duration-300 hover:scale-105 text-center"
              >
                <div className="text-4xl mb-3">🎭</div>
                <h3 className="text-xl font-black mb-1">キャストとして登録</h3>
                <p className="text-sm text-blue-100">請求書の自動作成・送信</p>
              </button>

              <button
                onClick={() => setRegistrationType('organizer')}
                className="bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:border-white hover:bg-white/20 rounded-2xl p-6 transition-all duration-300 hover:scale-105 text-center"
              >
                <div className="text-4xl mb-3">🎪</div>
                <h3 className="text-xl font-black mb-1">主催者として登録</h3>
                <p className="text-sm text-blue-100">月0円スタート/請求書無制限管理</p>
              </button>
            </div>
          )}

          {/* キャスト登録フォーム */}
          {registrationType === 'talent' && !registrationSuccess && (
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 text-gray-900">
              <h3 className="text-2xl font-black mb-6 text-center">🎭 キャスト新規登録</h3>
              
              {registrationError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {registrationError}
                </div>
              )}

              <form onSubmit={handleTalentRegister} className="space-y-4">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="お名前"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={registrationLoading}
                  required
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="メールアドレス"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={registrationLoading}
                  required
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワード（8文字以上）"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={registrationLoading}
                  required
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="パスワード（確認）"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={registrationLoading}
                  required
                />
                <button
                  type="submit"
                  disabled={registrationLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {registrationLoading ? '登録中...' : '登録する'}
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationType(null)}
                  className="w-full text-gray-600 py-3 hover:bg-gray-100 rounded-xl transition-all"
                >
                  ← 戻る
                </button>
              </form>
            </div>
          )}

          {/* 主催者登録フォーム */}
          {registrationType === 'organizer' && !registrationSuccess && (
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 text-gray-900">
              <h3 className="text-2xl font-black mb-6 text-center">🎪 主催者新規登録</h3>
              
              {registrationError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {registrationError}
                </div>
              )}

              <form onSubmit={handleOrganizerRegister} className="space-y-4">
                <input
                  type="text"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  placeholder="団体名・事務所名"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={registrationLoading}
                  required
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="メールアドレス"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={registrationLoading}
                  required
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワード（8文字以上）"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={registrationLoading}
                  required
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="パスワード（確認）"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={registrationLoading}
                  required
                />
                <button
                  type="submit"
                  disabled={registrationLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {registrationLoading ? '登録中...' : '登録する'}
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationType(null)}
                  className="w-full text-gray-600 py-3 hover:bg-gray-100 rounded-xl transition-all"
                >
                  ← 戻る
                </button>
              </form>
            </div>
          )}

          {/* 登録成功画面 */}
          {registrationSuccess && (
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-10 text-gray-900 text-center">
              <div className="text-6xl mb-4">✉️</div>
              <h3 className="text-2xl font-black mb-4">確認メールを送信しました</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                <span className="font-bold">{email}</span> に確認メールを送信しました。<br />
                メール内のリンクをクリックして、登録を完了してください。
              </p>
              {registrationType === 'organizer' && organizerCode && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-purple-800 font-bold mb-1">あなたの主催者コード</p>
                  <p className="text-2xl font-black text-purple-600">{organizerCode}</p>
                </div>
              )}
              <button
                onClick={() => {
                  setRegistrationSuccess(false);
                  setRegistrationType(null);
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                  setFullName('');
                  setOrganizerName('');
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
              >
                トップページに戻る
              </button>
            </div>
          )}

          {!registrationType && !registrationSuccess && (
            <div className={`flex flex-wrap justify-center items-center gap-8 text-sm text-blue-100 transition-all duration-700 delay-600 ${isVisible['cta'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {[
                { icon: Shield, text: "安心の日本製" },
                { icon: Clock, text: "まずは無料でスタート" },
                { icon: CheckCircle, text: "いつでも解約OK" },
                { icon: Lock, text: "データ暗号化" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2 hover:scale-110 transition-transform duration-300">
                  <item.icon className="h-5 w-5" strokeWidth={2.5} />
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-2xl font-bold">請求書ぴっと</span>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed text-lg">
                芸能フリーランスの請求書作成を革新する、<br />
                業界特化型SaaSサービス
              </p>
              <div className="text-sm text-gray-500">
                © 2025 請求書ぴっと - All Rights Reserved
              </div>
            </div>
            
            <div>
              <h3 className="font-bold mb-6 text-lg">サービス</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/talent" className="hover:text-white transition-all duration-300 hover:translate-x-1 inline-block">タレント向け</Link></li>
                <li><Link href="/organizer" className="hover:text-white transition-all duration-300 hover:translate-x-1 inline-block">主催者向け</Link></li>
                <li><a href="#pricing" className="hover:text-white transition-all duration-300 hover:translate-x-1 inline-block">料金プラン</a></li>
                <li><a href="#features" className="hover:text-white transition-all duration-300 hover:translate-x-1 inline-block">機能一覧</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-6 text-lg">サポート</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-all duration-300 hover:translate-x-1 inline-block">よくある質問</a></li>
                <li><a href="#" className="hover:text-white transition-all duration-300 hover:translate-x-1 inline-block">お問い合わせ</a></li>
                <li><a href="#" className="hover:text-white transition-all duration-300 hover:translate-x-1 inline-block">利用規約</a></li>
                <li><a href="#" className="hover:text-white transition-all duration-300 hover:translate-x-1 inline-block">プライバシーポリシー</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}