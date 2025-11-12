import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Profile } from '@/types/database';

export async function generateInvoicePDF(invoice: Invoice, profile: Profile) {
  const doc = new jsPDF();
  
  let yPosition = 20;

  // タイトル
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 105, yPosition, { align: 'center' });
  yPosition += 15;

  // 請求書番号と日付
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice Number: ${invoice.invoice_number}`, 20, yPosition);
  doc.text(`Issue Date: ${new Date(invoice.created_at).toLocaleDateString('en-US')}`, 150, yPosition);
  yPosition += 7;

  if (invoice.payment_due_date) {
    doc.text(`Payment Due Date: ${new Date(invoice.payment_due_date).toLocaleDateString('en-US')}`, 150, yPosition);
    yPosition += 7;
  }

  yPosition += 10;

  // 区切り線
  doc.setDrawColor(200);
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 10;

  // 請求元情報（FROM）
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM:', 20, yPosition);
  yPosition += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(profile.name || 'Name not set', 20, yPosition);
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

  yPosition += 10;

  // 件名情報
  if (invoice.subject) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('SUBJECT:', 20, yPosition);
    yPosition += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${invoice.subject}`, 20, yPosition);
    yPosition += 5;

    if (invoice.work_date) {
      doc.text(`Work Date: ${new Date(invoice.work_date).toLocaleDateString('en-US')}`, 20, yPosition);
      yPosition += 5;
    }
    
    yPosition += 10;
  }

  // 請求項目テーブル
  const tableData = invoice.items.map((item: any) => [
    item.name,
    `JPY ${item.amount.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Description', 'Amount (JPY)']],
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

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // 金額サマリー
  const summaryX = 120;
  const amountX = 180;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Subtotal:', summaryX, yPosition);
  doc.text(`JPY ${invoice.subtotal.toLocaleString()}`, amountX, yPosition, { align: 'right' });
  yPosition += 7;

  doc.text('Tax:', summaryX, yPosition);
  doc.text(`JPY ${invoice.tax.toLocaleString()}`, amountX, yPosition, { align: 'right' });
  yPosition += 7;

  if (invoice.withholding > 0) {
    doc.text('Withholding Tax:', summaryX, yPosition);
    doc.setTextColor(220, 38, 38);
    doc.text(`-JPY ${invoice.withholding.toLocaleString()}`, amountX, yPosition, { align: 'right' });
    doc.setTextColor(0);
    yPosition += 7;
  }

  // 区切り線
  doc.setDrawColor(147, 51, 234);
  doc.setLineWidth(0.5);
  doc.line(summaryX, yPosition, amountX, yPosition);
  yPosition += 7;

  // 合計
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', summaryX, yPosition);
  doc.setTextColor(147, 51, 234);
  doc.text(`JPY ${invoice.total.toLocaleString()}`, amountX, yPosition, { align: 'right' });
  doc.setTextColor(0);
  yPosition += 15;

  // 振込先情報
  if (profile.bank_name || profile.account_number) {
    // 区切り線
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('BANK ACCOUNT INFORMATION:', 20, yPosition);
    yPosition += 7;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    if (profile.bank_name) {
      doc.text(`Bank Name: ${profile.bank_name}`, 20, yPosition);
      yPosition += 5;
    }
    if (profile.branch_name) {
      doc.text(`Branch Name: ${profile.branch_name}`, 20, yPosition);
      yPosition += 5;
    }
    if (profile.account_type) {
      doc.text(`Account Type: ${profile.account_type}`, 20, yPosition);
      yPosition += 5;
    }
    if (profile.account_number) {
      doc.text(`Account Number: ${profile.account_number}`, 20, yPosition);
      yPosition += 5;
    }
    if (profile.account_holder) {
      doc.text(`Account Holder: ${profile.account_holder}`, 20, yPosition);
      yPosition += 5;
    }
  }

  // インボイス登録番号
  if (profile.invoice_reg_number) {
    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice Registration Number: ${profile.invoice_reg_number}`, 20, yPosition);
  }

  // フッター
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Thank you for your business!', 105, pageHeight - 20, { align: 'center' });
  doc.text('Please remit payment to the bank account listed above.', 105, pageHeight - 15, { align: 'center' });

  // PDFを保存
  doc.save(`${invoice.invoice_number}.pdf`);
}
