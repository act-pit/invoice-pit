import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Profile } from '@/types/database';
import { NotoSansJPBase64 } from './font-base64';

export async function generateInvoicePDFJapanese(invoice: Invoice, profile: Profile) {
  const doc = new jsPDF();
  
  // 日本語フォントを追加
  doc.addFileToVFS('NotoSansJP-Regular.ttf', NotoSansJPBase64);
  doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal');
  doc.setFont('NotoSansJP');
  
  let yPosition = 20;

  // タイトル
  doc.setFontSize(22);
  doc.text('請求書', 105, yPosition, { align: 'center' });
  yPosition += 12;

  // 請求書番号と日付
  doc.setFontSize(10);
  doc.text(`請求書番号: ${invoice.invoice_number}`, 20, yPosition);
  doc.text(`発行日: ${new Date(invoice.created_at).toLocaleDateString('ja-JP')}`, 150, yPosition);
  yPosition += 7;

  if (invoice.payment_due_date) {
    doc.text(`支払期日: ${new Date(invoice.payment_due_date).toLocaleDateString('ja-JP')}`, 150, yPosition);
    yPosition += 7;
  }

  yPosition += 8;

  // 区切り線
  doc.setDrawColor(200);
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 8;

  // 請求元情報
  doc.setFontSize(11);
  doc.text('請求元:', 20, yPosition);
  yPosition += 6;
  
  doc.setFontSize(10);
  doc.text(profile.full_name || '名前未設定', 20, yPosition);
  yPosition += 5;
  
  if (profile.email) {
    doc.text(`Email: ${profile.email}`, 20, yPosition);
    yPosition += 5;
  }
  if (profile.phone) {
    doc.text(`電話: ${profile.phone}`, 20, yPosition);
    yPosition += 5;
  }
  if (profile.address) {
    doc.text(`住所: ${profile.address}`, 20, yPosition);
    yPosition += 5;
  }

  yPosition += 8;

  // 件名情報
  if (invoice.subject) {
    doc.setFontSize(11);
    doc.text('件名:', 20, yPosition);
    yPosition += 6;
    
    doc.setFontSize(10);
    doc.text(`${invoice.subject}`, 20, yPosition);
    yPosition += 5;

    if (invoice.work_date) {
      doc.text(`作業日: ${new Date(invoice.work_date).toLocaleDateString('ja-JP')}`, 20, yPosition);
      yPosition += 5;
    }
    
    yPosition += 8;
  }

  // 請求項目テーブル
  const tableData = invoice.items.map((item: any) => [
    item.name,
    `¥${item.amount.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['項目', '金額']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [147, 51, 234],
      fontSize: 11,
      font: 'NotoSansJP'
    },
    styles: { 
      fontSize: 10,
      cellPadding: 5,
      font: 'NotoSansJP'
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: 'right' }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 12;

  // 金額サマリー
  const summaryX = 120;
  const amountX = 180;
  
  doc.setFontSize(10);
  
  doc.text('小計:', summaryX, yPosition);
  doc.text(`¥${invoice.subtotal.toLocaleString()}`, amountX, yPosition, { align: 'right' });
  yPosition += 6;

  doc.text('消費税:', summaryX, yPosition);
  doc.text(`¥${invoice.tax.toLocaleString()}`, amountX, yPosition, { align: 'right' });
  yPosition += 6;

  if (invoice.withholding > 0) {
    doc.text('源泉徴収:', summaryX, yPosition);
    doc.setTextColor(220, 38, 38);
    doc.text(`-¥${invoice.withholding.toLocaleString()}`, amountX, yPosition, { align: 'right' });
    doc.setTextColor(0);
    yPosition += 6;
  }

  // 区切り線
  doc.setDrawColor(147, 51, 234);
  doc.setLineWidth(0.5);
  doc.line(summaryX, yPosition, amountX, yPosition);
  yPosition += 6;

  // 合計
  doc.setFontSize(12);
  doc.text('合計:', summaryX, yPosition);
  doc.setTextColor(147, 51, 234);
  doc.text(`¥${invoice.total.toLocaleString()}`, amountX, yPosition, { align: 'right' });
  doc.setTextColor(0);
  yPosition += 12;

  // 振込先情報
  if (profile.bank_name || profile.account_number) {
    // 区切り線
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 8;
    
    doc.setFontSize(11);
    doc.text('振込先情報:', 20, yPosition);
    yPosition += 6;
    
    doc.setFontSize(10);
    
    if (profile.bank_name) {
      doc.text(`銀行名: ${profile.bank_name}`, 20, yPosition);
      yPosition += 5;
    }
    if (profile.branch_name) {
      doc.text(`支店名: ${profile.branch_name}`, 20, yPosition);
      yPosition += 5;
    }
    if (profile.account_type) {
      doc.text(`口座種別: ${profile.account_type}`, 20, yPosition);
      yPosition += 5;
    }
    if (profile.account_number) {
      doc.text(`口座番号: ${profile.account_number}`, 20, yPosition);
      yPosition += 5;
    }
    if (profile.account_holder) {
      doc.text(`口座名義: ${profile.account_holder}`, 20, yPosition);
      yPosition += 5;
    }
  }

  // インボイス登録番号
  if (profile.invoice_reg_number) {
    yPosition += 5;
    doc.text(`インボイス登録番号: ${profile.invoice_reg_number}`, 20, yPosition);
  }

  // フッター
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('お支払いは上記口座までお願いいたします。', 105, pageHeight - 20, { align: 'center' });
  doc.text('ご不明な点がございましたらお問い合わせください。', 105, pageHeight - 15, { align: 'center' });

  // PDFを保存
  doc.save(`${invoice.invoice_number}.pdf`);
}
