-- 主催者が受け取った請求書テーブル
CREATE TABLE IF NOT EXISTS public.organizer_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  cast_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  
  -- 請求書情報のコピー（キャストが削除しても残る）
  invoice_number TEXT NOT NULL,
  cast_name TEXT NOT NULL,
  cast_email TEXT NOT NULL,
  project_name TEXT,
  work_date DATE,
  payment_due_date DATE,
  subject TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  withholding DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) DEFAULT 0,
  
  -- 振込先情報
  bank_name TEXT,
  branch_name TEXT,
  account_type TEXT,
  account_number TEXT,
  account_holder TEXT,
  invoice_reg_number TEXT,
  
  -- ステータス管理
  status TEXT DEFAULT 'pending',
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS設定
ALTER TABLE public.organizer_invoices ENABLE ROW LEVEL SECURITY;

-- 主催者は自分が受け取った請求書のみ閲覧可能
CREATE POLICY "Organizers can view own invoices"
  ON public.organizer_invoices FOR SELECT
  USING (
    organizer_id IN (
      SELECT id FROM public.organizers WHERE created_by = auth.uid()
    )
  );

-- 主催者は自分が受け取った請求書のステータスを更新可能
CREATE POLICY "Organizers can update own invoices"
  ON public.organizer_invoices FOR UPDATE
  USING (
    organizer_id IN (
      SELECT id FROM public.organizers WHERE created_by = auth.uid()
    )
  );

-- キャストは主催者に請求書を送信可能
CREATE POLICY "Casts can insert invoices to organizers"
  ON public.organizer_invoices FOR INSERT
  WITH CHECK (auth.uid() = cast_user_id);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_organizer_invoices_organizer_id ON public.organizer_invoices(organizer_id);
CREATE INDEX IF NOT EXISTS idx_organizer_invoices_cast_user_id ON public.organizer_invoices(cast_user_id);
CREATE INDEX IF NOT EXISTS idx_organizer_invoices_created_at ON public.organizer_invoices(created_at DESC);

-- トリガー
CREATE TRIGGER update_organizer_invoices_updated_at
  BEFORE UPDATE ON public.organizer_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
