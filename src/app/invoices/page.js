"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Download, 
  Search, 
  Calendar,
  DollarSign,
  Package,
  User,
  Eye,
  X,
  Printer
} from "lucide-react";
import Layout from "../components/Layout";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function InvoicesPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const invoiceRef = useRef();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders based on search
  useEffect(() => {
    let filtered = [...orders];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderId.toLowerCase().includes(search) ||
        order.receivedBy.toLowerCase().includes(search) ||
        order.orderItems.some(item => 
          item.productName.toLowerCase().includes(search)
        )
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openInvoiceModal = (order) => {
    setSelectedOrder(order);
    setShowInvoiceModal(true);
  };

  const generatePDF = async () => {
    if (!invoiceRef.current) return;

    setGeneratingPDF(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice-${selectedOrder.orderId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Invoice Management
          </h1>
          <p className="text-gray-600">
            Generate and download invoices for your orders
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search orders by ID, recipient, or product..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Orders Available for Invoice
            </h2>
            <p className="text-gray-600 text-sm">
              {filteredOrders.length} of {orders.length} orders
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-purple-500 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                          {order.orderId}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(order.orderDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="w-4 h-4 mr-2" />
                        {order.receivedBy}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {formatCurrency(order.orderTotal)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openInvoiceModal(order)}
                        className="inline-flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Invoice
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-gray-500">
                {searchTerm ? "Try adjusting your search criteria" : "No orders available for invoice generation"}
              </p>
            </div>
          )}
        </motion.div>

        {/* Invoice Modal */}
        <AnimatePresence>
          {showInvoiceModal && selectedOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowInvoiceModal(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Invoice - {selectedOrder.orderId}
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={generatePDF}
                      disabled={generatingPDF}
                      className={`flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ${generatingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {generatingPDF ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          Download PDF
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowInvoiceModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                {/* Invoice Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                  <div ref={invoiceRef} className="p-8 bg-white">
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h1 className="text-3xl font-bold text-purple-600 mb-2">INVOICE</h1>
                        <div className="text-gray-600">
                          <p>Invoice #: {selectedOrder.orderId}</p>
                          <p>Date: {formatDate(selectedOrder.orderDate)}</p>
                          <p>Time: {selectedOrder.orderTime}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 mb-2">INVENTRIX</div>
                        <div className="text-gray-600">
                          <p>Inventory Management System</p>
                          <p>Digital Invoice</p>
                        </div>
                      </div>
                    </div>

                    {/* Bill To Section */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
                        <div className="text-gray-600">
                          <p className="font-medium text-gray-900">{selectedOrder.receivedBy}</p>
                          <p>Order Status: <span className="capitalize">{selectedOrder.orderStatus}</span></p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Details:</h3>
                        <div className="text-gray-600">
                          <p>Order ID: {selectedOrder.orderId}</p>
                          <p>Created by: {selectedOrder.userName}</p>
                          <p>Items: {selectedOrder.orderItems.length}</p>
                        </div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-8">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b-2 border-gray-300">
                            <th className="text-left py-3 px-2 font-semibold text-gray-900">Item</th>
                            <th className="text-right py-3 px-2 font-semibold text-gray-900">Price</th>
                            <th className="text-right py-3 px-2 font-semibold text-gray-900">Qty</th>
                            <th className="text-right py-3 px-2 font-semibold text-gray-900">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.orderItems.map((item, index) => (
                            <tr key={index} className="border-b border-gray-200">
                              <td className="py-3 px-2">
                                <div>
                                  <div className="font-medium text-gray-900">{item.productName}</div>
                                </div>
                              </td>
                              <td className="text-right py-3 px-2 text-gray-600">
                                {formatCurrency(item.productPrice)}
                              </td>
                              <td className="text-right py-3 px-2 text-gray-600">
                                {item.quantity}
                              </td>
                              <td className="text-right py-3 px-2 font-medium text-gray-900">
                                {formatCurrency(item.itemTotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Total Section */}
                    <div className="flex justify-end mb-8">
                      <div className="w-64">
                        <div className="border-t-2 border-gray-300 pt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                            <span className="text-2xl font-bold text-purple-600">
                              {formatCurrency(selectedOrder.orderTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 pt-6 text-center text-gray-500">
                      <p>Thank you for your business!</p>
                      <p className="text-sm mt-2">This is a digitally generated invoice from Inventrix</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
