import jsPDF from 'jspdf';

interface ReceiptData {
  receiptNumber: string;
  date: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany?: string;
  amount: number;
  description: string;
  trackingNumber: string;
  transactionId: string;
  paymentMethod?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany?: string;
  clientAddress?: string;
  items: { description: string; quantity: number; unitPrice: number }[];
  notes?: string;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateShort = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Load image as base64
const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image:', error);
    return null;
  }
};

// Draw official stamp with real image or fallback
const drawOfficialStamp = async (doc: jsPDF, x: number, y: number, size: number = 50): Promise<void> => {
  const stampImage = await loadImageAsBase64('/images/cachet-legal-form.png');
  
  if (stampImage) {
    // Draw the real stamp image
    doc.addImage(stampImage, 'PNG', x - size, y - size, size * 2, size * 2);
  } else {
    // Fallback to drawn stamp
    const primaryColor: [number, number, number] = [0, 124, 122];
    
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(2);
    doc.circle(x, y, size);
    
    doc.setLineWidth(1);
    doc.circle(x, y, size - 8);
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('LEGAL FORM CI', x, y - size + 18, { align: 'center' });
    
    doc.setFillColor(...primaryColor);
    doc.circle(x, y, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('LF', x, y + 2, { align: 'center' });
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('PAIEMENT VALIDÉ', x, y + size - 18, { align: 'center' });
    
    doc.setFontSize(6);
    doc.text('ABIDJAN - CÔTE D\'IVOIRE', x, y + size - 10, { align: 'center' });
  }
};

// Draw signature with real image or fallback
const drawSignature = async (doc: jsPDF, x: number, y: number): Promise<void> => {
  const signatureImage = await loadImageAsBase64('/images/signature-dirigeant.png');
  const textColor: [number, number, number] = [26, 26, 26];
  
  if (signatureImage) {
    // Draw the real signature image
    doc.addImage(signatureImage, 'PNG', x - 40, y - 30, 80, 40);
  } else {
    // Fallback to drawn signature
    const primaryColor: [number, number, number] = [0, 124, 122];
    
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.8);
    
    doc.line(x - 30, y - 15, x - 15, y - 20);
    doc.line(x - 15, y - 20, x, y - 10);
    doc.line(x, y - 10, x + 10, y - 18);
    doc.line(x + 10, y - 18, x + 25, y - 12);
    
    doc.line(x - 25, y - 8, x + 30, y - 8);
  }
  
  // Signature line
  doc.setDrawColor(...textColor);
  doc.setLineWidth(0.5);
  doc.line(x - 40, y + 5, x + 40, y + 5);
  
  // Text below signature
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Signature autorisée', x, y + 13, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('S. KONAN - Direction Legal Form', x, y + 20, { align: 'center' });
};

export const generatePaymentReceiptPDF = async (data: ReceiptData): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryColor: [number, number, number] = [0, 124, 122];
  const textColor: [number, number, number] = [26, 26, 26];
  const mutedColor: [number, number, number] = [100, 100, 100];
  
  let y = 20;

  // Header with logo area
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('LEGAL FORM', 20, 28);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("Création d'entreprises en Côte d'Ivoire", 20, 38);
  
  // Receipt title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('REÇU DE PAIEMENT', pageWidth - 20, 28, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${data.receiptNumber}`, pageWidth - 20, 38, { align: 'right' });
  
  y = 60;
  
  // Receipt details box
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(15, y, pageWidth - 30, 25, 3, 3, 'F');
  
  doc.setTextColor(...textColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Date de paiement:', 20, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(data.date), 60, y + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Transaction ID:', 20, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.transactionId, 60, y + 18);
  
  doc.setFont('helvetica', 'normal');
  doc.text('N° Suivi:', pageWidth / 2, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.text(data.trackingNumber, pageWidth / 2 + 25, y + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Méthode:', pageWidth / 2, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.paymentMethod || 'Mobile Money', pageWidth / 2 + 25, y + 18);
  
  y += 35;
  
  // Two columns: Legal Form info and Client info
  // Left column - From
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DE:', 20, y);
  
  y += 7;
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('LEGAL FORM CI', 20, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text('Abidjan, Côte d\'Ivoire', 20, y);
  y += 4;
  doc.text('+225 07 09 67 79 25', 20, y);
  y += 4;
  doc.text('contact@legalform.ci', 20, y);
  y += 4;
  doc.text('monentreprise@legalform.ci', 20, y);
  
  // Right column - To
  y -= 20;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYÉ PAR:', pageWidth / 2, y);
  
  y += 7;
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(data.clientName, pageWidth / 2, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  if (data.clientCompany) {
    doc.text(data.clientCompany, pageWidth / 2, y);
    y += 4;
  }
  doc.text(data.clientPhone, pageWidth / 2, y);
  y += 4;
  doc.text(data.clientEmail, pageWidth / 2, y);
  
  y += 20;
  
  // Payment details table
  doc.setFillColor(...primaryColor);
  doc.rect(15, y, pageWidth - 30, 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 20, y + 7);
  doc.text('Montant', pageWidth - 25, y + 7, { align: 'right' });
  
  y += 12;
  
  // Table content
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Draw row
  doc.setFillColor(255, 255, 255);
  doc.rect(15, y, pageWidth - 30, 15, 'FD');
  doc.text(data.description, 20, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.text(formatPrice(data.amount), pageWidth - 25, y + 10, { align: 'right' });
  
  y += 20;
  
  // Total section
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(pageWidth - 100, y, 85, 25, 3, 3, 'F');
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.setFontSize(9);
  doc.text('Sous-total:', pageWidth - 95, y + 8);
  doc.text(formatPrice(data.amount), pageWidth - 20, y + 8, { align: 'right' });
  
  doc.setFillColor(...primaryColor);
  doc.roundedRect(pageWidth - 100, y + 12, 85, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL PAYÉ:', pageWidth - 95, y + 20);
  doc.text(formatPrice(data.amount), pageWidth - 20, y + 20, { align: 'right' });
  
  y += 50;
  
  // Stamp and signature section - with real images
  await drawOfficialStamp(doc, 55, y + 25, 28);
  await drawSignature(doc, pageWidth - 55, y + 25);
  
  // Footer
  y = pageHeight - 20;
  doc.setFillColor(248, 249, 250);
  doc.rect(0, y - 10, pageWidth, 30, 'F');
  
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Ce reçu confirme le paiement intégral des services mentionnés.', pageWidth / 2, y, { align: 'center' });
  doc.text('Pour toute question: monentreprise@legalform.ci | +225 07 09 67 79 25 | www.legalform.ci', pageWidth / 2, y + 6, { align: 'center' });
  
  return doc;
};

export const generateInvoicePDF = async (data: InvoiceData): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryColor: [number, number, number] = [0, 124, 122];
  const textColor: [number, number, number] = [26, 26, 26];
  const mutedColor: [number, number, number] = [100, 100, 100];
  
  let y = 20;

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('LEGAL FORM', 20, 28);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("Création d'entreprises en Côte d'Ivoire", 20, 38);
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', pageWidth - 20, 28, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${data.invoiceNumber}`, pageWidth - 20, 38, { align: 'right' });
  
  y = 60;
  
  // Dates box
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(15, y, pageWidth - 30, 20, 3, 3, 'F');
  
  doc.setTextColor(...textColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text("Date d'émission:", 20, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDateShort(data.issueDate), 60, y + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.text("Date d'échéance:", 20, y + 15);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDateShort(data.dueDate), 60, y + 15);
  
  y += 30;
  
  // From / To section
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DE:', 20, y);
  doc.text('FACTURÉ À:', pageWidth / 2, y);
  
  y += 7;
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('LEGAL FORM CI', 20, y);
  doc.text(data.clientName || data.clientCompany || '', pageWidth / 2, y);
  
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text('Abidjan, Côte d\'Ivoire', 20, y);
  if (data.clientCompany && data.clientName) {
    doc.text(data.clientCompany, pageWidth / 2, y);
  }
  
  y += 4;
  doc.text('+225 07 09 67 79 25', 20, y);
  doc.text(data.clientPhone || '', pageWidth / 2, y);
  
  y += 4;
  doc.text('monentreprise@legalform.ci', 20, y);
  doc.text(data.clientEmail || '', pageWidth / 2, y);
  
  y += 15;
  
  // Items table header
  doc.setFillColor(...primaryColor);
  doc.rect(15, y, pageWidth - 30, 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 20, y + 7);
  doc.text('Qté', pageWidth - 80, y + 7, { align: 'center' });
  doc.text('Prix Unit.', pageWidth - 50, y + 7, { align: 'right' });
  doc.text('Total', pageWidth - 20, y + 7, { align: 'right' });
  
  y += 12;
  
  // Table rows
  let subtotal = 0;
  data.items.forEach((item, index) => {
    const rowTotal = item.quantity * item.unitPrice;
    subtotal += rowTotal;
    
    doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 249, index % 2 === 0 ? 255 : 250);
    doc.rect(15, y, pageWidth - 30, 12, 'F');
    
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(item.description.substring(0, 50), 20, y + 8);
    doc.text(item.quantity.toString(), pageWidth - 80, y + 8, { align: 'center' });
    doc.text(formatPrice(item.unitPrice), pageWidth - 50, y + 8, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatPrice(rowTotal), pageWidth - 20, y + 8, { align: 'right' });
    
    y += 12;
  });
  
  y += 10;
  
  // Totals
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(pageWidth - 100, y, 85, 30, 3, 3, 'F');
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.setFontSize(9);
  doc.text('Sous-total:', pageWidth - 95, y + 8);
  doc.text(formatPrice(subtotal), pageWidth - 20, y + 8, { align: 'right' });
  
  doc.text('TVA (0%):', pageWidth - 95, y + 16);
  doc.text(formatPrice(0), pageWidth - 20, y + 16, { align: 'right' });
  
  doc.setFillColor(...primaryColor);
  doc.roundedRect(pageWidth - 100, y + 20, 85, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', pageWidth - 95, y + 28);
  doc.text(formatPrice(subtotal), pageWidth - 20, y + 28, { align: 'right' });
  
  y += 50;
  
  // Notes
  if (data.notes) {
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(15, y, pageWidth - 30, 25, 3, 3, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, y + 8);
    doc.setTextColor(...mutedColor);
    doc.setFont('helvetica', 'normal');
    doc.text(data.notes.substring(0, 100), 20, y + 16);
    y += 35;
  }
  
  // Stamp and signature - with real images
  if (y < pageHeight - 80) {
    await drawOfficialStamp(doc, 55, y + 25, 28);
    await drawSignature(doc, pageWidth - 55, y + 25);
  }
  
  // Footer
  const footerY = pageHeight - 20;
  doc.setFillColor(248, 249, 250);
  doc.rect(0, footerY - 10, pageWidth, 30, 'F');
  
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Merci pour votre confiance. Paiement attendu avant la date d\'échéance.', pageWidth / 2, footerY, { align: 'center' });
  doc.text('Contact: monentreprise@legalform.ci | +225 07 09 67 79 25 | www.legalform.ci', pageWidth / 2, footerY + 6, { align: 'center' });
  
  return doc;
};

export const downloadReceiptPDF = async (data: ReceiptData): Promise<void> => {
  const doc = await generatePaymentReceiptPDF(data);
  doc.save(`Recu-${data.receiptNumber}.pdf`);
};

export const downloadInvoicePDF = async (data: InvoiceData): Promise<void> => {
  const doc = await generateInvoicePDF(data);
  doc.save(`Facture-${data.invoiceNumber}.pdf`);
};

export const getReceiptPDFBlob = async (data: ReceiptData): Promise<Blob> => {
  const doc = await generatePaymentReceiptPDF(data);
  return doc.output('blob');
};

export const getReceiptPDFBase64 = async (data: ReceiptData): Promise<string> => {
  const doc = await generatePaymentReceiptPDF(data);
  return doc.output('datauristring');
};

export const getInvoicePDFBlob = async (data: InvoiceData): Promise<Blob> => {
  const doc = await generateInvoicePDF(data);
  return doc.output('blob');
};

export const getInvoicePDFBase64 = async (data: InvoiceData): Promise<string> => {
  const doc = await generateInvoicePDF(data);
  return doc.output('datauristring');
};
