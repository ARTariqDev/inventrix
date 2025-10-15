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
    let realTotalProfit = 0;
    let totalRemainingAmount = 0;
    let ordersByStatus = {};
    
    orders.forEach(order => {
      realTotalSales += Number(order.orderTotal) || 0;
      totalRemainingAmount += Number(order.remainingAmount) || 0;
      const status = order.orderStatus || 'unknown';
      if (!ordersByStatus[status]) {
        ordersByStatus[status] = { count: 0, total: 0 };
      }
      ordersByStatus[status].count += 1;
      ordersByStatus[status].total += Number(order.orderTotal) || 0;
      
      // Calculate profit from order items (same formula as dashboard)
      if (order.orderItems && Array.isArray(order.orderItems)) {
        order.orderItems.forEach(item => {
          const salePrice = Number(item.salePrice) || 0;
          const purchasePrice = Number(item.purchasePrice) || 0;
          const quantity = Number(item.quantity) || 0;
          const itemProfit = (salePrice - purchasePrice) * quantity;
          realTotalProfit += itemProfit;
        });
      }
    });

    // Create PDF
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - (2 * margin);
    
    // Helper function to add header
    const addHeader = () => {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('Monthly Report', margin, margin + 10);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Month: ${month}`, margin, margin + 18);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, margin + 24);
      
      // Draw line under header
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(margin, margin + 28, pageWidth - margin, margin + 28);
    };
    
    // Page 1: Header and Products
    addHeader();
    
    let yPos = margin + 35;
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Products', margin, yPos);
    yPos += 10;
    
    // Products table header
    doc.setFillColor(220, 220, 220); // Light gray for header
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPos, contentWidth, 8, 'FD');
    
    // Draw vertical lines for columns
    const col1 = margin + 58;
    const col2 = margin + 98;
    const col3 = margin + 128;
    const col4 = margin + 163;
    doc.line(col1, yPos, col1, yPos + 8);
    doc.line(col2, yPos, col2, yPos + 8);
    doc.line(col3, yPos, col3, yPos + 8);
    doc.line(col4, yPos, col4, yPos + 8);
    
    doc.setTextColor(0, 0, 0);
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
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    
    // Calculate totals for products
    let totalSalePrice = 0;
    let totalPurchasePrice = 0;
    let totalStock = 0;
    
    products.forEach((p, idx) => {
      if (yPos > pageHeight - 40) { // Extra space for totals row
        doc.addPage();
        addHeader();
        yPos = margin + 35;
      }
      
      // Draw cell with border
      doc.rect(margin, yPos, contentWidth, 7, 'D');
      
      // Draw vertical lines for columns
      doc.line(col1, yPos, col1, yPos + 7);
      doc.line(col2, yPos, col2, yPos + 7);
      doc.line(col3, yPos, col3, yPos + 7);
      doc.line(col4, yPos, col4, yPos + 7);
      
      doc.setFontSize(8);
      doc.text(String(p.name || 'N/A').substring(0, 30), margin + 2, yPos + 5);
      doc.text(String(p.sku || 'N/A'), margin + 60, yPos + 5);
      doc.text(`Rs.${Number(p.salePrice || 0).toFixed(2)}`, margin + 100, yPos + 5);
      doc.text(`Rs.${Number(p.purchasePrice || 0).toFixed(2)}`, margin + 130, yPos + 5);
      doc.text(String(p.stock || 0), margin + 165, yPos + 5);
      yPos += 7;
      
      // Accumulate totals
      totalSalePrice += Number(p.salePrice || 0);
      totalPurchasePrice += Number(p.purchasePrice || 0);
      totalStock += Number(p.stock || 0);
    });
    
    // Add totals row
    doc.setFillColor(240, 240, 240); // Light gray for totals
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPos, contentWidth, 8, 'FD');
    
    // Draw vertical lines for columns
    doc.line(col1, yPos, col1, yPos + 8);
    doc.line(col2, yPos, col2, yPos + 8);
    doc.line(col3, yPos, col3, yPos + 8);
    doc.line(col4, yPos, col4, yPos + 8);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL', margin + 2, yPos + 5.5);
    doc.text(`Rs.${totalSalePrice.toFixed(2)}`, margin + 100, yPos + 5.5);
    doc.text(`Rs.${totalPurchasePrice.toFixed(2)}`, margin + 130, yPos + 5.5);
    doc.text(String(totalStock), margin + 165, yPos + 5.5);
    yPos += 8;
    
    // Page 2: Orders
    doc.addPage();
    addHeader();
    yPos = margin + 35;
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Orders', margin, yPos);
    yPos += 10;
    
    // Orders table header
    doc.setFillColor(220, 220, 220); // Light gray for header
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPos, contentWidth, 8, 'FD');
    
    // Draw vertical lines for columns (Order ID, Recipient, Date, Status, Discount, Total, Remaining)
    const orderCol1 = margin + 26;
    const orderCol2 = margin + 58;
    const orderCol3 = margin + 82;
    const orderCol4 = margin + 110;
    const orderCol5 = margin + 136;
    const orderCol6 = margin + 162;
    doc.line(orderCol1, yPos, orderCol1, yPos + 8);
    doc.line(orderCol2, yPos, orderCol2, yPos + 8);
    doc.line(orderCol3, yPos, orderCol3, yPos + 8);
    doc.line(orderCol4, yPos, orderCol4, yPos + 8);
    doc.line(orderCol5, yPos, orderCol5, yPos + 8);
    doc.line(orderCol6, yPos, orderCol6, yPos + 8);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.text('Order ID', margin + 2, yPos + 5.5);
    doc.text('Recipient', margin + 28, yPos + 5.5);
    doc.text('Date', margin + 60, yPos + 5.5);
    doc.text('Status', margin + 84, yPos + 5.5);
    doc.text('Discount', margin + 112, yPos + 5.5);
    doc.text('Total', margin + 138, yPos + 5.5);
    doc.text('Remaining', margin + 164, yPos + 5.5);
    yPos += 8;
    
    // Orders table body
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    
    orders.forEach((o, idx) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        addHeader();
        yPos = margin + 35;
      }
      
      // Draw cell with border
      doc.rect(margin, yPos, contentWidth, 7, 'D');
      
      // Draw vertical lines for columns
      doc.line(orderCol1, yPos, orderCol1, yPos + 7);
      doc.line(orderCol2, yPos, orderCol2, yPos + 7);
      doc.line(orderCol3, yPos, orderCol3, yPos + 7);
      doc.line(orderCol4, yPos, orderCol4, yPos + 7);
      doc.line(orderCol5, yPos, orderCol5, yPos + 7);
      doc.line(orderCol6, yPos, orderCol6, yPos + 7);
      
      doc.setFontSize(6.5);
      doc.text(String(o.orderId || o._id || 'N/A').substring(0, 8), margin + 2, yPos + 5);
      doc.text(String(o.receivedBy || 'N/A').substring(0, 14), margin + 28, yPos + 5);
      doc.text(o.orderDate ? new Date(o.orderDate).toLocaleDateString() : 'N/A', margin + 60, yPos + 5);
      doc.text(String(o.orderStatus || 'N/A').substring(0, 10), margin + 84, yPos + 5);
      doc.text(`Rs.${Number(o.discountAmount || 0).toFixed(0)}`, margin + 112, yPos + 5);
      doc.text(`Rs.${Number(o.orderTotal || 0).toFixed(0)}`, margin + 138, yPos + 5);
      doc.text(`Rs.${Number(o.remainingAmount || 0).toFixed(0)}`, margin + 164, yPos + 5);
      yPos += 7;
    });
    
    // Summary section
    yPos += 15;
    const numStatuses = Object.keys(ordersByStatus).length;
    const summaryHeight = 40 + (numStatuses * 7);
    if (yPos > pageHeight - summaryHeight - 20) {
      doc.addPage();
      addHeader();
      yPos = margin + 35;
    }
    
    const summaryStartY = yPos;
    
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Summary', margin + 5, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('Total Revenue:', margin + 5, yPos);
    doc.text(`Rs.${realTotalSales.toFixed(2)}`, pageWidth - margin - 40, yPos);
    
    yPos += 8;
    doc.text('Total Profit:', margin + 5, yPos);
    doc.text(`Rs.${realTotalProfit.toFixed(2)}`, pageWidth - margin - 40, yPos);
    
    // Total Remaining Amount (only if there's any remaining amount)
    if (totalRemainingAmount > 0) {
      yPos += 8;
      doc.text('Total Remaining (Credit):', margin + 5, yPos);
      doc.text(`Rs.${totalRemainingAmount.toFixed(2)}`, pageWidth - margin - 40, yPos);
    }
    
    // Orders by status
    yPos += 12;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Orders by Status:', margin + 5, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    Object.keys(ordersByStatus).forEach(status => {
      const statusData = ordersByStatus[status];
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
      doc.text(`${statusLabel}: ${statusData.count} orders (Rs.${statusData.total.toFixed(2)})`, margin + 10, yPos);
      yPos += 7;
    });
    
    // Draw border around summary after all content is added
    const actualSummaryHeight = yPos - summaryStartY + 5;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(margin, summaryStartY, contentWidth, actualSummaryHeight);
    
    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('This is a digitally generated report', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Save/download
    doc.save(`Monthly_Report_${month}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert(`Failed to generate report: ${error.message}`);
    throw error;
  }
}
