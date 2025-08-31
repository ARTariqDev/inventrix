"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Banknote, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  Calendar,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart,
  Activity,
  Eye,
  Plus,
  Minus
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import Layout from "../components/Layout";
import Button from "../components/Button";
import { useRouter } from "next/navigation";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: "30",
    category: "all",
    status: "all"
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'recent-orders', 'low-stock', 'top-products'
  const [expandedData, setExpandedData] = useState(null);

  // Fetch user information
  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/verify');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      router.push('/login');
    }
  }, [router]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/stats?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUser();
    fetchStats();
  }, [fetchUser, fetchStats]);

  const [updatingStock, setUpdatingStock] = useState(new Set());

  const updateProductStock = async (productId, newStock) => {
    try {
      // First, get the current product data
      const getResponse = await fetch(`/api/products?id=${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!getResponse.ok) {
        console.error("Failed to fetch product data:", await getResponse.text());
        return false;
      }

      const productData = await getResponse.json();
      const product = productData.products[0]; // Assuming the API returns products array

      if (!product) {
        console.error("Product not found");
        return false;
      }

      // Now update with all required fields
      const response = await fetch(`/api/products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: productId,
          updates: { 
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            stock: newStock,
            isActive: product.isActive
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the expanded data to reflect the change
        if (expandedData?.products) {
          setExpandedData(prev => ({
            ...prev,
            products: prev.products.map(product => 
              product._id === productId 
                ? { ...product, stock: newStock }
                : product
            ).filter(product => product.stock <= 10) // Remove products that are no longer low stock
          }));
        }
        
        // Also update stats if the product is in lowStockProducts
        setStats(prev => ({
          ...prev,
          lowStockProducts: prev.lowStockProducts.map(product =>
            product._id === productId
              ? { ...product, stock: newStock }
              : product
          ).filter(product => product.stock <= 10) // Remove products that are no longer low stock
        }));
        
        return true;
      } else {
        console.error("Failed to update product stock:", await response.text());
        return false;
      }
    } catch (error) {
      console.error("Failed to update product stock:", error);
      return false;
    }
  };

  const handleStockChange = async (productId, currentStock, increment) => {
    const newStock = increment ? currentStock + 1 : Math.max(0, currentStock - 1);
    
    // Add to updating set
    setUpdatingStock(prev => new Set([...prev, productId]));
    
    try {
      const success = await updateProductStock(productId, newStock);
      if (!success) {
        // Optionally show an error message to user
        console.error("Failed to update stock");
      }
    } finally {
      // Remove from updating set
      setUpdatingStock(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleViewMore = async (viewType) => {
    // Special case: redirect to orders page for recent orders
    if (viewType === 'recent-orders') {
      router.push('/invoices');
      return;
    }

    setLoading(true);
    setCurrentView(viewType);
    
    try {
      let endpoint = '';
      switch (viewType) {
        case 'low-stock':
          endpoint = '/api/products?stock=10&stockOperator=less';
          break;
        case 'top-products':
          endpoint = '/api/stats?detail=top-products';
          break;
        default:
          setCurrentView('dashboard');
          setLoading(false);
          return;
      }
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        // Ensure we filter out any products that might not meet the low stock criteria
        if (viewType === 'low-stock' && data.products) {
          data.products = data.products.filter(product => product.stock <= 10);
        }
        setExpandedData(data);
      }
    } catch (error) {
      console.error("Failed to fetch expanded data:", error);
    } finally {
      setLoading(false);
    }
  };

  const returnToDashboard = () => {
    setCurrentView('dashboard');
    setExpandedData(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render expanded views
  const renderExpandedView = () => {
    if (currentView === 'dashboard') return null;

    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="flex items-center gap-2">
            <ChevronLeft size={20} className="text-gray-600" />
            <Button
              text="Back to Dashboard"
              onClick={returnToDashboard}
              color="#ffffff"
              textColor="#374151"
              glowColor="#8b5cf6"
              rippleColor="rgba(139, 92, 246, 0.2)"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {currentView === 'recent-orders' && 'All Recent Orders'}
              {currentView === 'low-stock' && 'Low Stock Products'}
              {currentView === 'top-products' && 'Top Performing Products'}
            </h1>
            <p className="text-gray-600">
              {currentView === 'recent-orders' && 'Complete list of all orders'}
              {currentView === 'low-stock' && 'Products that need restocking'}
              {currentView === 'top-products' && 'Best selling products by revenue'}
            </p>
          </div>
        </motion.div>

        {/* Expanded Content */}
        {currentView === 'recent-orders' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">All Orders</h2>
              <p className="text-sm text-gray-600">Total: {expandedData?.orders?.length || 0} orders</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expandedData?.orders && expandedData.orders.length > 0 ? (
                    expandedData.orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.receivedBy}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(order.orderTotal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.orderItems?.length || 0} items
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <ShoppingCart className="w-12 h-12 text-gray-300 mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Found</h3>
                          <p className="text-gray-600">No orders match the current filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {currentView === 'low-stock' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Low Stock Products</h2>
              <p className="text-sm text-gray-600">Products with 10 or fewer items in stock</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {expandedData?.products && expandedData.products.length > 0 ? (
                // Remove duplicates and ensure stock <= 10
                expandedData.products
                  .filter((product, index, self) => 
                    product.stock <= 10 && 
                    index === self.findIndex(p => p._id === product._id)
                  )
                  .map((product) => (
                  <div key={product._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.category}</p>
                        <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stock <= 5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.stock} left
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(product.price)}</span>
                      <div className="w-full max-w-20 bg-gray-200 rounded-full h-2 ml-3">
                        <div 
                          className={`h-2 rounded-full ${
                            product.stock <= 5 ? 'bg-red-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min((product.stock / 20) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Stock Control Buttons */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStockChange(product._id, product.stock, false)}
                          disabled={product.stock <= 0 || updatingStock.has(product._id)}
                          className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {updatingStock.has(product._id) ? (
                            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Minus className="w-4 h-4" />
                          )}
                        </button>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Stock:</span>
                          <span className="font-semibold text-gray-900 min-w-[2rem] text-center">
                            {product.stock}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => handleStockChange(product._id, product.stock, true)}
                          disabled={updatingStock.has(product._id)}
                          className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {updatingStock.has(product._id) ? (
                            <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Quick adjust
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">All Products Well Stocked!</h3>
                  <p className="text-gray-600">No products are currently running low on stock.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {currentView === 'top-products' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Top Performing Products</h2>
              <p className="text-sm text-gray-600">Products ranked by total revenue generated</p>
            </div>
            
            <div className="space-y-4 p-6">
              {stats?.topProducts?.map((product, index) => (
                <div key={product._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' :
                      'bg-purple-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.productName}</h3>
                      <p className="text-sm text-gray-600">{product.totalQuantity} units sold</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(product.totalRevenue)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Avg: {formatCurrency(product.totalRevenue / product.totalQuantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
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

  // Render expanded view if not on dashboard
  if (currentView !== 'dashboard') {
    return <Layout>{renderExpandedView()}</Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Welcome {user?.fullName || 'User'}
            </h1>
            <p className="text-gray-600">
              Analytics and performance metrics for your inventory
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Filter size={16} />
              Filters
              <ChevronDown size={16} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </motion.div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Period
                  </label>
                  <select
                    value={filters.period}
                    onChange={(e) => updateFilter('period', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => updateFilter('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Categories</option>
                    {stats?.filters?.availableCategories?.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => updateFilter('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Total Revenue",
              value: formatCurrency(stats?.overview?.totalRevenue || 0),
              icon: Banknote,
              color: "from-green-500 to-emerald-500",
              change: "+12.5%"
            },
            {
              title: "Total Orders",
              value: stats?.overview?.totalOrders || 0,
              icon: ShoppingCart,
              color: "from-blue-500 to-cyan-500",
              change: "+8.2%"
            },
            {
              title: "Products",
              value: stats?.overview?.totalProducts || 0,
              icon: Package,
              color: "from-purple-500 to-pink-500",
              change: "+3.1%"
            },
            {
              title: "Avg Order Value",
              value: formatCurrency(stats?.overview?.avgOrderValue || 0),
              icon: TrendingUp,
              color: "from-orange-500 to-red-500",
              change: "+5.7%"
            }
          ].map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${card.color} flex items-center justify-center`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-green-600 font-medium">
                  {card.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {card.value}
              </h3>
              <p className="text-gray-600 text-sm">
                {card.title}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Daily Revenue</h3>
                <p className="text-sm text-gray-600">Revenue trends over time</p>
              </div>
            </div>

            <div className="h-64">
              {stats?.dailyRevenue && stats.dailyRevenue.length > 0 ? (
                <Line
                  data={{
                    labels: stats.dailyRevenue.slice(-14).map(day => formatDate(day.date)),
                    datasets: [
                      {
                        label: 'Revenue',
                        data: stats.dailyRevenue.slice(-14).map(day => day.revenue),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                          label: function(context) {
                            return `Revenue: ${formatCurrency(context.parsed.y)}`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          color: '#6b7280',
                          font: {
                            size: 12
                          }
                        }
                      },
                      y: {
                        grid: {
                          color: 'rgba(209, 213, 219, 0.3)',
                        },
                        ticks: {
                          color: '#6b7280',
                          font: {
                            size: 12
                          },
                          callback: function(value) {
                            return formatCurrency(value);
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No revenue data available</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Order Status Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>
                <p className="text-sm text-gray-600">Distribution by status</p>
              </div>
            </div>

            <div className="h-64">
              {stats?.statusDistribution && stats.statusDistribution.length > 0 ? (
                <Doughnut
                  data={{
                    labels: stats.statusDistribution.map(status => 
                      status._id.charAt(0).toUpperCase() + status._id.slice(1)
                    ),
                    datasets: [
                      {
                        data: stats.statusDistribution.map(status => status.count),
                        backgroundColor: stats.statusDistribution.map(status => {
                          switch (status._id) {
                            case 'confirmed': return '#10b981'; // Green
                            case 'shipped': return '#3b82f6';   // Blue
                            case 'delivered': return '#8b5cf6'; // Purple
                            case 'cancelled': return '#ef4444'; // Red
                            default: return '#6b7280';         // Gray
                          }
                        }),
                        borderColor: stats.statusDistribution.map(status => {
                          switch (status._id) {
                            case 'confirmed': return '#10b981'; // Green
                            case 'shipped': return '#3b82f6';   // Blue
                            case 'delivered': return '#8b5cf6'; // Purple
                            case 'cancelled': return '#ef4444'; // Red
                            default: return '#6b7280';         // Gray
                          }
                        }),
                        borderWidth: 2,
                        hoverOffset: 8,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          padding: 20,
                          usePointStyle: true,
                          pointStyle: 'circle',
                          font: {
                            size: 12
                          },
                          color: '#374151'
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#6b7280',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                          label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} orders (${percentage}%)`;
                          }
                        }
                      }
                    },
                    cutout: '60%'
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No order data available</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
                  <p className="text-sm text-gray-600">Best selling items</p>
                </div>
              </div>
              <button
                onClick={() => handleViewMore('top-products')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <Eye size={14} />
                View More
              </button>
            </div>

            <div className="space-y-3">
              {stats?.topProducts?.slice(0, 4).map((product, index) => (
                <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-600">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {product.productName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.totalQuantity} sold
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 text-sm">
                      {formatCurrency(product.totalRevenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                  <p className="text-sm text-gray-600">Latest transactions</p>
                </div>
              </div>
              <button
                onClick={() => handleViewMore('recent-orders')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <Eye size={14} />
                View More
              </button>
            </div>

            <div className="space-y-3">
              {stats?.recentOrders?.slice(0, 4).map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {order.orderId}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.receivedBy} • {formatDate(order.orderDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 text-sm">
                      {formatCurrency(order.orderTotal)}
                    </div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Low Stock Alert */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
                  <p className="text-sm text-gray-600">Items running low</p>
                </div>
              </div>
              <button
                onClick={() => handleViewMore('low-stock')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <Eye size={14} />
                View More
              </button>
            </div>

            <div className="space-y-3">
              {stats?.lowStockProducts?.length > 0 ? (
                // Remove duplicates based on _id and filter by stock <= 10
                stats.lowStockProducts
                  .filter((product, index, self) => 
                    product.stock <= 10 && 
                    index === self.findIndex(p => p._id === product._id)
                  )
                  .slice(0, 4)
                  .map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.category}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Stock Control */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStockChange(product._id, product.stock, false)}
                          disabled={product.stock <= 0 || updatingStock.has(product._id)}
                          className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {updatingStock.has(product._id) ? (
                            <div className="w-2 h-2 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                        </button>
                        
                        <span className="min-w-[2rem] text-center text-sm font-medium text-gray-900">
                          {product.stock}
                        </span>
                        
                        <button
                          onClick={() => handleStockChange(product._id, product.stock, true)}
                          disabled={updatingStock.has(product._id)}
                          className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {updatingStock.has(product._id) ? (
                            <div className="w-2 h-2 border border-green-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      
                      <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        {product.stock} left
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <Package className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-500 text-sm">All products well stocked!</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
