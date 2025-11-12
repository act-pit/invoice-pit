-- 既存のテーブルがあれば削除（クリーンアップ）
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.organizers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ユーザープロフィールテーブル
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  occupation TEXT,
  area TEXT,
  postal_code TEXT,
  address TEXT,
  bank_name TEXT,
  branch_name TEXT,
  account_type TEXT,
  account_number TEXT,
  account_holder TEXT,
  invoice_reg_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS（Row Level Security）を有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- プロフィールのポリシー
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 主催者テーブル（invoicesより先に作成）
CREATE TABLE public.organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 主催者テーブルのRLS
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view organizers"
  ON public.organizers FOR SELECT
  USING (true);

CREATE POLICY "Users can create organizers"
  ON public.organizers FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- 請求書テーブル
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  project_name TEXT,
  work_date DATE,
  payment_due_date DATE,
  subject TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  withholding DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  organizer_id UUID REFERENCES public.organizers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 請求書テーブルのRLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON public.invoices FOR DELETE
  USING (auth.uid() = user_id);

-- インデックスの作成
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_created_at ON public.invoices(created_at DESC);
CREATE INDEX idx_organizers_code ON public.organizers(organizer_code);

-- 更新日時の自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;

$$ LANGUAGE plpgsql;

-- トリガーの作成
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizers_updated_at
  BEFORE UPDATE ON public.organizers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 新規ユーザー登録時に自動的にプロフィールを作成する関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;

$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新規ユーザー登録時のトリガー
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
