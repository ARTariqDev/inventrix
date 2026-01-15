"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Filter, Search, Plus, X, Package, Calendar, Banknote, User, Clock, Truck, CheckCircle, XCircle } from "lucide-react";
import Layout from "../components/Layout";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [filters, setFilters] = useState({
    orderTotal: { value: "", operator: "equal" },
    orderStatus: { value: "all", operator: "equal" },
    startDate: "",
    endDate: "",
    receivedBy: { value: "", operator: "include" }
  });

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({
    orderItems: [{ productId: "", quantity: "" }],
    receivedBy: "",
    address: "",
    phoneNumber: "",
    orderStatus: "confirmed",
    creditAmount: "", // This stores the paid amount for credit orders
    remainingAmount: 0, // This stores the credit amount (remaining to be paid)
    hasDiscount: false,
    discountAmount: ""
  });

  // Track if autofill is active
  const [autofilled, setAutofilled] = useState(false);

  // No need to send userId; backend uses cookie

  // Input validation functions
  const formatPriceInput = (value) => {
    // Remove all non-digit and non-decimal characters
    const cleaned = value.replace(/[^0-9.]/g, '');
    
    // Split by decimal point
    const parts = cleaned.split('.');
    
    // If more than one decimal point, only keep the first one
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return cleaned;
  };

  const handlePriceKeyPress = (e) => {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    ];
    
    const isNumber = /[0-9]/.test(e.key);
    const isDecimal = e.key === '.' && !e.target.value.includes('.');
    
    // Allow special keys, numbers, and one decimal point
    if (!allowedKeys.includes(e.key) && !isNumber && !isDecimal) {
      e.preventDefault();
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders`);
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

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

    // Define calculateCreditAmount function (calculates remaining credit amount)
  const calculateRemainingAmount = useCallback((formData) => {
    const subtotal = formData.orderItems
      .filter(item => item.productId && item.quantity && Number(item.quantity) > 0)
      .reduce((total, item) => {
        const product = products.find(p => p._id === item.productId);
        // Use stored price for deleted products, otherwise use current product price
        const price = product ? product.salePrice : (item.storedPrice || 0);
        return total + (price * Number(item.quantity));
      }, 0);
    
    // Apply discount if enabled
    const discountAmount = formData.hasDiscount ? Number(formData.discountAmount) || 0 : 0;
    const finalTotal = Math.max(0, subtotal - discountAmount);
    
    // Calculate remaining amount for credit orders
    const creditAmount = formData.creditAmount === '' ? 0 : Number(formData.creditAmount) || 0;
    return Math.max(0, finalTotal - creditAmount);
  }, [products]);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...orders];

    // Search filter
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

    // Apply other filters
    Object.entries(filters).forEach(([field, filter]) => {
      if (["startDate", "endDate"].includes(field)) return;
      if (!filter.value || (filter.value === 'all')) return;

      filtered = filtered.filter(order => {
        if (field === 'orderStatus') {
          return order.orderStatus === filter.value;
        }

        if (field === 'receivedBy') {
          const orderText = String(order.receivedBy).toLowerCase();
          const filterText = String(filter.value).toLowerCase();
          return filter.operator === 'include' 
            ? orderText.includes(filterText)
            : !orderText.includes(filterText);
        }

        if (field === 'orderTotal') {
          const orderTotal = Number(order.orderTotal);
          const filterTotal = Number(filter.value);
          
          switch (filter.operator) {
            case 'equal':
              return orderTotal === filterTotal;
            case 'not-equal':
              return orderTotal !== filterTotal;
            case 'greater':
              return orderTotal > filterTotal;
            case 'less':
              return orderTotal < filterTotal;
            default:
              return true;
          }
        }
        return true;
      });
    });
    // Date range filter
    if (filters.startDate) {
      filtered = filtered.filter(order => new Date(order.orderDate) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter(order => new Date(order.orderDate) <= new Date(filters.endDate));
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, filters]);

  const updateFilter = (field, key, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: { ...prev[field], [key]: value }
    }));
  };

  const clearFilters = () => {
    setFilters({
      orderTotal: { value: "", operator: "equal" },
      orderStatus: { value: "all", operator: "equal" },
      orderDate: { value: "", operator: "equal" },
      receivedBy: { value: "", operator: "include" }
    });
    setSearchTerm("");
  };

  const hasActiveFilters = () => {
    return searchTerm.trim() || 
           Object.values(filters).some(filter => 
             filter.value && filter.value !== "all"
           );
  };

  const handleOrderFormChange = (field, value, index = null) => {
    if (field === 'phoneNumber') {
      // When phone changes, check for previous order
      const match = orders.find(order => order.phoneNumber && order.phoneNumber === value);
      if (match) {
        setOrderForm(prev => ({
          ...prev,
          phoneNumber: value,
          receivedBy: match.receivedBy,
          address: match.address
        }));
        setAutofilled(true);
        return;
      } else {
        setAutofilled(false);
        setOrderForm(prev => ({ ...prev, phoneNumber: value }));
        return;
      }
    }
    if (field === 'clearAutofill') {
      setOrderForm(prev => ({ ...prev, receivedBy: '', address: '' }));
      setAutofilled(false);
      return;
    }
    if (field === 'orderItems' && index !== null) {
      const newOrderForm = {
        ...orderForm,
        orderItems: orderForm.orderItems.map((item, i) => 
          i === index ? { ...item, [value.field]: value.value } : item
        )
      };
      if (newOrderForm.orderStatus === 'credit') {
        newOrderForm.remainingAmount = calculateRemainingAmount(newOrderForm);
      }
      setOrderForm(newOrderForm);
    } else if (field === 'creditAmount' || field === 'discountAmount') {
      const newOrderForm = { ...orderForm, [field]: value };
      if (newOrderForm.orderStatus === 'credit') {
        newOrderForm.remainingAmount = calculateRemainingAmount(newOrderForm);
      }
      setOrderForm(newOrderForm);
    } else if (field === 'hasDiscount') {
      const newOrderForm = { ...orderForm, [field]: value };
      if (!value) {
        newOrderForm.discountAmount = "";
      }
      if (newOrderForm.orderStatus === 'credit') {
        newOrderForm.remainingAmount = calculateRemainingAmount(newOrderForm);
      }
      setOrderForm(newOrderForm);
    } else {
      const newOrderForm = { ...orderForm, [field]: value };
      if (field === 'orderStatus' && value === 'credit') {
        newOrderForm.remainingAmount = calculateRemainingAmount(newOrderForm);
      } else if (field === 'orderStatus' && value !== 'credit') {
        newOrderForm.creditAmount = "";
        newOrderForm.remainingAmount = 0;
      }
      setOrderForm(newOrderForm);
    }
  };

  const addOrderItem = () => {
    setOrderForm(prev => ({
      ...prev,
      orderItems: [...prev.orderItems, { productId: "", quantity: "" }]
    }));
  };

  const removeOrderItem = (index) => {
    if (orderForm.orderItems.length > 1) {
      setOrderForm(prev => ({
        ...prev,
        orderItems: prev.orderItems.filter((_, i) => i !== index)
      }));
    }
  };

  const openOrderModal = (order = null) => {
    if (order) {
      setEditingOrder(order);
      setOrderForm({
        orderItems: order.orderItems.map(item => ({
          productId: item.productId._id || item.productId,
          quantity: item.quantity,
          // Store the product price from the order for deleted products
          storedPrice: item.productPrice,
          storedName: item.productName
        })),
        receivedBy: order.receivedBy,
        address: order.address || "",
        phoneNumber: order.phoneNumber || "",
        orderStatus: order.orderStatus,
        creditAmount: order.creditAmount || 0,
        remainingAmount: order.remainingAmount || 0,
        hasDiscount: !!(order.discountAmount && order.discountAmount > 0),
        discountAmount: order.discountAmount || ""
      });
    } else {
      setEditingOrder(null);
      setOrderForm({
        orderItems: [{ productId: "", quantity: "" }],
        receivedBy: "",
        address: "",
        phoneNumber: "",
        orderStatus: "confirmed",
        creditAmount: "",
        remainingAmount: 0,
        hasDiscount: false,
        discountAmount: ""
      });
    }
    setShowOrderModal(true);
  };

  const saveOrder = async () => {
    if (savingOrder) return; // Prevent double submission
    
    try {
      setSavingOrder(true);
      
      // Check if editing an order with deleted products
      const hasDeletedProducts = editingOrder && editingOrder.orderItems && 
        editingOrder.orderItems.some(item => 
          !item.productId || (typeof item.productId === 'object' && item.productId === null)
        );
      
      let orderData;
      
      if (hasDeletedProducts && editingOrder) {
        // Only send status-related updates for orders with deleted products
        orderData = {
          orderId: editingOrder._id,
          receivedBy: orderForm.receivedBy,
          address: orderForm.address,
          phoneNumber: orderForm.phoneNumber,
          orderStatus: orderForm.orderStatus,
          creditAmount: orderForm.creditAmount,
          remainingAmount: orderForm.remainingAmount,
          discountAmount: orderForm.hasDiscount ? Number(orderForm.discountAmount) || 0 : 0
          // Note: orderItems is intentionally omitted to skip product validation
        };
      } else {
        orderData = {
          ...orderForm,
          orderItems: orderForm.orderItems.filter(item => item.productId && item.quantity && Number(item.quantity) > 0),
          discountAmount: orderForm.hasDiscount ? Number(orderForm.discountAmount) || 0 : 0
        };

        if (orderData.orderItems.length === 0) {
          alert("Please add at least one product to the order");
          return;
        }

        if (editingOrder) {
          orderData.orderId = editingOrder._id;
        }
      }

      const url = "/api/orders";
      const method = editingOrder ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        setShowOrderModal(false);
        setEditingOrder(null);
        await fetchOrders();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save order");
      }
    } catch (error) {
      console.error("Error saving order:", error);
      alert("Error saving order");
    } finally {
      setSavingOrder(false);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
      const response = await fetch(`/api/orders?orderId=${orderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchOrders();
      } else {
        alert("Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Error deleting order");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <Clock className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'credit': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Orders Management
          </h1>
          <p className="text-gray-600">
            {filteredOrders.length} of {orders.length} orders
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4 mb-4">
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
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors"
            >
              <Filter size={20} />
              Filters
              {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors"
              >
                <X size={20} />
                Clear
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-gray-200 pt-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Order Total Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Order Total
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={filters.orderTotal.operator}
                        onChange={(e) => updateFilter('orderTotal', 'operator', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="equal">=</option>
                        <option value="not-equal">≠</option>
                        <option value="greater">&gt;</option>
                        <option value="less">&lt;</option>
                      </select>
                      <input
                        type="number"
                        value={filters.orderTotal.value}
                        onChange={(e) => updateFilter('orderTotal', 'value', e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Order Status Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={filters.orderStatus.value}
                      onChange={(e) => updateFilter('orderStatus', 'value', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    >
                      <option value="all">All Status</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>

                  {/* Order Date Range Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                    <label className="block text-sm font-medium text-gray-700 mt-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>

                  {/* Received By Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Received By
                    </label>
                    <input
                      type="text"
                      value={filters.receivedBy.value}
                      onChange={(e) => updateFilter('receivedBy', 'value', e.target.value)}
                      placeholder="Filter by recipient..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Orders Grid */}
        <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
              >
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{order.orderId}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {new Date(order.orderDate).toLocaleDateString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })} at {new Date(order.orderDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                    {getStatusIcon(order.orderStatus)}
                    {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                  </div>
                </div>

                {/* Order Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      <strong>Received by:</strong> {order.receivedBy}
                    </span>
                  </div>
                  
                  {order.address && (
                    <div className="flex items-start gap-2">
                      <Package className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-sm text-gray-600">
                        <strong>Address:</strong> {order.address}
                      </span>
                    </div>
                  )}
                  
                  {order.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        <strong>Phone:</strong> {order.phoneNumber}
                      </span>
                    </div>
                  )}
                  
                  {/* Discount Information - Show if discount was applied */}
                  {order.discountAmount > 0 && (
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-gray-600">
                        <strong>Subtotal:</strong> Rs {(order.subtotal || (order.orderTotal + order.discountAmount)).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {order.discountAmount > 0 && (
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-600">
                        <strong>Discount:</strong> - Rs {order.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      <strong>Total:</strong> Rs {order.orderTotal.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Credit Information - Only show for credit orders */}
                  {order.orderStatus === 'credit' && (
                    <>
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-600">
                          <strong>Paid Amount:</strong> Rs {(order.creditAmount || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-gray-600">
                          <strong>Credit Amount:</strong> Rs {(order.remainingAmount || 0).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Order Items */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Order Items:</h4>
                  <div className="space-y-1">
                    {order.orderItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="font-medium">
                          Rs {item.itemTotal.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openOrderModal(order)}
                    className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    Edit Order
                  </button>
                  <button
                    onClick={() => deleteOrder(order._id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredOrders.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {hasActiveFilters() ? "No orders match your filters" : "No orders found"}
            </h3>
            <p className="text-gray-500 mb-4">
              {hasActiveFilters() 
                ? "Try adjusting your search criteria"
                : "Start by creating your first order"
              }
            </p>
            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        )}

        {/* Add Order Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
          onClick={() => openOrderModal()}
        >
          <Plus size={24} />
        </motion.button>

        {/* Order Modal */}
        <AnimatePresence>
          {showOrderModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowOrderModal(false);
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingOrder ? "Edit Order" : "Create New Order"}
                  </h2>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Deleted Products Warning */}
                {editingOrder && editingOrder.orderItems && (() => {
                  const deletedProducts = editingOrder.orderItems.filter(item => 
                    !item.productId || (typeof item.productId === 'object' && item.productId === null)
                  );
                  if (deletedProducts.length > 0) {
                    return (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600 mt-0.5">⚠️</span>
                          <div className="text-sm">
                            <p className="font-medium text-amber-800">This order contains deleted products</p>
                            <p className="text-amber-600 text-xs mt-1">
                              {deletedProducts.map((item, idx) => (
                                <span key={idx}>
                                  {item.productName || 'Unknown Product'} (deleted)
                                  {idx < deletedProducts.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </p>
                            <p className="text-amber-600 text-xs mt-1">
                              You can still update the order status, but cannot modify order items.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="space-y-6">
                  {/* Section 1: Customer Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Customer Information</h3>
                    
                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={orderForm.phoneNumber}
                        onChange={(e) => handleOrderFormChange('phoneNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter phone number"
                        maxLength="20"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Previous order details will auto-fill if phone exists
                      </p>
                    </div>

                    {/* Name & Address Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Received By *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={orderForm.receivedBy}
                            onChange={(e) => handleOrderFormChange('receivedBy', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter recipient name"
                            maxLength="100"
                            required
                            disabled={autofilled}
                          />
                          {autofilled && (
                            <button
                              type="button"
                              onClick={() => handleOrderFormChange('clearAutofill')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 transition-colors"
                              title="Clear autofilled fields"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delivery Address *
                        </label>
                        <input
                          type="text"
                          value={orderForm.address}
                          onChange={(e) => handleOrderFormChange('address', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter delivery address"
                          maxLength="500"
                          required
                          disabled={autofilled}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Order Items */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="text-lg font-semibold text-gray-900">Order Items *</h3>
                      <button
                        onClick={addOrderItem}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                      >
                        <Plus size={16} />
                        Add Item
                      </button>
                    </div>
                    <div className="space-y-3">
                      {orderForm.orderItems.map((item, index) => (
                        <div key={index} className="flex gap-3 items-start p-4 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Product
                            </label>
                            <select
                              value={item.productId}
                              onChange={(e) => handleOrderFormChange('orderItems', { field: 'productId', value: e.target.value }, index)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                              required
                            >
                              <option value="">Select a product</option>
                              {products.map((product) => (
                                <option key={product._id} value={product._id}>
                                  {product.name} - Rs {product.salePrice} (Stock: {product.stock})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-24">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Qty
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleOrderFormChange('orderItems', { field: 'quantity', value: e.target.value === '' ? '' : parseInt(e.target.value) || '' }, index)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                              min="1"
                              placeholder="1"
                              required
                            />
                          </div>

                          {orderForm.orderItems.length > 1 && (
                            <button
                              onClick={() => removeOrderItem(index)}
                              className="mt-6 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                  </div>

                  {/* Section 3: Discount (Only show if items exist) */}
                  {orderForm.orderItems.some(item => item.productId && item.quantity && Number(item.quantity) > 0) && (
                    <div className="space-y-4">
                      <div className="border-b pb-2">
                        <h3 className="text-lg font-semibold text-gray-900">Discount (Optional)</h3>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Apply Discount
                          </label>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Toggle to apply a discount to this order
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOrderFormChange('hasDiscount', !orderForm.hasDiscount)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                            orderForm.hasDiscount ? 'bg-purple-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              orderForm.hasDiscount ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {orderForm.hasDiscount && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Discount Amount *
                          </label>
                          <input
                            type="text"
                            value={orderForm.discountAmount}
                            onChange={(e) => handleOrderFormChange('discountAmount', formatPriceInput(e.target.value))}
                            onKeyDown={handlePriceKeyPress}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="0.00"
                            inputMode="decimal"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Enter the discount amount to deduct from subtotal
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Section 4: Order Summary */}
                  {orderForm.orderItems.some(item => item.productId && item.quantity && Number(item.quantity) > 0) && (
                    <div className="space-y-4">
                      <div className="border-b pb-2">
                        <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <div className="space-y-2">
                          {orderForm.orderItems
                            .filter(item => item.productId && item.quantity && Number(item.quantity) > 0)
                            .map((item, idx) => {
                              const product = products.find(p => p._id === item.productId);
                              // Use stored price/name for deleted products
                              const price = product ? product.salePrice : (item.storedPrice || 0);
                              const name = product ? product.name : (item.storedName || 'Deleted Product');
                              if (!product && !item.storedPrice) return null;
                              const itemTotal = price * Number(item.quantity);
                              return (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className={`${!product ? 'text-gray-400 italic' : 'text-gray-700'}`}>
                                    {name}{!product && ' (deleted)'} × {item.quantity}
                                  </span>
                                  <span className="font-medium">
                                    Rs {itemTotal.toFixed(2)}
                                  </span>
                                </div>
                              );
                            })}
                          
                          <div className="border-t border-purple-200 pt-2 mt-2 space-y-1">
                            {(() => {
                              const subtotal = orderForm.orderItems
                                .filter(item => item.productId && item.quantity && Number(item.quantity) > 0)
                                .reduce((total, item) => {
                                  const product = products.find(p => p._id === item.productId);
                                  const price = product ? product.salePrice : (item.storedPrice || 0);
                                  return total + (price * Number(item.quantity));
                                }, 0);
                              
                              const discountAmount = orderForm.hasDiscount ? Number(orderForm.discountAmount) || 0 : 0;
                              const finalTotal = Math.max(0, subtotal - discountAmount);

                              return (
                                <>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-700">Subtotal:</span>
                                    <span className="font-medium">Rs {subtotal.toFixed(2)}</span>
                                  </div>
                                  {orderForm.hasDiscount && discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-red-600">
                                      <span>Discount:</span>
                                      <span className="font-medium">- Rs {discountAmount.toFixed(2)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between font-bold text-lg border-t border-purple-300 pt-2 mt-2">
                                    <span>Total:</span>
                                    <span className="text-purple-700">Rs {finalTotal.toFixed(2)}</span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 5: Order Status & Payment */}
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="text-lg font-semibold text-gray-900">Order Status & Payment</h3>
                    </div>
                    
                    {/* Order Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Order Status *
                      </label>
                      <select
                        value={orderForm.orderStatus}
                        onChange={(e) => handleOrderFormChange('orderStatus', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="credit">Credit (Partial Payment)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Select &quot;Credit&quot; if customer pays partially
                      </p>
                    </div>

                    {/* Credit Payment - Only show when status is credit */}
                    {orderForm.orderStatus === 'credit' && (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount Paid (Received) *
                          </label>
                          <input
                            type="text"
                            value={orderForm.creditAmount}
                            onChange={(e) => handleOrderFormChange('creditAmount', formatPriceInput(e.target.value))}
                            onKeyDown={handlePriceKeyPress}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="0.00"
                            inputMode="decimal"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Enter the amount customer paid now (remaining will be on credit)
                          </p>
                        </div>
                        
                        {/* Credit Summary */}
                        <div className="p-3 bg-white rounded-lg border border-orange-300">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Credit Summary:</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-700">Order Total:</span>
                              <span className="font-medium">Rs {(() => {
                                const subtotal = orderForm.orderItems
                                  .filter(item => item.productId && item.quantity && Number(item.quantity) > 0)
                                  .reduce((total, item) => {
                                    const product = products.find(p => p._id === item.productId);
                                    const price = product ? product.salePrice : (item.storedPrice || 0);
                                    return total + (price * Number(item.quantity));
                                  }, 0);
                                const discount = orderForm.hasDiscount ? Number(orderForm.discountAmount) || 0 : 0;
                                return Math.max(0, subtotal - discount).toFixed(2);
                              })()}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                              <span>Amount Paid:</span>
                              <span className="font-medium">Rs {(Number(orderForm.creditAmount) || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-semibold text-red-600 border-t border-gray-200 pt-1 mt-1">
                              <span>Credit Amount (Remaining):</span>
                              <span>Rs {orderForm.remainingAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveOrder}
                    disabled={
                      savingOrder || 
                      !orderForm.receivedBy || 
                      !orderForm.address || 
                      !orderForm.phoneNumber || 
                      orderForm.orderItems.filter(item => item.productId && item.quantity && Number(item.quantity) > 0).length === 0 ||
                      (orderForm.hasDiscount && (!orderForm.discountAmount || Number(orderForm.discountAmount) <= 0)) ||
                      (orderForm.orderStatus === 'credit' && (!orderForm.creditAmount || Number(orderForm.creditAmount) < 0))
                    }
                    className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {savingOrder ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {editingOrder ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editingOrder ? "Update Order" : "Create Order"
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}