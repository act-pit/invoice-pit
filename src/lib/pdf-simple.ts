import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Profile } from '@/types/database';

export async function generateInvoicePDFSimple(invoice: Invoice, profile: Profile) {
  const doc = new jsPDF();
  
  let yPosition = 20;

  // タイトル
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 105, yPosition, { align: 'center' });
  yPosition += 8;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Seikyu-sho', 105, yPosition, { align: 'center' });
  yPosition += 15;

  // 請求書番号と日付
  doc.setFontSize(10);
  doc.text(`Invoice No: ${invoice.invoice_number}`, 20, yPosition);
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString('ja-JP')}`, 150, yPosition);
  yPosition += 7;

  if (invoice.payment_due_date) {
    doc.text(`Due Date: ${new Date(invoice.payment_due_date).toLocaleDateString('ja-JP')}`, 150, yPosition);
    yPosition += 7;
  }

  yPosition += 8;

  // 区切り線
  doc.setDrawColor(200);
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 8;

  // 請求元情報
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM:', 20, yPosition);
  yPosition += 6;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(profile.full_name || 'Name not set', 20, yPosition);
  yPosition += 5;
  
  if (profile.email) {
    doc.text(`Email: ${profile.email}`, 20, yPosition);
    yPosition += 5;
  }
  if (profile.phone) {
    doc.text(`Phone: ${profile.phone}`, 20, yPosition);
    yPosition += 5;
  }
  if (profile.address) {
    doc.text(`Address: ${profile.address}`, 20, yPosition);
    yPosition += 5;
  }

  yPosition += 8;

  // 件名情報
  if (invoice.subject) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('SUBJECT:', 20, yPosition);
    yPosition += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${invoice.subject}`, 20, yPosition);
    yPosition += 5;

    if (invoice.work_date) {
      doc.text(`Work Date: ${new Date(invoice.work_date).toLocaleDateString('ja-JP')}`, 20, yPosition);
      yPosition += 5;
    }
    
    yPosition += 8;
  }

  // 請求項目テーブル
  const tableData = invoice.items.map((item: any) => [
    item.name,
    `JPY ${item.amount.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Item Description', 'Amount (JPY)']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [147, 51, 234],
      fontSize: 11,
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 10,
      cellPadding: 5
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
  doc.setFont('helvetica', 'normal');
  
  doc.text('Subtotal (Shokei):', summaryX, yPosition);
  doc.text(`JPY ${invoice.subtotal.toLocaleString()}`, amountX, yPosition, { align: 'right' });
  yPosition += 6;

  doc.text('Tax (Shohi-zei):', summaryX, yPosition);
  doc.text(`JPY ${invoice.tax.toLocaleString()}`, amountX, yPosition, { align: 'right' });
  yPosition += 6;

  if (invoice.withholding > 0) {
    doc.text('Withholding (Gensencho-shu):', summaryX, yPosition);
    doc.setTextColor(220, 38, 38);
    doc.text(`-JPY ${invoice.withholding.toLocaleString()}`, amountX, yPosition, { align: 'right' });
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
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL (Gokei):', summaryX, yPosition);
  doc.setTextColor(147, 51, 234);
  doc.text(`JPY ${invoice.total.toLocaleString()}`, amountX, yPosition, { align: 'right' });
  doc.setTextColor(0);
  yPosition += 12;

  // 振込先情報
  if (profile.bank_name || profile.account_number) {
    // 区切り線
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('BANK ACCOUNT INFO (Furikomi-saki):', 20, yPosition);
    yPosition += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    if (profile.bank_name) {
      doc.text(`Bank: ${profile.bank_name}`, 20, yPosition);
      yPosition += 5;
    }
    if (profile.branch_name) {
      doc.text(`Branch: ${profile.branch_name}`, 20, yPosition);
      yPosition += 5;
    }
    if (profile.account_type) {
      doc.text(`Type: ${profile.account_type}`, 20, yPosition);
      yPosition += 5;
    }
    if (profile.account_number) {
      doc.text(`Account No: ${profile.account_number}`, 20, yPosition);
      yPosition += 5;
    }
    if (profile.account_holder) {
      doc.text(`Holder: ${profile.account_holder}`, 20, yPosition);
      yPosition += 5;
    }
  }

  // インボイス登録番号
  if (profile.invoice_reg_number) {
    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice Registration No: ${profile.invoice_reg_number}`, 20, yPosition);
  }

  // フッター
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Thank you for your business!', 105, pageHeight - 20, { align: 'center' });
  doc.text('Please remit payment to the above bank account.', 105, pageHeight - 15, { align: 'center' });

  // PDFを保存
  doc.save(`${invoice.invoice_number}.pdf`);
}
