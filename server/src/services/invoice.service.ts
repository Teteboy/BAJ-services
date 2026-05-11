import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface InvoiceData {
  invoiceNumber: string;
  issuedAt: Date;
  paymentDeadline: Date;
  client: {
    companyName: string;
    user?: { email: string };
  };
  order: {
    orderNumber: string;
  };
  items: {
    product: { name: string; code: string };
    quantity: number;
    unit: string;
    pricePerUnit: number;
    totalAmount: number;
  }[];
  totalAmount: number;
  paymentMethod: string;
}

export async function generateInvoicePDF(invoice: InvoiceData): Promise<string | null> {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads/invoices');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const pdfPath = path.join(uploadsDir, `${invoice.invoiceNumber}.pdf`);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(pdfPath);

      doc.pipe(stream);

      // Header
      doc
        .fontSize(22)
        .fillColor('#F4900C')
        .text('BAJ SERVICES', 50, 50)
        .fontSize(10)
        .fillColor('#666')
        .text('Fuel Order & Delivery Management')
        .moveDown(2);

      // Invoice title
      doc
        .fontSize(18)
        .fillColor('#111')
        .text('INVOICE', { align: 'right' })
        .fontSize(10)
        .fillColor('#666')
        .text(`#${invoice.invoiceNumber}`, { align: 'right' })
        .text(`Date: ${invoice.issuedAt.toLocaleDateString('en-GB')}`, { align: 'right' })
        .text(`Payment Deadline: ${invoice.paymentDeadline.toLocaleDateString('en-GB')}`, { align: 'right' });

      doc.moveDown(2);

      // Bill To
      doc
        .fontSize(10)
        .fillColor('#999')
        .text('BILL TO')
        .fontSize(12)
        .fillColor('#111')
        .text(invoice.client.companyName)
        .fontSize(10)
        .fillColor('#666')
        .text(invoice.client.user?.email ?? '');

      doc.moveDown(1);

      // Reference
      doc
        .fontSize(10)
        .fillColor('#666')
        .text(`Order Reference: #${invoice.order.orderNumber}`);

      doc.moveDown(2);

      // Table header
      const colX = [50, 220, 310, 390, 470];
      doc
        .fillColor('#F4900C')
        .rect(50, doc.y, 500, 20)
        .fill();

      doc
        .fillColor('#fff')
        .fontSize(9)
        .text('Product', colX[0], doc.y - 15)
        .text('Quantity', colX[1], doc.y - 15)
        .text('Unit', colX[2], doc.y - 15)
        .text('Price/Unit', colX[3], doc.y - 15)
        .text('Total', colX[4], doc.y - 15);

      doc.moveDown(0.5);

      // Table rows
      invoice.items.forEach((item, i) => {
        const y = doc.y;
        if (i % 2 === 0) {
          doc.fillColor('#f9f9f9').rect(50, y, 500, 18).fill();
        }
        doc
          .fillColor('#111')
          .fontSize(9)
          .text(item.product.name, colX[0], y + 4, { width: 160 })
          .text(item.quantity.toLocaleString(), colX[1], y + 4)
          .text(item.unit === 'LITERS' ? 'Liters' : 'm³', colX[2], y + 4)
          .text(`${item.pricePerUnit.toLocaleString()} XAF`, colX[3], y + 4)
          .text(`${item.totalAmount.toLocaleString()} XAF`, colX[4], y + 4);
        doc.moveDown(1);
      });

      doc.moveDown(1);

      // Total
      doc
        .fillColor('#F4900C')
        .fontSize(14)
        .text(`Total: ${invoice.totalAmount.toLocaleString()} XAF`, { align: 'right' });

      doc.moveDown(2);

      // Payment info
      doc
        .fillColor('#666')
        .fontSize(10)
        .text(`Payment Method: ${invoice.paymentMethod === 'VIREMENT' ? 'Virement bancaire' : 'Chèque'}`)
        .text(`Payment Deadline: ${invoice.paymentDeadline.toLocaleDateString('en-GB')}`);

      doc.moveDown(3);

      // Footer
      doc
        .fontSize(9)
        .fillColor('#aaa')
        .text('BAJ Services — Fuel Order & Delivery Management Platform', { align: 'center' });

      doc.end();

      stream.on('finish', () => resolve(pdfPath));
      stream.on('error', reject);
    });
  } catch (err) {
    console.error('[PDF] Failed to generate invoice PDF:', err);
    return null;
  }
}
