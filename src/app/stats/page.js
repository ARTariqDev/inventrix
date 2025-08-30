"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  Calendar,
  Filter,
  ChevronDown,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import Layout from "../components/Layout";

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: "30",
    category: "all",
    status: "all"
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchStats = async () => {
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
  };

  useEffect(() => {
    fetchStats();
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Business Insights
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
              icon: DollarSign,
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

            <div className="h-64 flex items-end justify-between gap-2">
              {stats?.dailyRevenue?.slice(-14).map((day, index) => {
                const maxRevenue = Math.max(...(stats?.dailyRevenue?.map(d => d.revenue) || [1]));
                const height = (day.revenue / maxRevenue) * 100;
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg mb-2 transition-all hover:opacity-80"
                      style={{ height: `${height}%` }}
                      title={`${formatDate(day.date)}: ${formatCurrency(day.revenue)}`}
                    />
                    <span className="text-xs text-gray-500 transform -rotate-45 origin-left">
                      {formatDate(day.date)}
                    </span>
                  </div>
                );
              })}
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

            <div className="space-y-4">
              {stats?.statusDistribution?.map((status, index) => {
                const total = stats.statusDistribution.reduce((sum, s) => sum + s.count, 0);
                const percentage = total > 0 ? (status.count / total) * 100 : 0;
                
                return (
                  <div key={status._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className={`w-3 h-3 rounded-full`}
                        style={{ 
                          backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'][index % 3] 
                        }}
                      />
                      <span className="capitalize font-medium text-gray-700">
                        {status._id}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {status.count}
                      </div>
                      <div className="text-sm text-gray-500">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
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
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
                <p className="text-sm text-gray-600">Best selling items</p>
              </div>
            </div>

            <div className="space-y-3">
              {stats?.topProducts?.slice(0, 5).map((product, index) => (
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
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                <p className="text-sm text-gray-600">Latest transactions</p>
              </div>
            </div>

            <div className="space-y-3">
              {stats?.recentOrders?.map((order) => (
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
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
                <p className="text-sm text-gray-600">Items running low</p>
              </div>
            </div>

            <div className="space-y-3">
              {stats?.lowStockProducts?.length > 0 ? (
                stats.lowStockProducts.map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.category}
                      </div>
                    </div>
                    <div className="text-right">
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
