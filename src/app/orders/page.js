"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Filter, Search, Plus, X, Package, Calendar, DollarSign, User, Clock, Truck, CheckCircle } from "lucide-react";
import Layout from "../components/Layout";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter states
  const [filters, setFilters] = useState({
    orderTotal: { value: "", operator: "equal" }, // equal/not-equal/greater/less
    orderStatus: { value: "all", operator: "equal" },
    orderDate: { value: "", operator: "equal" }, // equal/after/before
    receivedBy: { value: "", operator: "include" }
  });

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderForm, setOrderForm] = useState({
    orderItems: [{ productId: "", quantity: 1 }],
    receivedBy: "",
    orderStatus: "confirmed"
  });

  // No need to send userId; backend uses cookie

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

        if (field === 'orderDate') {
          const orderDate = new Date(order.orderDate);
          const filterDate = new Date(filter.value);
          
          switch (filter.operator) {
            case 'equal':
              return orderDate.toDateString() === filterDate.toDateString();
            case 'after':
              return orderDate > filterDate;
            case 'before':
              return orderDate < filterDate;
            default:
              return true;
          }
        }

        return true;
      });
    });

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
    if (field === 'orderItems' && index !== null) {
      setOrderForm(prev => ({
        ...prev,
        orderItems: prev.orderItems.map((item, i) => 
          i === index ? { ...item, [value.field]: value.value } : item
        )
      }));
    } else {
      setOrderForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addOrderItem = () => {
    setOrderForm(prev => ({
      ...prev,
      orderItems: [...prev.orderItems, { productId: "", quantity: 1 }]
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
          quantity: item.quantity
        })),
        receivedBy: order.receivedBy,
        orderStatus: order.orderStatus
      });
    } else {
      setEditingOrder(null);
      setOrderForm({
        orderItems: [{ productId: "", quantity: 1 }],
        receivedBy: "",
        orderStatus: "confirmed"
      });
    }
    setShowOrderModal(true);
  };

  const saveOrder = async () => {
    try {
      const orderData = {
        ...orderForm,
        orderItems: orderForm.orderItems.filter(item => item.productId && item.quantity > 0)
      };

      if (orderData.orderItems.length === 0) {
        alert("Please add at least one product to the order");
        return;
      }

      const url = "/api/orders";
      const method = editingOrder ? "PUT" : "POST";
      if (editingOrder) {
        orderData.orderId = editingOrder._id;
      }

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
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
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
                    </select>
                  </div>

                  {/* Order Date Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Order Date
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={filters.orderDate.operator}
                        onChange={(e) => updateFilter('orderDate', 'operator', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="equal">On</option>
                        <option value="after">After</option>
                        <option value="before">Before</option>
                      </select>
                      <input
                        type="date"
                        value={filters.orderDate.value}
                        onChange={(e) => updateFilter('orderDate', 'value', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
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
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
              >
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{order.orderId}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {new Date(order.orderDate).toLocaleDateString()} at {order.orderTime}
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
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      <strong>Total:</strong> ${order.orderTotal.toFixed(2)}
                    </span>
                  </div>
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
                          ${item.itemTotal.toFixed(2)}
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
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
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

                <div className="space-y-6">
                  {/* Received By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Received By *
                    </label>
                    <input
                      type="text"
                      value={orderForm.receivedBy}
                      onChange={(e) => handleOrderFormChange('receivedBy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter recipient name"
                      maxLength="100"
                      required
                    />
                  </div>

                  {/* Order Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Status
                    </label>
                    <select
                      value={orderForm.orderStatus}
                      onChange={(e) => handleOrderFormChange('orderStatus', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>

                  {/* Order Items */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Order Items *
                      </label>
                      <button
                        onClick={addOrderItem}
                        className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
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
                                  {product.name} - ${product.price} (Stock: {product.stock})
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
                              onChange={(e) => handleOrderFormChange('orderItems', { field: 'quantity', value: parseInt(e.target.value) || 1 }, index)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                              min="1"
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

                    {/* Order Preview */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Order Preview:</h4>
                      <div className="space-y-1">
                        {orderForm.orderItems
                          .filter(item => item.productId && item.quantity > 0)
                          .map((item, idx) => {
                            const product = products.find(p => p._id === item.productId);
                            if (!product) return null;
                            const itemTotal = product.price * item.quantity;
                            return (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-700">
                                  {product.name} × {item.quantity}
                                </span>
                                <span className="font-medium">
                                  ${itemTotal.toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="flex justify-between font-bold">
                            <span>Total:</span>
                            <span>
                              ${orderForm.orderItems
                                .filter(item => item.productId && item.quantity > 0)
                                .reduce((total, item) => {
                                  const product = products.find(p => p._id === item.productId);
                                  return product ? total + (product.price * item.quantity) : total;
                                }, 0)
                                .toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
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
                    disabled={!orderForm.receivedBy || orderForm.orderItems.filter(item => item.productId && item.quantity > 0).length === 0}
                    className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingOrder ? "Update Order" : "Create Order"}
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