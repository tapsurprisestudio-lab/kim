import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice, Customer, Company, SubscriptionInvoice } from '@/types';

// ================================================================
// KIMICHI ERP — PDF SERVICE
// ================================================================
// ARABIC / RTL LIMITATION (known, intentional):
//   jsPDF's built-in fonts (Helvetica, Courier, Times) do not include
//   Arabic Unicode glyphs. Embedding a full Arabic font (e.g. Amiri,
//   Cairo) requires a base-64-encoded .ttf file (~600 KB+) bundled into
//   the client bundle — a significant size cost for a client-only app.
//
//   Current approach: ALL USER-SUPPLIED ARABIC TEXT (customer names,
//   company names, product names) is transliterated to its stored Latin
//   form where possible, or is preceded by a [AR] prefix tag so the
//   reader knows the field contains Arabic content that cannot be rendered
//   inline. Numeric values, serial numbers, dates, and amounts render
//   correctly since they are ASCII.
//
//   TO ENABLE TRUE ARABIC RENDERING: Add a CallAddFont() call here using
//   a self-hosted Cairo/Amiri font .ttf converted to base64 via jsPDF's
//   font-converter tool. See docs at:
//   https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html
//
//   Until then, all labels in this file are bilingual (English + Arabic
//   transliteration) so the PDF is identifiable in both contexts.
// ================================================================

const BRAND_BLUE  = [37, 99, 235]   as [number, number, number];
const BRAND_GREEN = [34, 197, 94]   as [number, number, number];
const DARK_BG     = [10, 15, 30]    as [number, number, number];
const DARK_CARD   = [17, 24, 39]    as [number, number, number];
const TEXT_MUTED  = [100, 116, 139] as [number, number, number];
const TEXT_LIGHT  = [148, 163, 184] as [number, number, number];

// Safe fallback for Arabic text: strips characters jsPDF can't render
// and adds a [AR] prefix so the reader knows it was Arabic content.
function safeText(text: string): string {
  if (!text) return '';
  // If the string contains Arabic Unicode (U+0600–U+06FF), annotate it
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  if (!hasArabic) return text;
  // Strip the Arabic chars and prepend a tag so the field is still
  // identifiable rather than appearing blank.
  const latin = text.replace(/[\u0600-\u06FF\u200f\u200e]/g, '').trim();
  return latin ? `[AR] ${latin}` : '[Arabic text]';
}

function addHeader(doc: jsPDF, titleEN: string, subtitleEN?: string) {
  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 33, 210, 2, 'F');

  // Logo circle
  doc.setFillColor(...BRAND_GREEN);
  doc.circle(20, 17, 8, 'F');
  doc.setFillColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('K', 17.2, 20.5);

  // Brand
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Kimichi ERP', 32, 14);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_LIGHT);
  doc.text('kimichierp@gmail.com  |  kimichi.ly', 32, 21);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('* Arabic names appear as [AR] — font limitation; values are accurate', 32, 27);

  // Title right-aligned
  doc.setTextColor(96, 165, 250);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const tw = doc.getTextWidth(titleEN);
  doc.text(titleEN, 210 - 14 - tw, 14);

  if (subtitleEN) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_LIGHT);
    const sw = doc.getTextWidth(subtitleEN);
    doc.text(subtitleEN, 210 - 14 - sw, 21);
  }

  // Generated date
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_MUTED);
  const ds = new Date().toLocaleDateString('en-GB');
  doc.text(ds, 210 - 14 - doc.getTextWidth(ds), 28);
}

function addFooter(doc: jsPDF) {
  const ph = doc.internal.pageSize.height;
  doc.setFillColor(...DARK_BG);
  doc.rect(0, ph - 15, 210, 15, 'F');
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, ph - 15, 210, 0.5, 'F');
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('Kimichi ERP  —  Generated automatically. Arabic text tagged [AR].', 14, ph - 6);
  doc.text('www.kimichi.ly', 210 - 14 - doc.getTextWidth('www.kimichi.ly'), ph - 6);
}

// Status English labels for PDF (status is stored as ASCII enum)
const STATUS_LABELS: Record<string, string> = {
  paid: 'PAID / مدفوع', partial: 'PARTIAL / جزئي',
  unpaid: 'UNPAID / غير مدفوع', overdue: 'OVERDUE / متأخر',
  pending: 'PENDING / معلق', cancelled: 'CANCELLED / ملغي',
};

// ================================================================
// INVOICE PDF
// ================================================================
export function generateInvoicePDF(invoice: Invoice, companyName: string) {
  const doc = new jsPDF();
  addHeader(doc, 'INVOICE / فاتورة', `No. ${invoice.serialNumber}`);

  // Info box
  doc.setFillColor(...DARK_CARD);
  doc.roundedRect(14, 40, 182, 32, 3, 3, 'F');

  const col1 = 20, col2 = 110;
  const row1 = 50, row2 = 58, row3 = 66;

  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(96, 165, 250);
  doc.text('Bill To / العميل:', col1, row1);
  doc.text('Company / الشركة:', col2, row1);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 255, 255);
  doc.text(safeText(invoice.customerName), col1, row2);
  doc.text(safeText(companyName), col2, row2);

  doc.setFont('helvetica', 'bold'); doc.setTextColor(96, 165, 250);
  doc.text('Invoice No / الرقم:', col1, row3);
  doc.text('Due Date / الاستحقاق:', col2, row3);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 255, 255);
  doc.text(invoice.serialNumber, col1, row3 + 7);
  doc.text(new Date(invoice.dueDate).toLocaleDateString('en-GB'), col2, row3 + 7);

  // Items table
  autoTable(doc, {
    startY: 78,
    head: [['#', 'Product / المنتج', 'Qty / الكمية', 'Unit Price / السعر', 'Discount / خصم', 'Total / الإجمالي']],
    body: invoice.items.map((item, i) => [
      i + 1,
      safeText(item.productName),
      item.quantity,
      item.unitPrice.toFixed(2),
      item.discount > 0 ? item.discount.toFixed(2) : '—',
      item.total.toFixed(2),
    ]),
    headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [203, 213, 225] },
    alternateRowStyles: { fillColor: [17, 24, 39] },
    styles: { fillColor: [13, 20, 38] },
  });

  const y = (doc as any).lastAutoTable.finalY + 8;
  const tx = 130;

  // Totals block
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_LIGHT);
  doc.text('Subtotal / المجموع الفرعي:', tx, y);
  doc.text(invoice.subtotal.toFixed(2), 196 - doc.getTextWidth(invoice.subtotal.toFixed(2)), y);

  if (invoice.discount > 0) {
    doc.setTextColor(248, 113, 113);
    doc.text('Discount / الخصم:', tx, y + 7);
    doc.text(`- ${invoice.discount.toFixed(2)}`, 196 - doc.getTextWidth(`- ${invoice.discount.toFixed(2)}`), y + 7);
  }

  doc.setFillColor(...BRAND_BLUE);
  doc.rect(tx - 2, y + 11, 68, 0.5, 'F');

  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL / الإجمالي:', tx, y + 18);
  doc.setTextColor(74, 222, 128);
  doc.text(invoice.total.toFixed(2), 196 - doc.getTextWidth(invoice.total.toFixed(2)), y + 18);

  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_LIGHT);
  doc.text(`Paid / المدفوع: ${invoice.paid.toFixed(2)}`, tx, y + 26);

  if (invoice.remaining > 0) {
    doc.setTextColor(251, 191, 36);
    doc.text(`Balance Due / المتبقي: ${invoice.remaining.toFixed(2)}`, tx, y + 33);
  }

  // Status badge
  const sc: Record<string, [number, number, number]> = {
    paid: BRAND_GREEN, partial: [234, 179, 8], unpaid: [239, 68, 68], overdue: [220, 38, 38],
  };
  doc.setFillColor(...(sc[invoice.status] || TEXT_MUTED));
  doc.roundedRect(14, y, 55, 11, 2, 2, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text(STATUS_LABELS[invoice.status] || invoice.status.toUpperCase(), 17, y + 7.5);

  if (invoice.notes) {
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`Notes: ${safeText(invoice.notes)}`, 14, y + 46);
  }

  addFooter(doc);
  doc.save(`Invoice-${invoice.serialNumber}.pdf`);
}

// ================================================================
// CUSTOMER STATEMENT PDF
// ================================================================
export function generateCustomerStatementPDF(customer: Customer, invoices: Invoice[], payments: unknown[]) {
  const doc = new jsPDF();
  addHeader(doc, 'STATEMENT / كشف حساب', safeText(customer.name));

  doc.setFillColor(...DARK_CARD);
  doc.roundedRect(14, 40, 182, 24, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold'); doc.setTextColor(96, 165, 250);
  doc.text('Customer / العميل:', 20, 50);
  doc.text('Phone / الهاتف:', 100, 50);
  doc.text('Balance / الرصيد:', 160, 50);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 255, 255);
  doc.text(safeText(customer.name), 20, 57);
  doc.text(customer.phone, 100, 57);
  const debtColor: [number,number,number] = customer.currentDebt > 0 ? [248, 113, 113] : [74, 222, 128];
  doc.setTextColor(...debtColor);
  doc.text(customer.currentDebt.toFixed(2), 160, 57);

  autoTable(doc, {
    startY: 70,
    head: [['Invoice / فاتورة', 'Date / التاريخ', 'Total / الإجمالي', 'Paid / المدفوع', 'Remaining / المتبقي', 'Status / الحالة']],
    body: invoices.map(inv => [
      inv.serialNumber,
      new Date(inv.createdAt).toLocaleDateString('en-GB'),
      inv.total.toFixed(2),
      inv.paid.toFixed(2),
      inv.remaining.toFixed(2),
      STATUS_LABELS[inv.status] || inv.status.toUpperCase(),
    ]),
    headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [203, 213, 225] },
    alternateRowStyles: { fillColor: [17, 24, 39] },
    styles: { fillColor: [13, 20, 38] },
  });

  addFooter(doc);
  doc.save(`Statement-${safeText(customer.name) || customer.id}.pdf`);
}

// ================================================================
// SUBSCRIPTION INVOICE PDF
// ================================================================
export function generateSubscriptionInvoicePDF(sinv: SubscriptionInvoice) {
  const doc = new jsPDF();
  addHeader(doc, 'SUBSCRIPTION / اشتراك', `#${sinv.id.slice(0, 8).toUpperCase()}`);

  doc.setFillColor(...DARK_CARD);
  doc.roundedRect(14, 40, 182, 44, 3, 3, 'F');

  const fields: [string, string][] = [
    ['Company / الشركة:', safeText(sinv.companyName)],
    ['Plan / الباقة:', sinv.plan.toUpperCase()],
    ['Billing Cycle / دورة الفوترة:', sinv.billingCycle],
    ['Period / الفترة:', `${sinv.startDate}  →  ${sinv.endDate}`],
    ['Payment / الدفع:', STATUS_LABELS[sinv.paymentStatus] || sinv.paymentStatus.toUpperCase()],
  ];

  fields.forEach(([label, value], i) => {
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(96, 165, 250);
    doc.text(label, 20, 50 + i * 7);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 255, 255);
    doc.text(value, 95, 50 + i * 7);
  });

  const fy = 92;
  doc.setFillColor(...BRAND_BLUE);
  doc.roundedRect(14, fy, 182, 20, 3, 3, 'F');
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text('AMOUNT DUE / المبلغ المستحق:', 20, fy + 13);
  doc.setTextColor(74, 222, 128);
  const amt = sinv.amount.toFixed(2);
  doc.text(amt, 196 - doc.getTextWidth(amt), fy + 13);

  addFooter(doc);
  doc.save(`Subscription-${safeText(sinv.companyName) || sinv.companyId}.pdf`);
}

// ================================================================
// COMPANIES REPORT PDF
// ================================================================
export function generateCompaniesReportPDF(companies: Company[]) {
  const doc = new jsPDF('landscape');

  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, 297, 25, 'F');
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 23, 297, 2, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text('Kimichi ERP  —  Companies Report / تقرير الشركات', 14, 16);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT_MUTED);
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, 200, 16);

  autoTable(doc, {
    startY: 30,
    head: [['#', 'Serial', 'Company / الشركة', 'Type', 'Owner', 'Plan', 'Status', 'Expiry', 'Payment']],
    body: companies.map((c, i) => [
      i + 1,
      c.serialNumber,
      safeText(c.name),
      c.businessType.replace(/_/g, ' '),
      safeText(c.ownerName),
      c.subscriptionPlan.toUpperCase(),
      c.status.toUpperCase(),
      c.subscriptionEndDate,
      c.paymentStatus.toUpperCase(),
    ]),
    headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [203, 213, 225] },
    alternateRowStyles: { fillColor: [17, 24, 39] },
    styles: { fillColor: [13, 20, 38] },
  });

  const fy = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXT_LIGHT); doc.text(`Total: ${companies.length}`, 14, fy);
  doc.setTextColor(74, 222, 128); doc.text(`Active: ${companies.filter(c => c.status === 'active').length}`, 55, fy);
  doc.setTextColor(251, 191, 36); doc.text(`Suspended: ${companies.filter(c => c.status === 'suspended').length}`, 105, fy);
  doc.setTextColor(248, 113, 113); doc.text(`Archived: ${companies.filter(c => c.status === 'archived').length}`, 165, fy);

  doc.save('Kimichi-Companies-Report.pdf');
}

// ================================================================
// SALES REPORT PDF
// ================================================================
export function generateSalesReportPDF(invoices: Invoice[], companyName: string, dateFrom: string, dateTo: string) {
  const doc = new jsPDF();
  addHeader(doc, 'SALES REPORT / تقرير المبيعات', safeText(companyName));

  doc.setFontSize(8); doc.setTextColor(...TEXT_LIGHT);
  doc.text(`Period / الفترة: ${dateFrom}  →  ${dateTo}`, 14, 42);

  autoTable(doc, {
    startY: 48,
    head: [['Invoice', 'Customer / العميل', 'Date', 'Total', 'Paid', 'Remaining', 'Status']],
    body: invoices.map(inv => [
      inv.serialNumber,
      safeText(inv.customerName),
      new Date(inv.createdAt).toLocaleDateString('en-GB'),
      inv.total.toFixed(2),
      inv.paid.toFixed(2),
      inv.remaining.toFixed(2),
      STATUS_LABELS[inv.status] || inv.status,
    ]),
    headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [203, 213, 225] },
    alternateRowStyles: { fillColor: [17, 24, 39] },
    styles: { fillColor: [13, 20, 38] },
  });

  const fy = (doc as any).lastAutoTable.finalY + 10;
  const totalSales     = invoices.reduce((s, i) => s + i.total, 0);
  const totalCollected = invoices.reduce((s, i) => s + i.paid, 0);
  const totalDebt      = invoices.reduce((s, i) => s + i.remaining, 0);

  doc.setFillColor(...DARK_CARD);
  doc.roundedRect(14, fy, 182, 34, 3, 3, 'F');

  const rows: [string, number, [number,number,number]][] = [
    ['Total Sales / إجمالي المبيعات:',     totalSales,     [74, 222, 128]],
    ['Collected / المحصل:',                 totalCollected, [74, 222, 128]],
    ['Outstanding / المديونية المتبقية:',   totalDebt,      totalDebt > 0 ? [248, 113, 113] : [74, 222, 128]],
  ];
  rows.forEach(([label, val, color], i) => {
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(96, 165, 250);
    doc.text(label, 20, fy + 10 + i * 9);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...color);
    doc.text(val.toFixed(2), 196 - doc.getTextWidth(val.toFixed(2)), fy + 10 + i * 9);
  });

  addFooter(doc);
  doc.save(`Sales-Report-${safeText(companyName) || 'company'}.pdf`);
}

// ================================================================
// DEBT REPORT PDF
// ================================================================
export function generateDebtReportPDF(customers: Customer[], companyName: string) {
  const doc = new jsPDF();
  addHeader(doc, 'DEBT REPORT / تقرير المديونية', safeText(companyName));

  const debtCustomers = customers.filter(c => c.currentDebt > 0);

  autoTable(doc, {
    startY: 42,
    head: [['Customer / العميل', 'Phone', 'City', 'Credit Limit', 'Debt / الدين', 'Status']],
    body: debtCustomers.map(c => [
      safeText(c.name),
      c.phone,
      safeText(c.city),
      c.creditLimit.toFixed(2),
      c.currentDebt.toFixed(2),
      c.status.toUpperCase(),
    ]),
    headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [203, 213, 225] },
    alternateRowStyles: { fillColor: [17, 24, 39] },
    styles: { fillColor: [13, 20, 38] },
  });

  const fy = (doc as any).lastAutoTable.finalY + 10;
  const total = debtCustomers.reduce((s, c) => s + c.currentDebt, 0);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.setTextColor(248, 113, 113);
  doc.text(`Total Outstanding / إجمالي المديونية: ${total.toFixed(2)}`, 14, fy);

  addFooter(doc);
  doc.save(`Debt-Report-${safeText(companyName) || 'company'}.pdf`);
}
