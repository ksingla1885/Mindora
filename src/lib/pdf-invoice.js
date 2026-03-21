/**
 * Stub: @/lib/pdf-invoice
 * Generates a simple PDF invoice using pdf-lib.
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * @param {Object} data - Invoice data
 * @returns {Promise<Uint8Array>} PDF bytes
 */
export async function createPdfInvoice(data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  const margin = 50;
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 11;
  let y = height - margin;

  const draw = (text, x, yPos, f = font, size = fontSize) => {
    page.drawText(String(text ?? ''), { x, y: yPos, size, font: f, color: rgb(0, 0, 0) });
  };

  // Header
  draw('INVOICE', margin, y, boldFont, 22);
  draw(data.company?.name || 'Mindora', width - 200, y, boldFont, 14);
  y -= 30;

  draw(`Invoice #: ${data.invoiceNumber}`, margin, y);
  draw(`Date: ${new Date(data.orderDate).toLocaleDateString('en-IN')}`, width - 200, y);
  y -= 20;

  draw(`Status: ${data.status?.toUpperCase()}`, margin, y);
  y -= 30;

  // Customer
  draw('Bill To:', margin, y, boldFont);
  y -= 18;
  draw(data.customer?.name || '', margin, y);
  y -= 15;
  draw(data.customer?.email || '', margin, y);
  y -= 15;
  const addr = data.customer?.address;
  if (addr?.line1) { draw(addr.line1, margin, y); y -= 15; }
  if (addr?.city) { draw(`${addr.city}, ${addr.state} ${addr.postalCode}`, margin, y); y -= 15; }
  y -= 20;

  // Items table header
  draw('Description', margin, y, boldFont);
  draw('Qty', width - 200, y, boldFont);
  draw('Price', width - 140, y, boldFont);
  draw('Total', width - 80, y, boldFont);
  y -= 5;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });
  y -= 15;

  // Items
  for (const item of data.items || []) {
    draw(item.name, margin, y);
    draw(item.quantity, width - 200, y);
    draw(`₹${Number(item.unitPrice).toFixed(2)}`, width - 140, y);
    draw(`₹${Number(item.total).toFixed(2)}`, width - 80, y);
    y -= 18;
    if (y < 100) break; // prevent overflow
  }

  y -= 10;
  page.drawLine({ start: { x: width - 220, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });
  y -= 18;

  // Totals
  draw(`Subtotal:`, width - 220, y); draw(`₹${Number(data.subtotal).toFixed(2)}`, width - 80, y); y -= 16;
  if (data.discount > 0) { draw(`Discount:`, width - 220, y); draw(`-₹${Number(data.discount).toFixed(2)}`, width - 80, y); y -= 16; }
  draw(`Tax (18%):`, width - 220, y); draw(`₹${Number(data.tax).toFixed(2)}`, width - 80, y); y -= 16;
  draw(`TOTAL:`, width - 220, y, boldFont); draw(`₹${Number(data.total).toFixed(2)}`, width - 80, y, boldFont); y -= 30;

  // Footer
  draw(data.notes || 'Thank you for your business!', margin, y, font, 9);

  return pdfDoc.save();
}
