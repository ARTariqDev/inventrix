# Inventrix - Inventory Management System

A modern, full-stack inventory management system built with Next.js 15, React 19, and MongoDB. Features real-time analytics, order management, and responsive design with smooth animations .

## Features

- **Authentication System**: Secure login/signup with bcrypt password hashing
- **Product Management**: CRUD operations for inventory items with categories and stock tracking
- **Dynamic Category Colors**: Color picker system for assigning custom colors to product categories
- **Order Management**: Complete order lifecycle with status tracking
- **Analytics Dashboard**: Interactive charts and business insights
- **Responsive Design**: Mobile-first approach with hamburger navigation
- **Real-time Updates**: Live data synchronization across components
- **Modern UI**: Framer Motion animations and Tailwind CSS styling

## Tech Stack

- **Framework**: Next.js 15.1.0 with App Router & Turbopack
- **Frontend**: React 19.0.0, Framer Motion 12.23.12
- **Styling**: Tailwind CSS 3.4.1, Lucide React Icons
- **Backend**: Next.js API Routes, MongoDB with Mongoose 8.18.0
- **Authentication**: Custom implementation with bcryptjs
- **Charts**: Chart.js 4.5.0 with react-chartjs-2
- **PDF Generation**: jsPDF & html2canvas for invoices

## Project Structure

```
inventrix/
├── public/                         # Static assets
│   ├── file.svg                    # File icon
│   ├── globe.svg                   # Globe icon
│   ├── next.svg                    # Next.js logo
│   ├── package-logo.svg            # Custom package box logo
│   ├── vercel.svg                  # Vercel logo
│   └── window.svg                  # Window icon
│
├── scripts/                        # Database utilities
│   ├── add-sample-data.js          # Sample data generator
│   ├── check-order-dates.js        # Date validation utility
│   └── debug-database.js           # Database debugging tool
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # API Routes
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.js    # POST: User authentication
│   │   │   │   └── logout/
│   │   │   │       └── route.js    # POST: User logout
│   │   │   ├── orders/
│   │   │   │   └── route.js        # GET, POST, PUT, DELETE: Order CRUD
│   │   │   ├── products/
│   │   │   │   └── route.js        # GET, POST, PUT, DELETE: Product CRUD
│   │   │   ├── signup/
│   │   │   │   └── route.js        # POST: User registration
│   │   │   └── stats/
│   │   │       └── route.js        # GET: Analytics data
│   │   │
│   │   ├── components/             # Reusable React Components
│   │   │   ├── Button.js           # Custom button with animations
│   │   │   ├── Layout.js           # Main layout wrapper
│   │   │   ├── ProductCard.js      # Product display/edit card
│   │   │   └── SideBar.js          # Navigation sidebar
│   │   │
│   │   ├── pages/                  # Application Pages
│   │   │   ├── invoices/
│   │   │   │   └── page.js         # Invoice generation page
│   │   │   ├── login/
│   │   │   │   └── page.js         # User login page
│   │   │   ├── orders/
│   │   │   │   └── page.js         # Order management page
│   │   │   ├── products/
│   │   │   │   └── page.js         # Product management page
│   │   │   ├── signup/
│   │   │   │   └── page.js         # User registration page
│   │   │   └── stats/
│   │   │       └── page.js         # Analytics dashboard
│   │   │
│   │   ├── favicon.ico             # App favicon
│   │   ├── globals.css             # Global styles
│   │   ├── icon.svg                # App icon
│   │   ├── layout.js               # Root layout
│   │   └── page.js                 # Home page (dashboard)
│   │
│   └── models/
│       └── models.js               # MongoDB schemas (User, Product, Order)
│
├── .env                            # Environment variables
├── .gitignore                      # Git ignore rules
├── eslint.config.mjs               # ESLint configuration
├── jsconfig.json                   # JavaScript configuration
├── next.config.mjs                 # Next.js configuration
├── package.json                    # Dependencies and scripts
├── postcss.config.mjs              # PostCSS configuration
└── tailwind.config.mjs             # Tailwind CSS configuration
```

## Components Documentation

### Core Components

#### `Layout.js`
- **Purpose**: Main application layout wrapper
- **Features**: 
  - Responsive sidebar integration
  - Mobile header with hamburger menu
  - Authentication state management
  - Consistent spacing and margins

#### `SideBar.js`
- **Purpose**: Navigation sidebar component
- **Features**:
  - Desktop/mobile adaptive behavior
  - Framer Motion animations
  - Brand logo and navigation links
  - Logout functionality with confirmation

**Responsive Sidebar Implementation:**
```javascript
// src/app/components/SideBar.js
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SideBar({ isOpen, setIsOpen }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Animation variants for smooth transitions
  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const overlayVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-purple-600 to-pink-500 text-white z-50 lg:relative lg:translate-x-0"
        variants={sidebarVariants}
        initial={false}
        animate={isOpen ? "open" : "closed"}
      >
        <div className="p-6">
          {/* Logo Section */}
          <div className="flex items-center space-x-3 mb-8">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <svg width="32" height="32" viewBox="0 0 100 100" className="text-white">
                {/* Custom package logo SVG */}
              </svg>
            </motion.div>
            <h1 className="text-xl font-bold">Inventrix</h1>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {[
              { href: '/', label: 'Dashboard', icon: 'home' },
              { href: '/products', label: 'Products', icon: 'package' },
              { href: '/orders', label: 'Orders', icon: 'shopping-cart' },
              { href: '/stats', label: 'Analytics', icon: 'bar-chart' },
              { href: '/invoices', label: 'Invoices', icon: 'file-text' }
            ].map((item) => (
              <motion.div
                key={item.href}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={item.href}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <span>{item.label}</span>
                </Link>
              </motion.div>
            ))}
          </nav>
        </div>

        {/* Logout Section */}
        <div className="absolute bottom-6 left-6 right-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full bg-red-500 hover:bg-red-600 p-3 rounded-lg transition-colors"
          >
            Logout
          </motion.button>
        </div>
      </motion.div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-lg shadow-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold mb-4">Confirm Logout</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
              <div className="flex space-x-4">
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Yes, Logout
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

#### `Button.js`
- **Purpose**: Custom interactive button component
- **Features**:
  - Hover glow effects
  - Click ripple animations
  - Customizable colors and text
  - Active/disabled states

#### `ProductCard.js`
- **Purpose**: Product display and editing interface
- **Features**:
  - Inline editing capabilities
  - Status indicators (active/inactive, stock levels)
  - Category color coding
  - Smooth animations and transitions

**Inline Editing with Validation:**
```javascript
// src/app/components/ProductCard.js
'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ProductCard({ product, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(product);
  const [isLoading, setIsLoading] = useState(false);

  // Category color mapping
  const getCategoryColor = (category) => {
    const colors = {
      'Electronics': 'bg-blue-100 text-blue-800',
      'Clothing': 'bg-purple-100 text-purple-800',
      'Food': 'bg-green-100 text-green-800',
      'Books': 'bg-yellow-100 text-yellow-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.default;
  };

  // Stock level indicator
  const getStockStatus = (stock) => {
    if (stock === 0) return { color: 'text-red-600', label: 'Out of Stock' };
    if (stock <= 10) return { color: 'text-yellow-600', label: 'Low Stock' };
    return { color: 'text-green-600', label: 'In Stock' };
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product._id,
          ...editData
        })
      });

      if (response.ok) {
        const updatedProduct = await response.json();
        onUpdate(updatedProduct);
        setIsEditing(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update product');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData(product); // Reset to original data
    setIsEditing(false);
  };

  const stockStatus = getStockStatus(product.stock);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6 border"
      style={{
        willChange: 'transform',
        contain: 'layout style paint'
      }}
    >
      {/* Product Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="text-lg font-semibold bg-gray-50 border rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          ) : (
            <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
          )}
          
          <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={isLoading}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
              >
                Cancel
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                Edit
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(product._id)}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
              >
                Delete
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="space-y-3">
        {/* Category */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Category:</span>
          {isEditing ? (
            <select
              value={editData.category}
              onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              className="bg-gray-50 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Food">Food</option>
              <option value="Books">Books</option>
            </select>
          ) : (
            <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(product.category)}`}>
              {product.category}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Price:</span>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              min="0"
              value={editData.price}
              onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
              className="bg-gray-50 border rounded px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          ) : (
            <span className="font-semibold text-green-600">${product.price}</span>
          )}
        </div>

        {/* Stock */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Stock:</span>
          {isEditing ? (
            <input
              type="number"
              min="0"
              value={editData.stock}
              onChange={(e) => setEditData({ ...editData, stock: parseInt(e.target.value) })}
              className="bg-gray-50 border rounded px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          ) : (
            <div className="flex items-center space-x-2">
              <span className="font-semibold">{product.stock}</span>
              <span className={`text-xs ${stockStatus.color}`}>
                {stockStatus.label}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {isEditing ? (
          <div>
            <label className="text-sm text-gray-600">Description:</label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              rows="3"
              className="w-full bg-gray-50 border rounded px-2 py-1 text-sm mt-1 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Product description..."
            />
          </div>
        ) : (
          product.description && (
            <div>
              <span className="text-sm text-gray-600">Description:</span>
              <p className="text-sm text-gray-800 mt-1">{product.description}</p>
            </div>
          )
        )}

        {/* Status Indicator */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            product.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {product.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
```

## Pages Documentation

### Authentication Pages

#### `/login` - User Login
- **File**: `src/app/login/page.js`
- **Features**:
  - Email/password authentication
  - Form validation
  - Remember me functionality
  - Redirect to dashboard on success

#### `/signup` - User Registration
- **File**: `src/app/signup/page.js`
- **Features**:
  - Full name, email, password fields
  - Password confirmation
  - Email validation
  - Auto-redirect to login

### Main Application Pages

#### `/` - Dashboard (Home)
- **File**: `src/app/page.js`
- **Features**:
  - Welcome message with user name
  - Quick stats overview
  - Navigation cards to main features
  - Responsive grid layout

#### `/products` - Product Management
- **File**: `src/app/products/page.js`
- **Features**:
  - Product grid with search and filters
  - Add/edit/delete products
  - Category management
  - Stock level indicators
  - Real-time validation

#### `/orders` - Order Management
- **File**: `src/app/orders/page.js`
- **Features**:
  - Order cards with status tracking
  - Create/edit/delete orders
  - Product selection with stock validation
  - Customer information fields
  - Order total calculations

#### `/stats` - Analytics Dashboard
- **File**: `src/app/stats/page.js`
- **Features**:
  - Interactive Chart.js visualizations
  - Daily revenue line charts
  - Order status pie charts
  - Top products, recent orders, low stock alerts
  - "View More" expandable sections
  - Time period filters

**Chart.js Integration Example:**
```javascript
// src/app/stats/page.js
'use client';
import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { motion } from 'framer-motion';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function StatsPage() {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStatsData(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Revenue chart configuration
  const revenueChartData = {
    labels: statsData?.dailyRevenue?.map(item => {
      const date = new Date(item._id);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: 'Daily Revenue',
        data: statsData?.dailyRevenue?.map(item => item.revenue) || [],
        borderColor: 'rgb(147, 51, 234)', // Purple
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(147, 51, 234)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Revenue Trends (Last 30 Days)',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgb(147, 51, 234)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `Revenue: $${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6b7280'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)'
        },
        ticks: {
          color: '#6b7280',
          callback: function(value) {
            return '$' + value.toFixed(0);
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  // Order status pie chart configuration
  const orderStatusData = {
    labels: statsData?.orderStatusStats?.map(item => 
      item._id.charAt(0).toUpperCase() + item._id.slice(1)
    ) || [],
    datasets: [
      {
        data: statsData?.orderStatusStats?.map(item => item.count) || [],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // Green for confirmed
          'rgba(59, 130, 246, 0.8)',  // Blue for shipped
          'rgba(147, 51, 234, 0.8)',  // Purple for delivered
          'rgba(239, 68, 68, 0.8)'    // Red for cancelled
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(147, 51, 234)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const meta = chart.getDatasetMeta(0);
                const style = meta.controller.getStyle(i);
                return {
                  text: `${label} (${data.datasets[0].data[i]})`,
                  fillStyle: style.backgroundColor,
                  strokeStyle: style.borderColor,
                  lineWidth: style.borderWidth,
                  pointStyle: 'circle',
                  hidden: isNaN(data.datasets[0].data[i]) || meta.data[i].hidden,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      title: {
        display: true,
        text: 'Order Status Distribution',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed * 100) / total).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <div className="h-80">
          <Line data={revenueChartData} options={revenueChartOptions} />
        </div>
      </motion.div>

      {/* Order Status Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <div className="h-80">
          <Pie data={orderStatusData} options={pieChartOptions} />
        </div>
      </motion.div>

      {/* Expandable Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Top Products</h2>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleSection('topProducts')}
              className="text-purple-600 hover:text-purple-800"
            >
              {expandedSections.topProducts ? 'View Less' : 'View More'}
            </motion.button>
          </div>
          
          <div className="space-y-3">
            {statsData?.topProducts?.slice(0, expandedSections.topProducts ? undefined : 3).map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium">{product.productName}</p>
                  <p className="text-sm text-gray-600">Sold: {product.totalQuantity} units</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    ${product.totalRevenue.toFixed(2)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Low Stock Alerts</h2>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleSection('lowStock')}
              className="text-purple-600 hover:text-purple-800"
            >
              {expandedSections.lowStock ? 'View Less' : 'View More'}
            </motion.button>
          </div>
          
          <div className="space-y-3">
            {statsData?.lowStockProducts?.slice(0, expandedSections.lowStock ? undefined : 3).map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex justify-between items-center p-3 bg-red-50 rounded border-l-4 border-red-400"
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-600">
                    {product.stock} left
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.stock === 0 ? 'Out of stock' : 'Low stock'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
```

#### `/invoices` - Invoice Generation
- **File**: `src/app/invoices/page.js`
- **Features**:
  - PDF invoice generation
  - Order selection interface
  - Professional invoice formatting
  - Download functionality

## API Routes Documentation

### Authentication Routes

#### `POST /api/auth/login`
- **Purpose**: User authentication
- **Body**: `{ email, password }`
- **Response**: User data and authentication cookie
- **Features**: Password validation, session management

**Implementation Example:**
```javascript
// src/app/api/auth/login/route.js
import bcrypt from 'bcryptjs';
import { User } from '../../../models/models.js';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Set HTTP-only cookie for authentication
    cookies().set('userId', user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    return Response.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
```

#### `POST /api/auth/logout`
- **Purpose**: User session termination
- **Response**: Success confirmation
- **Features**: Cookie cleanup, secure logout

#### `POST /api/signup`
- **Purpose**: New user registration
- **Body**: `{ fullName, email, password }`
- **Response**: Success confirmation
- **Features**: Email uniqueness validation, password hashing

**Implementation Example:**
```javascript
// src/app/api/signup/route.js
import bcrypt from 'bcryptjs';
import { User } from '../../models/models.js';

export async function POST(request) {
  try {
    const { fullName, email, password } = await request.json();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return Response.json({ error: 'User already exists' }, { status:400 });
    }
    
    // Hash password with salt rounds
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create new user
    const user = new User({
      fullName,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    return Response.json({ message: 'User created successfully' });
  } catch (error) {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
```

### Data Management Routes

#### `GET/POST/PUT/DELETE /api/products`
- **Purpose**: Product CRUD operations
- **GET**: Retrieve products with filtering/pagination
- **POST**: Create new product
- **PUT**: Update existing product
- **DELETE**: Soft delete product (set isActive: false)
- **Features**: User ownership validation, stock management

**Stock Management Example:**
```javascript
// src/app/api/products/route.js - POST method
export async function POST(request) {
  try {
    const userId = cookies().get('userId')?.value;
    const userData = await User.findById(userId);
    
    const { name, description, category, price, stock } = await request.json();
    
    // Auto-generate SKU
    const timestamp = Date.now().toString();
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const sku = `${category.substring(0, 3).toUpperCase()}-${timestamp}-${randomSuffix}`;
    
    const product = new Product({
      sku,
      name,
      description,
      category,
      price: parseFloat(price),
      stock: parseInt(stock),
      userId,
      userName: userData.fullName
    });
    
    await product.save();
    return Response.json(product);
  } catch (error) {
    return Response.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
```

#### `GET/POST/PUT/DELETE /api/orders`
- **Purpose**: Order CRUD operations
- **GET**: Retrieve user orders
- **POST**: Create new order with stock validation
- **PUT**: Update order with stock adjustment
- **DELETE**: Soft delete order with stock restoration
- **Features**: Product validation, stock management, auto-calculations

**Order Creation with Stock Validation:**
```javascript
// src/app/api/orders/route.js - POST method
export async function POST(request) {
  try {
    const userId = cookies().get('userId')?.value;
    const userData = await User.findById(userId);
    
    const { orderItems, receivedBy, address, phoneNumber } = await request.json();
    
    // Validate stock availability for all items
    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return Response.json({ error: `Product ${item.productName} not found` }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return Response.json({ 
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        }, { status: 400 });
      }
    }
    
    // Calculate totals and create order items
    const processedItems = orderItems.map(item => ({
      ...item,
      itemTotal: item.productPrice * item.quantity
    }));
    
    const orderTotal = processedItems.reduce((sum, item) => sum + item.itemTotal, 0);
    
    // Generate order ID
    const year = new Date().getFullYear();
    const orderCount = await Order.countDocuments() + 1;
    const orderId = `ORD-${year}-${orderCount.toString().padStart(4, '0')}`;
    
    // Create order
    const order = new Order({
      orderId,
      orderItems: processedItems,
      orderTotal,
      orderDate: new Date(),
      orderTime: new Date().toLocaleTimeString(),
      receivedBy,
      address,
      phoneNumber,
      userId,
      userName: userData.fullName
    });
    
    await order.save();
    
    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }
    
    return Response.json(order);
  } catch (error) {
    return Response.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
```

#### `GET /api/stats`
- **Purpose**: Analytics data aggregation
- **Response**: Dashboard statistics
- **Features**: 
  - Daily revenue trends
  - Order status distribution
  - Top-selling products
  - Low stock alerts
  - MongoDB aggregation pipelines

**Analytics Aggregation Example:**
```javascript
// src/app/api/stats/route.js
export async function GET() {
  try {
    const userId = cookies().get('userId')?.value;
    
    // Daily revenue aggregation
    const dailyRevenue = await Order.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
          revenue: { $sum: "$orderTotal" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);
    
    // Order status distribution
    const orderStatusStats = await Order.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Top selling products
    const topProducts = await Order.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.productId",
          productName: { $first: "$orderItems.productName" },
          totalQuantity: { $sum: "$orderItems.quantity" },
          totalRevenue: { $sum: "$orderItems.itemTotal" }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);
    
    // Low stock alerts
    const lowStockProducts = await Product.find({
      userId,
      isActive: true,
      stock: { $lte: 10 }
    }).sort({ stock: 1 }).limit(5);
    
    return Response.json({
      dailyRevenue,
      orderStatusStats,
      topProducts,
      lowStockProducts
    });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
```

## Database Models

### User Model
```javascript
{
  fullName: String (required, max 100)
  email: String (required, unique, validated)
  password: String (required, min 6, hashed)
  role: String (enum: admin/user, default: user)
  isActive: Boolean (default: true)
  timestamps: createdAt, updatedAt
}
```

**Mongoose Schema Implementation:**
```javascript
// src/models/models.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    maxLength: [100, 'Full name cannot exceed 100 characters'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Pre-save middleware for password hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
```

### Product Model
```javascript
{
  sku: String (unique, auto-generated)
  name: String (required, max 200)
  description: String (max 1000)
  category: String (required, max 50)
  price: Number (required, min 0, 2 decimals)
  stock: Integer (required, min 0)
  userId: ObjectId (ref: User)
  userName: String (denormalized)
  isActive: Boolean (default: true)
  timestamps: createdAt, updatedAt
}
```

**Auto-SKU Generation & Validation:**
```javascript
const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    maxLength: [200, 'Product name cannot exceed 200 characters'],
    trim: true
  },
  description: {
    type: String,
    maxLength: [1000, 'Description cannot exceed 1000 characters'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    maxLength: [50, 'Category cannot exceed 50 characters'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    set: v => Math.round(v * 100) / 100 // Round to 2 decimal places
  },
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: [0, 'Stock cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: 'Stock must be a whole number'
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true // Denormalized for performance
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Auto-generate SKU before saving
productSchema.pre('save', function(next) {
  if (!this.sku) {
    const timestamp = Date.now().toString();
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    this.sku = `${this.category.substring(0, 3).toUpperCase()}-${timestamp}-${randomSuffix}`;
  }
  next();
});

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
```

### Order Model
```javascript
{
  orderId: String (auto-generated, format: ORD-YYYY-NNNN)
  orderItems: [
    {
      productId: ObjectId (ref: Product)
      productName: String (denormalized)
      productPrice: Number (denormalized)
      quantity: Integer
      itemTotal: Number (calculated)
    }
  ]
  orderTotal: Number (calculated)
  orderDate: Date (auto-generated)
  orderTime: String (HH:MM:SS)
  receivedBy: String (required)
  address: String (required)
  phoneNumber: String (required)
  orderStatus: String (enum: confirmed/shipped/delivered/cancelled)
  userId: ObjectId (ref: User)
  userName: String (denormalized)
  isActive: Boolean (default: true)
  timestamps: createdAt, updatedAt
}
```

**Order Calculations & Validations:**
```javascript
const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  orderItems: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true // Denormalized for performance
    },
    productPrice: {
      type: Number,
      required: true, // Denormalized to preserve price at time of order
      min: [0, 'Product price cannot be negative']
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be a whole number'
      }
    },
    itemTotal: {
      type: Number,
      required: true
    }
  }],
  orderTotal: {
    type: Number,
    required: true,
    min: [0, 'Order total cannot be negative']
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  orderTime: {
    type: String,
    default: () => new Date().toLocaleTimeString()
  },
  receivedBy: {
    type: String,
    required: [true, 'Receiver name is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[\d\s-()]+$/, 'Invalid phone number format']
  },
  orderStatus: {
    type: String,
    enum: ['confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'confirmed'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Auto-generate order ID and calculate totals before saving
orderSchema.pre('save', async function(next) {
  try {
    if (!this.orderId) {
      const year = new Date().getFullYear();
      const orderCount = await mongoose.model('Order').countDocuments() + 1;
      this.orderId = `ORD-${year}-${orderCount.toString().padStart(4, '0')}`;
    }
    
    // Calculate item totals and order total
    this.orderItems.forEach(item => {
      item.itemTotal = item.productPrice * item.quantity;
    });
    
    this.orderTotal = this.orderItems.reduce((sum, item) => sum + item.itemTotal, 0);
    
    next();
  } catch (error) {
    next(error);
  }
});

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
```

## Styling & Design

### Design System
- **Color Palette**: Purple gradient theme (#8b5cf6 to #ec4899)
- **Typography**: System fonts with responsive sizing
- **Spacing**: 8px grid system
- **Border Radius**: Consistent 8px-16px rounded corners
- **Shadows**: Layered elevation system

### Animation System
- **Library**: Framer Motion 12.23.12
- **Transitions**: 0.2-0.3s duration with easeOut timing
- **Effects**: Fade-ins, hover transforms, layout animations
- **Performance**: Optimized with `will-change` and `contain` CSS properties

### Responsive Design
- **Breakpoints**: Mobile-first approach
  - `sm`: 640px
  - `md`: 768px  
  - `lg`: 1024px
  - `xl`: 1280px
- **Navigation**: Hamburger menu on mobile, sidebar on desktop
- **Grid Systems**: CSS Grid and Flexbox for layouts


## Features Walkthrough

### Dashboard
- Overview of business metrics
- Quick navigation to main features
- Responsive card layout

### Product Management
- Advanced filtering and search
- Inline editing with real-time validation
- Category-based organization with color coding
- Stock level tracking
- Dynamic category color assignment with localStorage persistence

#### Color Picker System
The product management interface includes a sophisticated color picker that allows users to assign custom colors to product categories:

**Features:**
- 12 predefined color options (Blue, Purple, Green, Red, Yellow, Pink, Indigo, Teal, Orange, Cyan, Lime, Rose)
- Interactive modal with color grid and hover effects
- Real-time color preview
- localStorage persistence across browser sessions
- Dynamic category color application throughout the interface

**Implementation:**
```javascript
// Color options with corresponding Tailwind CSS classes
const colorOptions = [
  { name: 'Blue', bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', value: 'blue' },
  { name: 'Purple', bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', value: 'purple' },
  // ... additional colors
];

// localStorage integration for persistence
const saveCategoryColors = (colors) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('categoryColors', JSON.stringify(colors));
  }
};

const loadCategoryColors = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('categoryColors');
    return saved ? JSON.parse(saved) : {};
  }
  return {};
};
```

**Usage:**
1. Click the color swatch next to any category in the product form
2. Select from 12 available colors in the interactive modal
3. Colors are automatically saved and applied across the interface
4. Category colors persist between browser sessions

### Order Processing
- Comprehensive order creation
- Customer information management
- Real-time stock validation
- Status tracking workflow

### Analytics
- Interactive charts and graphs
- Expandable detail views
- Time-based filtering
- Export capabilities

### Mobile Experience
- Hamburger navigation menu
- Touch-optimized interactions
- Responsive data tables
- Optimized performance

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **Authentication**: HTTP-only cookies with 30-day expiration
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Mongoose ODM protection
- **XSS Protection**: React's built-in escaping
- **CSRF Protection**: SameSite cookie configuration

## Performance Optimizations

- **Next.js 15**: App Router with Turbopack for fast builds
- **React 19**: Latest performance improvements
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js built-in optimization
- **CSS Optimization**: Tailwind CSS purging
- **Animation Performance**: CSS containment and will-change

## Dependencies

### Core Dependencies
- **next**: 15.1.0 - React framework
- **react**: 19.0.0 - UI library
- **mongoose**: 8.18.0 - MongoDB ODM
- **framer-motion**: 12.23.12 - Animation library
- **chart.js**: 4.5.0 - Charting library
- **tailwindcss**: 3.4.1 - CSS framework

### Authentication & Security
- **bcryptjs**: 3.0.2 - Password hashing
- **dotenv**: 17.2.1 - Environment variables

### UI & Icons
- **lucide-react**: 0.541.0 - Icon library
- **react-chartjs-2**: 5.3.0 - Chart.js React wrapper

### PDF Generation
- **jspdf**: 3.0.2 - PDF generation
- **html2canvas**: 1.4.1 - HTML to canvas conversion

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Configuration Examples

### Environment Setup
```env
# Database
MONGODB_URI=your-mongodb-connection-string

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Database Connection
```javascript
// src/lib/mongodb.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('Connected to MongoDB');
        return mongoose;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
```

### Development Scripts
```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint

# Database utilities
node scripts/add-sample-data.js    # Add sample data to database
node scripts/debug-database.js     # Debug database connections
node scripts/check-order-dates.js  # Validate order date formats
```




