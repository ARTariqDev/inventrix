import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateReportPDF({ month, products, orders, totals }) {
  try {
    console.log("Generating report for month:", month);
    console.log("Products:", products);
    console.log("Orders:", orders);
    console.log("Totals:", totals);

    // Calculate real totals from the data
    let realTotalSales = 0;
    let realTotalPurchases = 0;
    
    orders.forEach(order => {
      realTotalSales += Number(order.orderTotal) || 0;
    });
    
    products.forEach(product => {
      realTotalPurchases += (Number(product.purchasePrice) || 0) * (Number(product.stock) || 0);
    });
    
    const realProfitLoss = realTotalSales - realTotalPurchases;

    // Create PDF
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - (2 * margin);
    
    // Helper function to add header
    const addHeader = () => {
      doc.setFillColor(124, 58, 237); // Purple
      doc.rect(margin, margin, contentWidth, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('TwinStar Monthly Report', margin + 5, margin + 12);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Month: ${month}`, margin + 5, margin + 22);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin + 5, margin + 28);
      
      doc.setTextColor(0, 0, 0);
    };
    
    // Page 1: Header and Products
    addHeader();
    
    let yPos = margin + 45;
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(124, 58, 237);
    doc.text('Products', margin, yPos);
    yPos += 10;
    
    // Products table header
    doc.setFillColor(124, 58, 237);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Product', margin + 2, yPos + 5.5);
    doc.text('Product ID', margin + 60, yPos + 5.5);
    doc.text('Sale Price', margin + 100, yPos + 5.5);
    doc.text('Purchase', margin + 130, yPos + 5.5);
    doc.text('Stock', margin + 165, yPos + 5.5);
    yPos += 8;
    
    // Products table body
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    products.forEach((p, idx) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        addHeader();
        yPos = margin + 45;
      }
      
      if (idx % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, yPos, contentWidth, 7, 'F');
      }
      
      doc.setFontSize(8);
      doc.text(String(p.name || 'N/A').substring(0, 30), margin + 2, yPos + 5);
      doc.text(String(p.sku || 'N/A'), margin + 60, yPos + 5);
      doc.text(`$${Number(p.salePrice || 0).toFixed(2)}`, margin + 100, yPos + 5);
      doc.text(`$${Number(p.purchasePrice || 0).toFixed(2)}`, margin + 130, yPos + 5);
      doc.text(String(p.stock || 0), margin + 165, yPos + 5);
      yPos += 7;
    });
    
    // Page 2: Orders
    doc.addPage();
    addHeader();
    yPos = margin + 45;
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(236, 72, 153); // Pink
    doc.text('Orders', margin, yPos);
    yPos += 10;
    
    // Orders table header
    doc.setFillColor(236, 72, 153);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Order ID', margin + 2, yPos + 5.5);
    doc.text('Date', margin + 35, yPos + 5.5);
    doc.text('Total', margin + 70, yPos + 5.5);
    doc.text('Discount', margin + 95, yPos + 5.5);
    doc.text('Remaining', margin + 122, yPos + 5.5);
    doc.text('Recipient', margin + 152, yPos + 5.5);
    yPos += 8;
    
    // Orders table body
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    orders.forEach((o, idx) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        addHeader();
        yPos = margin + 45;
      }
      
      if (idx % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, yPos, contentWidth, 7, 'F');
      }
      
      doc.setFontSize(8);
      doc.text(String(o.orderId || o._id || 'N/A').substring(0, 12), margin + 2, yPos + 5);
      doc.text(o.orderDate ? new Date(o.orderDate).toLocaleDateString() : 'N/A', margin + 35, yPos + 5);
      doc.text(`$${Number(o.orderTotal || 0).toFixed(2)}`, margin + 70, yPos + 5);
      doc.text(`$${Number(o.discountAmount || 0).toFixed(2)}`, margin + 95, yPos + 5);
      doc.text(`$${Number(o.remainingAmount || 0).toFixed(2)}`, margin + 122, yPos + 5);
      doc.text(String(o.receivedBy || 'N/A').substring(0, 20), margin + 152, yPos + 5);
      yPos += 7;
    });
    
    // Summary section
    yPos += 15;
    if (yPos > pageHeight - 60) {
      doc.addPage();
      addHeader();
      yPos = margin + 45;
    }
    
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, yPos, contentWidth, 45, 'F');
    doc.setDrawColor(236, 72, 153);
    doc.setLineWidth(1);
    doc.rect(margin, yPos, contentWidth, 45);
    
    yPos += 10;
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(236, 72, 153);
    doc.text('Summary', margin + 5, yPos);
    
    yPos += 12;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('Total Sales:', margin + 5, yPos);
    doc.text(`$${realTotalSales.toFixed(2)}`, pageWidth - margin - 40, yPos);
    
    yPos += 10;
    doc.text('Total Purchases:', margin + 5, yPos);
    doc.text(`$${realTotalPurchases.toFixed(2)}`, pageWidth - margin - 40, yPos);
    
    yPos += 10;
    doc.text('Profit/Loss:', margin + 5, yPos);
    doc.setTextColor(realProfitLoss >= 0 ? 16 : 239, realProfitLoss >= 0 ? 185 : 68, realProfitLoss >= 0 ? 129 : 68);
    doc.text(`$${realProfitLoss.toFixed(2)}`, pageWidth - margin - 40, yPos);
    
    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('This is a digitally generated report', pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text('TwinStar Inventory Management System', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Save/download
    doc.save(`TwinStar_Report_${month}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert(`Failed to generate report: ${error.message}`);
    throw error;
  }
}
