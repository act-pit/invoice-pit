'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Invoice, Profile } from '@/types'

export default function OrganizerDashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('all')
  
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    rejected: 0,
    totalAmount: 0,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/organizer/login')
        return
      }

      // プロフィール取得
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) throw profileError
      
      // 役割チェック
      if (profileData.role !== 'organizer' && profileData.role !== 'both') {
        router.push('/organizer/login')
        return
      }

      setProfile(profileData)

      // 請求書取得
      if (profileData.organizer_code) {
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select('*')
          .eq('organizer_code', profileData.organizer_code)
          .order('created_at', { ascending: false })

        if (invoicesError) throw invoicesError

        setInvoices(invoicesData || [])

        // 統計計算
        const allInvoices = invoicesData || []
        const totalAmount = allInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
        
        setStats({
          total: allInvoices.length,
          pending: allInvoices.filter(inv => inv.status === 'pending').length,
          approved: allInvoices.filter(inv => inv.status === 'approved').length,
          paid: allInvoices.filter(inv => inv.status === 'paid').length,
          rejected: allInvoices.filter(inv => inv.status === 'rejected').length,
          totalAmount,
        })
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error)
      alert('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const updateInvoiceStatus = async (invoiceId: string, newStatus: 'approved' | 'paid' | 'rejected', rejectionReason?: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      }

      if (newStatus === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason
      }

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId)

      if (error) throw error

      loadData()
      alert(`請求書を${newStatus === 'approved' ? '承認' : newStatus === 'paid' ? '支払済みに' : '却下'}しました`)
    } catch (error: any) {
      console.error('ステータス更新エラー:', error)
      alert('更新に失敗しました')
    }
  }

  const exportToCSV = () => {
    if (invoices.length === 0) {
      alert('エクスポートする請求書がありません')
      return
    }

    let csv = '請求書番号,キャスト名,メールアドレス,イベント名,請求日,支払期日,小計,消費税,源泉徴収,合計金額,銀行名,支店名,口座種別,口座番号,口座名義,ステータス\n'

    invoices.forEach(invoice => {
      const statusText = 
        invoice.status === 'pending' ? '未承認' :
        invoice.status === 'approved' ? '承認済み' :
        invoice.status === 'paid' ? '支払済み' : '却下'
      
      const row = [
        invoice.invoice_number,
        invoice.cast_name,
        invoice.cast_email,
        invoice.event_name,
        new Date(invoice.invoice_date).toLocaleDateString('ja-JP'),
        new Date(invoice.payment_due_date).toLocaleDateString('ja-JP'),
        invoice.subtotal,
        invoice.tax_amount,
        invoice.withholding_tax,
        invoice.total_amount,
        invoice.bank_name || '-',
        invoice.branch_name || '-',
        invoice.account_type || '-',
        invoice.account_number || '-',
        invoice.account_holder || '-',
        statusText,
      ]
      csv += row.join(',') + '\n'
    })

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
    const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `invoices_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredInvoices = invoices.filter(invoice => {
    if (statusFilter !== 'all' && invoice.status !== statusFilter) {
      return false
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        invoice.cast_name.toLowerCase().includes(query) ||
        invoice.invoice_number.toLowerCase().includes(query) ||
        invoice.event_name.toLowerCase().includes(query)
      )
    }
    
    return true
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    const labels = {
      pending: '未承認',
      approved: '承認済み',
      paid: '支払済み',
      rejected: '却下',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <>
      <div className="space-y-6">
        {/* タイトル */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-600 mt-2">{profile.organization_name || 'ようこそ'}</p>
        </div>

        {/* 主催者コード */}
        <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
          <CardHeader>
            <CardTitle>主催者コード</CardTitle>
            <CardDescription className="text-purple-100">
              キャストがこのコードを使って請求書を送信します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <code className="text-2xl font-mono font-bold bg-white/20 px-4 py-2 rounded">
                {profile.organizer_code || '未設定'}
              </code>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={() => {
                  if (profile.organizer_code) {
                    navigator.clipboard.writeText(profile.organizer_code)
                    alert('コードをコピーしました！')
                  }
                }}
              >
                📋 コピー
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">総請求書数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">未承認</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">承認済み</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">支払済み</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">却下</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-600">合計金額</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.totalAmount)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 検索・フィルター・CSV出力 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="キャスト名・請求書番号・イベント名で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                <option value="pending">未承認</option>
                <option value="approved">承認済み</option>
                <option value="paid">支払済み</option>
                <option value="rejected">却下</option>
              </select>
              
              <Button 
                onClick={exportToCSV} 
                variant="outline"
                className="whitespace-nowrap"
              >
                📊 CSV出力
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 請求書一覧 */}
        <div className="space-y-4">
          {filteredInvoices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">
                  {invoices.length === 0 ? 'まだ請求書を受け取っていません' : '該当する請求書がありません'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{invoice.cast_name}</CardTitle>
                      <CardDescription>
                        {invoice.event_name} - {invoice.invoice_number}
                      </CardDescription>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(invoice.total_amount)}
                      </div>
                      <div className="mt-1">
                        {getStatusBadge(invoice.status)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">請求日</p>
                      <p className="font-medium">{formatDate(invoice.invoice_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">支払期日</p>
                      <p className="font-medium text-red-600">{formatDate(invoice.payment_due_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">消費税</p>
                      <p className="font-medium">{formatCurrency(invoice.tax_amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">源泉徴収</p>
                      <p className="font-medium text-red-600">-{formatCurrency(invoice.withholding_tax)}</p>
                    </div>
                  </div>
                  
                  {invoice.bank_name && (
                    <div className="bg-gray-50 p-4 rounded-lg text-sm">
                      <p className="font-semibold mb-2">振込先情報</p>
                      <p>
                        {invoice.bank_name} {invoice.branch_name} {invoice.account_type} {invoice.account_number}
                        <br />
                        口座名義: {invoice.account_holder}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {invoice.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => updateInvoiceStatus(invoice.id, 'approved')}
                        >
                          ✅ 承認
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                          onClick={() => {
                            const reason = prompt('却下理由を入力してください（任意）')
                            updateInvoiceStatus(invoice.id, 'rejected', reason || undefined)
                          }}
                        >
                          ❌ 却下
                        </Button>
                      </>
                    )}
                    {invoice.status === 'approved' && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                      >
                        💰 支払済みにする
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      👁️ 詳細
                    </Button>
                    {invoice.pdf_url && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        asChild
                      >
                        <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                          📄 PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* 詳細モーダル */}
      {selectedInvoice && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedInvoice(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">請求書詳細</h2>
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-3">基本情報</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>請求書番号:</strong> {selectedInvoice.invoice_number}</p>
                    <p><strong>キャスト名:</strong> {selectedInvoice.cast_name}</p>
                    <p><strong>メールアドレス:</strong> {selectedInvoice.cast_email}</p>
                    <p><strong>イベント名:</strong> {selectedInvoice.event_name}</p>
                    {selectedInvoice.event_date && (
                      <p><strong>イベント日:</strong> {formatDate(selectedInvoice.event_date)}</p>
                    )}
                    <p><strong>請求日:</strong> {formatDate(selectedInvoice.invoice_date)}</p>
                    <p><strong>支払期日:</strong> {formatDate(selectedInvoice.payment_due_date)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-3">金額</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>小計:</span>
                      <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>消費税:</span>
                      <span>{formatCurrency(selectedInvoice.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>源泉徴収:</span>
                      <span>-{formatCurrency(selectedInvoice.withholding_tax)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      <span>合計:</span>
                      <span className="text-purple-600">{formatCurrency(selectedInvoice.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {selectedInvoice.bank_name && (
                  <div>
                    <h3 className="font-bold text-lg mb-3">振込先情報</h3>
                    <div className="bg-blue-50 p-4 rounded-lg space-y-1 text-sm">
                      <p><strong>銀行名:</strong> {selectedInvoice.bank_name}</p>
                      <p><strong>支店名:</strong> {selectedInvoice.branch_name}</p>
                      <p><strong>口座種別:</strong> {selectedInvoice.account_type}</p>
                      <p><strong>口座番号:</strong> {selectedInvoice.account_number}</p>
                      <p><strong>口座名義:</strong> {selectedInvoice.account_holder}</p>
                      {selectedInvoice.invoice_registration_number && (
                        <p><strong>インボイス登録番号:</strong> {selectedInvoice.invoice_registration_number}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedInvoice.notes && (
                  <div>
                    <h3 className="font-bold text-lg mb-3">備考</h3>
                    <p className="text-sm bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                      {selectedInvoice.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setSelectedInvoice(null)}>
                  閉じる
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
