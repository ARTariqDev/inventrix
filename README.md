# TwinStar - Inventory Management System

A modern, full-stack inventory management system built with Next.js 15, React 19, and MongoDB. Features real-time analytics, order management, customer tracking, profit calculations, and responsive design with smooth animations.

## Features

- **Authentication System**: Secure login/signup with bcrypt password hashing and HTTP-only cookies
- **Product Management**: CRUD operations for inventory items with categories, purchase/sale price tracking, and auto-generated SKUs
- **Customer Management**: Track customers with order history, spending analytics, and contact information
- **Order Management**: Complete order lifecycle with status tracking, credit orders, discount support, and remaining balance tracking
- **Profit Analytics**: Real-time profit calculations based on purchase vs sale prices with detailed breakdowns
- **Stock History**: Automatic tracking of stock additions and changes for spending calculations
- **Monthly Reports**: PDF report generation with detailed product and order summaries
- **Analytics Dashboard**: Interactive Chart.js visualizations with revenue trends and business insights
- **Responsive Design**: Mobile-first approach with collapsible sidebar navigation
- **Modern UI**: Framer Motion animations and Tailwind CSS styling with gradient themes

## Tech Stack

- **Framework**: Next.js 15.1.11 with App Router & Turbopack
- **Frontend**: React 19.0.0, Framer Motion 12.23.12
- **Styling**: Tailwind CSS 3.4.1, Lucide React Icons
- **Backend**: Next.js API Routes, MongoDB with Mongoose 8.18.0
- **Authentication**: Custom implementation with bcryptjs and HTTP-only cookies
- **Charts**: Chart.js 4.5.0 with react-chartjs-2
- **PDF Generation**: jsPDF 3.0.3 & jsPDF-autotable 5.0.2 for reports and invoices

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
│   ├── backfill-stock-history.js   # Stock history migration tool
│   ├── check-order-dates.js        # Date validation utility
│   ├── check-test-data.js          # Test data verification
│   ├── create-snapshot.js          # Monthly snapshot generator
│   ├── debug-database.js           # Database debugging tool
│   ├── find-product-and-order.js   # Search utility
│   ├── find-user.js                # User lookup tool
│   ├── fix-product-schema.js       # Schema migration script
│   ├── fix-user-password.js        # Password reset utility
│   ├── inject-test-profit-data.js  # Test data with profit info
│   ├── list-all-users.js           # User listing utility
│   ├── migrate-products.js         # Product migration script
│   └── set-password.js             # Password management tool
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
│   │   │   ├── persons/
│   │   │   │   └── route.js        # GET: Customer data and analytics
│   │   │   ├── products/
│   │   │   │   └── route.js        # GET, POST, PUT, DELETE: Product CRUD
│   │   │   ├── report/
│   │   │   │   └── route.js        # GET: Monthly report data for PDF
│   │   │   ├── signup/
│   │   │   │   └── route.js        # POST: User registration
│   │   │   └── stats/
│   │   │       └── route.js        # GET: Analytics data
│   │   │
│   │   ├── components/             # Reusable React Components
│   │   │   ├── Button.js           # Custom button with animations
│   │   │   ├── Layout.js           # Main layout wrapper
│   │   │   ├── ProductCard.js      # Product display/edit card
│   │   │   ├── ReportDropdown.js   # Month/year selector for reports
│   │   │   ├── ReportPDF.js        # PDF generation logic
│   │   │   └── SideBar.js          # Navigation sidebar
│   │   │
│   │   ├── hooks/
│   │   │   └── useAuth.js          # Authentication hook
│   │   │
│   │   ├── pages/                  # Application Pages
│   │   │   ├── invoices/
│   │   │   │   └── page.js         # Invoice generation page
│   │   │   ├── login/
│   │   │   │   └── page.js         # User login page
│   │   │   ├── orders/
│   │   │   │   └── page.js         # Order management page
│   │   │   ├── persons/
│   │   │   │   └── page.js         # Customer management page
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
│       └── models.js               # MongoDB schemas (User, Product, Order, StockHistory, MonthlySnapshot, Counter)
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
  - Mobile header with toggle button
  - Authentication state management
  - Consistent spacing and layout structure

#### `SideBar.js`
- **Purpose**: Navigation sidebar component with report generation
- **Features**:
  - Desktop/mobile adaptive behavior (collapsible on desktop, overlay on mobile)
  - Framer Motion animations for smooth transitions
  - Navigation links to all main pages (Dashboard, Products, Orders, Analytics, Invoices, Persons)
  - PDF report download with month/year selection
  - Logout functionality with confirmation modal
  - Auto-expanding/collapsing based on screen size

**Responsive Sidebar Implementation:**
```javascript
// src/app/components/SideBar.js
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReportDropdown from './ReportDropdown';

export default function Sidebar({ onExpandChange, isExpanded: parentExpanded, onToggle }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(parentExpanded ?? false);
  const router = useRouter();

  // Detect mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Toggle sidebar
  const toggleSidebar = () => {
    if (isMobile && onToggle) {
      onToggle(); // Mobile uses parent control
    } else {
      setIsExpanded(!isExpanded); // Desktop handles locally
    }
  };

  const handleLogout = async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    if (response.ok) router.push('/login');
  };

  const handleDownloadReport = async (month, year) => {
    const response = await fetch(`/api/report?month=${month}&year=${year}`);
    const data = await response.json();
    if (data.success) {
      await generateReportPDF({ 
        month: data.month, 
        products: data.products, 
        orders: data.orders, 
        totals: data.totals 
      });
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 240 : 64 }}
      className="bg-gradient-to-b from-purple-600 to-pink-500 text-white flex flex-col"
    >
      {/* Brand Section */}
      <div className="p-4">
        <motion.h1 
          animate={{ opacity: isExpanded ? 1 : 0 }}
          className="text-xl font-bold"
        >
          TwinStar
        </motion.h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2 p-2">
        <NavLink href="/" icon={BarChart3} label="Dashboard" expanded={isExpanded} />
        <NavLink href="/products" icon={Package} label="Products" expanded={isExpanded} />
        <NavLink href="/orders" icon={ShoppingCart} label="Orders" expanded={isExpanded} />
        <NavLink href="/stats" icon={BarChart3} label="Analytics" expanded={isExpanded} />
        <NavLink href="/invoices" icon={FileText} label="Invoices" expanded={isExpanded} />
        <NavLink href="/persons" icon={Users} label="Persons" expanded={isExpanded} />
        
        {/* Report Dropdown */}
        {isExpanded && <ReportDropdown onDownload={handleDownloadReport} />}
      </nav>

      {/* Logout Button */}
      <div className="p-4">
        <motion.button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 p-3 rounded-lg transition-colors"
        >
          {isExpanded ? 'Logout' : <LogOut />}
        </motion.button>
      </div>
    </motion.aside>
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
  - Purchase and sale price fields
  - Category organization
  - Real-time validation
  - Smooth animations and transitions

#### `ReportDropdown.js`
- **Purpose**: Month and year selector for PDF reports
- **Features**:
  - Dropdown interface with month/year selection
  - Animated open/close transitions
  - Dynamic year range (2020 to current year)
  - Loading states during report generation

#### `ReportPDF.js`
- **Purpose**: PDF report generation logic
- **Features**:
  - Multi-page PDF creation with jsPDF
  - Detailed product tables with purchase/sale prices and stock
  - Order summaries with profit calculations
  - Status-based order grouping
  - Professional formatting with headers and footers
  - Automatic page breaks and layout management

**Inline Editing with Purchase/Sale Prices:**
```javascript
// src/app/components/ProductCard.js
'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ProductCard({ product, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(product);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate profit margin
  const getProfitMargin = (salePrice, purchasePrice) => {
    if (!purchasePrice || purchasePrice === 0) return 0;
    return (((salePrice - purchasePrice) / purchasePrice) * 100).toFixed(1);
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

  const stockStatus = getStockStatus(product.stock);
  const profitMargin = getProfitMargin(product.salePrice, product.purchasePrice);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6 border"
    >
      {/* Product Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="text-lg font-semibold bg-gray-50 border rounded px-2 py-1 w-full"
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
              <button onClick={handleSave} disabled={isLoading}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm">
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white px-3 py-1 rounded text-sm">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
                Edit
              </button>
              <button onClick={() => onDelete(product._id)}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm">
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="space-y-3">
        {/* Purchase Price */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Purchase Price:</span>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              min="0"
              value={editData.purchasePrice}
              onChange={(e) => setEditData({ ...editData, purchasePrice: parseFloat(e.target.value) })}
              className="bg-gray-50 border rounded px-2 py-1 text-sm w-20"
            />
          ) : (
            <span className="font-semibold text-gray-700">${product.purchasePrice?.toFixed(2)}</span>
          )}
        </div>

        {/* Sale Price */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Sale Price:</span>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              min="0"
              value={editData.salePrice}
              onChange={(e) => setEditData({ ...editData, salePrice: parseFloat(e.target.value) })}
              className="bg-gray-50 border rounded px-2 py-1 text-sm w-20"
            />
          ) : (
            <span className="font-semibold text-green-600">${product.salePrice?.toFixed(2)}</span>
          )}
        </div>

        {/* Profit Margin */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Profit Margin:</span>
          <span className={`font-semibold ${profitMargin > 0 ? 'text-green-600' : 'text-gray-500'}`}>
            {profitMargin}%
          </span>
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
              className="bg-gray-50 border rounded px-2 py-1 text-sm w-20"
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

        {/* Category */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Category:</span>
          {isEditing ? (
            <input
              type="text"
              value={editData.category}
              onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              className="bg-gray-50 border rounded px-2 py-1 text-sm"
            />
          ) : (
            <span className="text-sm font-medium text-gray-800">{product.category}</span>
          )}
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
  - Welcome landing page with TwinStar branding
  - Large animated logo with gradient background
  - Call-to-action buttons for login and signup
  - Responsive design with smooth animations

#### `/products` - Product Management
- **File**: `src/app/products/page.js`
- **Features**:
  - Product grid with search and category filters
  - Add/edit/delete products with inline editing
  - Purchase price and sale price tracking
  - Profit margin calculations
  - Stock level indicators and low stock alerts
  - Auto-generated SKU system (PROD00001 format)
  - Real-time validation

#### `/orders` - Order Management
- **File**: `src/app/orders/page.js`
- **Features**:
  - Order cards with detailed information
  - Create/edit/delete orders
  - Product selection with stock validation
  - Multiple order statuses (confirmed, shipped, delivered, cancelled, credit)
  - Credit order support with remaining balance tracking
  - Discount support with automatic total calculations
  - Customer information fields (name, address, phone)
  - Order total and profit calculations

#### `/persons` - Customer Management
- **File**: `src/app/persons/page.js`
- **Features**:
  - Customer list with search functionality
  - Spending analytics per customer
  - Order history view with detailed modal
  - Credit balance tracking
  - Total orders and revenue per customer
  - Contact information display
  - Responsive cards with customer insights

#### `/stats` - Analytics Dashboard
- **File**: `src/app/stats/page.js`
- **Features**:
  - Interactive Chart.js visualizations
  - Daily revenue and profit line charts
  - Order status distribution pie charts
  - Top-selling products with profit data
  - Recent orders list
  - Low stock alerts
  - "View More" expandable sections
  - Real-time calculations

#### `/invoices` - Invoice Generation
- **File**: `src/app/invoices/page.js`
- **Features**:
  - PDF invoice generation
  - Order selection interface
  - Professional invoice formatting
  - Download functionality
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
- **Response**: User data and HTTP-only authentication cookie
- **Features**: bcrypt password verification, secure session management

#### `POST /api/auth/logout`
- **Purpose**: User session termination
- **Response**: Success confirmation
- **Features**: Cookie cleanup, secure logout

#### `POST /api/signup`
- **Purpose**: New user registration
- **Body**: `{ fullName, email, password }`
- **Response**: Success confirmation
- **Features**: Email uniqueness validation, password hashing with bcrypt

### Data Management Routes

#### `GET/POST/PUT/DELETE /api/products`
- **Purpose**: Product CRUD operations
- **GET**: Retrieve products with filtering and pagination
- **POST**: Create new product with auto-generated SKU
- **PUT**: Update existing product and track stock changes in StockHistory
- **DELETE**: Soft delete product (set isActive: false)
- **Features**: 
  - Auto-generated SKU format: PROD00001, PROD00002, etc.
  - Purchase price and sale price tracking
  - Stock history logging for spending calculations
  - User ownership validation
  - Stock management with validation

#### `GET/POST/PUT/DELETE /api/orders`
- **Purpose**: Order CRUD operations
- **GET**: Retrieve user orders with filtering options
- **POST**: Create new order with stock validation and automatic calculations
- **PUT**: Update order with stock adjustments
- **DELETE**: Soft delete order with stock restoration
- **Features**:
  - Auto-generated order ID format: ORD00001, ORD00002, etc.
  - Product validation and stock checks
  - Automatic subtotal and order total calculations
  - Discount support with automatic price adjustments
  - Credit order support with remaining balance tracking
  - Order statuses: confirmed, shipped, delivered, cancelled, credit
  - Profit calculations based on purchase vs sale prices

#### `GET /api/persons`
- **Purpose**: Customer analytics and management
- **GET**: Retrieve customer list with order history and spending data
- **Query Params**: `search` for filtering by customer name
- **Response**: Customer data with aggregated statistics
- **Features**:
  - Total orders per customer
  - Total spending per customer
  - Credit balance tracking
  - Order history with detailed information

#### `GET /api/report`
- **Purpose**: Monthly report data for PDF generation
- **Query Params**: `month` (01-12), `year` (e.g., 2024)
- **Response**: Comprehensive monthly data including products and orders
- **Features**:
  - Product list with current stock and prices
  - Orders filtered by month/year
  - Totals for sales, profit, and remaining balances
  - Ready for PDF generation via ReportPDF.js

#### `GET /api/stats`
- **Purpose**: Analytics data aggregation for dashboard
- **Response**: Comprehensive statistics and insights
- **Features**: 
  - Daily revenue and profit trends (last 30 days)
  - Order status distribution
  - Top-selling products with profit data
  - Low stock alerts (stock <= 10)
  - Monthly statistics snapshots
  - MongoDB aggregation pipelines for efficient calculations
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
  fullName: String (required, max 100, trimmed)
  email: String (required, unique, lowercase, validated)
  password: String (required, min 6, bcrypt hashed, select: false)
  role: String (enum: admin/user, default: user)
  isActive: Boolean (default: true)
  timestamps: createdAt, updatedAt
}
```

**Features:**
- Email validation with regex pattern
- Automatic password hashing on save with bcrypt (10 salt rounds)
- Password comparison method for authentication
- Indexed on email and fullName for fast lookups

### Product Model
```javascript
{
  sku: String (unique, uppercase, auto-generated: PROD00001)
  name: String (required, max 200, trimmed)
  description: String (max 1000, trimmed)
  category: String (required, max 50, trimmed)
  purchasePrice: Number (required, min 0, 2 decimals)
  salePrice: Number (required, min 0, 2 decimals)
  stock: Integer (required, min 0, whole number)
  userId: ObjectId (ref: User, required)
  userName: String (required, denormalized)
  isActive: Boolean (default: true)
  timestamps: createdAt, updatedAt
}
```

**Features:**
- Auto-generated SKU using Counter collection for sequential IDs
- Purchase and sale price tracking for profit calculations
- Stock validation (must be whole number, non-negative)
- Automatic userName denormalization on save
- Indexed on sku, category, name, isActive, userId
- Pre-save hook handles SKU generation and user lookup

### Order Model
```javascript
{
  orderId: String (unique, uppercase, auto-generated: ORD00001)
  orderItems: [{
    productId: ObjectId (ref: Product, required)
    productName: String (required, denormalized)
    productPrice: Number (required, min 0, sale price at time of order)
    purchasePrice: Number (default: 0, min 0, for profit calculation)
    quantity: Integer (required, min 1, whole number)
    itemTotal: Number (required, calculated: productPrice * quantity)
  }]
  subtotal: Number (min 0, 2 decimals, sum of all itemTotal)
  discountAmount: Number (default: 0, min 0, 2 decimals)
  orderTotal: Number (required, min 0, 2 decimals, subtotal - discountAmount)
  orderDate: Date (default: Date.now)
  orderTime: String (required, HH:MM:SS format)
  receivedBy: String (required, max 100, customer name)
  address: String (required, max 500)
  phoneNumber: String (required, max 20, validated format)
  orderStatus: String (enum: confirmed/shipped/delivered/cancelled/credit, default: confirmed)
  creditAmount: Number (default: 0, min 0, amount paid for credit orders)
  remainingAmount: Number (default: 0, min 0, balance due for credit orders)
  userId: ObjectId (ref: User, required)
  userName: String (required, denormalized)
  isActive: Boolean (default: true)
  timestamps: createdAt, updatedAt
}
```

**Features:**
- Auto-generated order ID using Counter collection
- Automatic calculation of item totals, subtotal, and order total
- Discount support with automatic total adjustments
- Credit order system with partial payment tracking
- Pre-save hooks calculate all totals and handle credit amounts
- Denormalized product data preserves pricing at time of order
- Indexed on orderId, userId, orderStatus, orderDate, isActive
- Phone number format validation

### StockHistory Model
```javascript
{
  productId: ObjectId (ref: Product, required)
  userId: ObjectId (ref: User, required)
  previousStock: Number (required, default: 0)
  newStock: Number (required)
  stockAdded: Number (required, only positive additions)
  purchasePrice: Number (required, purchase price at time of addition)
  totalCost: Number (required, stockAdded * purchasePrice)
  changeType: String (enum: create/update, required)
  changeDate: Date (default: Date.now)
  timestamps: createdAt, updatedAt
}
```

**Purpose:** Tracks stock additions for accurate spending calculations and inventory history.

**Features:**
- Records only stock increases (additions to inventory)
- Captures purchase price at time of addition
- Calculates total cost of stock additions
- Used for financial reporting and spending analysis
- Indexed on userId + changeDate, productId, changeDate

### MonthlySnapshot Model
```javascript
{
  userId: ObjectId (ref: User, required)
  userName: String (required, trimmed)
  month: Number (required, 1-12)
  year: Number (required)
  periodStart: Date (required, start of month)
  periodEnd: Date (required, end of month)
  
  overview: {
    totalOrders: Number (default: 0)
    totalRevenue: Number (default: 0)
    totalProducts: Number (default: 0)
    avgOrderValue: Number (default: 0)
    totalProfit: Number (default: 0)
    profitMargin: Number (default: 0, percentage)
    totalStock: Number (default: 0)
    totalInventoryValue: Number (default: 0)
    lowStockCount: Number (default: 0)
  }
  
  topProducts: [{
    productId: ObjectId (ref: Product)
    productName: String
    totalQuantity: Number
    totalRevenue: Number
  }]
  
  categoryStats: [{
    category: String
    count: Number
    totalValue: Number
    avgPrice: Number
  }]
  
  statusDistribution: [{
    status: String
    count: Number
    revenue: Number
  }]
  
  dailyRevenue: [{
    date: String (YYYY-MM-DD)
    revenue: Number
    orders: Number
  }]
  
  isActive: Boolean (default: true)
  timestamps: createdAt, updatedAt
}
```

**Purpose:** Stores pre-calculated monthly statistics for faster analytics and historical reporting.

**Features:**
- One snapshot per user per month (unique compound index)
- Comprehensive business metrics overview
- Top products and category breakdowns
- Daily revenue tracking within the month
- Reduces database load for historical data queries
- Can be generated via create-snapshot.js script

### Counter Model
```javascript
{
  _id: String (unique identifier, e.g., "productId_<userId>" or "orderId_<userId>")
  sequence_value: Number (default: 0, incrementing counter)
}
```

**Purpose:** Manages auto-incrementing sequences for SKUs and Order IDs per user.

**Features:**
- User-scoped counters (each user has independent sequences)
- Atomic increment operations with findByIdAndUpdate
- Used by Product and Order pre-save hooks
- Ensures sequential, predictable IDs
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
- **Color Palette**: Purple to pink gradient theme (from-purple-600 to-pink-500)
- **Typography**: System fonts with responsive sizing
- **Spacing**: Tailwind's default spacing scale
- **Border Radius**: Consistent rounded corners (rounded-lg, rounded-xl)
- **Shadows**: Tailwind shadow utilities (shadow-md, shadow-lg)

### Animation System
- **Library**: Framer Motion 12.23.12
- **Transitions**: Smooth 0.2-0.3s durations
- **Effects**: Fade-ins, slide animations, hover transforms, layout animations
- **Sidebar**: Expandable/collapsible with smooth width transitions
- **Cards**: Hover lift effects and scale animations

### Responsive Design
- **Breakpoints**: Mobile-first Tailwind approach
  - Mobile: <768px (overlay sidebar)
  - Desktop: >=768px (collapsible sidebar)
- **Navigation**: Overlay sidebar on mobile, collapsible sidebar on desktop
- **Grid Systems**: Tailwind Grid and Flexbox utilities
- **Forms**: Responsive input fields and dropdowns

## Key Features Walkthrough

### Dashboard & Landing
- Clean landing page with TwinStar branding
- Large animated logo with gradient background
- Quick access to login and signup
- Responsive layout with smooth transitions

### Product Management
- Grid view with inline editing
- Purchase price and sale price tracking
- Profit margin calculations displayed per product
- Stock level indicators (out of stock, low stock, in stock)
- Category-based filtering
- Search functionality
- Auto-generated SKU system (PROD00001, PROD00002, etc.)
- Real-time validation for prices and stock

### Order Processing
- Comprehensive order creation interface
- Product selection with real-time stock checking
- Multiple order statuses: confirmed, shipped, delivered, cancelled, credit
- Credit order system with partial payment tracking
- Discount support with automatic total adjustments
- Customer information (name, address, phone number)
- Profit calculations based on purchase vs sale prices
- Auto-generated order IDs (ORD00001, ORD00002, etc.)

### Customer Management (Persons)
- Customer list with spending analytics
- Order history per customer with detailed modal view
- Total orders and revenue per customer
- Credit balance tracking
- Search functionality
- Contact information display

### Analytics Dashboard
- Interactive Chart.js visualizations
- Daily revenue and profit trends
- Order status distribution charts
- Top-selling products with profit data
- Recent orders overview
- Low stock alerts
- Expandable sections for detailed views

### PDF Report Generation
- Monthly reports with month/year selection dropdown
- Comprehensive product tables with current prices and stock
- Order summaries grouped by status
- Profit calculations and totals
- Professional multi-page PDF formatting
- Automatic page breaks and headers
- Uses jsPDF and jsPDF-autotable

### Mobile Experience
- Overlay sidebar that slides in from left
- Touch-optimized interactions
- Responsive tables and cards
- Optimized forms for mobile input
- Smooth animations adapted for mobile performance

## Security Features

- **Password Hashing**: bcryptjs with 10 salt rounds
- **Authentication**: HTTP-only cookies with secure, sameSite: 'strict' configuration
- **Input Validation**: Comprehensive server-side validation for all models
- **NoSQL Injection Prevention**: Mongoose ODM with schema validation
- **XSS Protection**: React's built-in JSX escaping
- **CSRF Protection**: SameSite cookie configuration
- **Password Selection**: Password field has select: false to prevent accidental exposure

## Performance Optimizations

- **Next.js 15.1.11**: App Router with Turbopack for faster development builds
- **React 19.0.0**: Latest React with concurrent features
- **Code Splitting**: Automatic route-based code splitting
- **Database Indexing**: Strategic indexes on frequently queried fields
- **Denormalized Data**: userName stored in orders and products for faster queries
- **MongoDB Aggregation**: Efficient data aggregation for analytics
- **Monthly Snapshots**: Pre-calculated statistics reduce real-time computation load
- **CSS Optimization**: Tailwind CSS with production purging

## Dependencies

### Core Dependencies
- **next**: 15.1.11 - React framework with App Router
- **react**: 19.0.0 - UI library
- **react-dom**: 19.0.0 - React DOM renderer
- **mongoose**: 8.18.0 - MongoDB ODM
- **framer-motion**: 12.23.12 - Animation library
- **chart.js**: 4.5.0 - Data visualization
- **tailwindcss**: 3.4.1 - Utility-first CSS framework

### Authentication & Security
- **bcryptjs**: 3.0.2 - Password hashing
- **dotenv**: 17.2.1 - Environment variable management

### UI & Icons
- **lucide-react**: 0.541.0 - Icon library with React components
- **react-chartjs-2**: 5.3.0 - React wrapper for Chart.js

### PDF Generation
- **jspdf**: 3.0.3 - PDF document generation
- **jspdf-autotable**: 5.0.2 - Table plugin for jsPDF

### Dev Dependencies
- **@eslint/eslintrc**: ^3 - ESLint configuration
- **eslint**: ^9 - JavaScript linter
- **eslint-config-next**: 15.1.0 - Next.js ESLint config
- **postcss**: ^8 - CSS transformation tool
- **tailwindcss**: ^3.4.1 - CSS framework

## Setup & Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inventrix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=your-mongodb-connection-string
   MONGODB_DB=twinstar
   NODE_ENV=development
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for production**
   ```bash
   npm run build
   npm run start
   ```

## Available Scripts

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Database Utilities

The project includes several utility scripts in the `scripts/` directory for database management:

- **add-sample-data.js**: Generate sample products and orders for testing
- **backfill-stock-history.js**: Populate StockHistory collection from existing products
- **create-snapshot.js**: Generate monthly snapshot for analytics
- **check-order-dates.js**: Validate order date formats
- **debug-database.js**: General database inspection tool
- **find-product-and-order.js**: Search for specific products and orders
- **list-all-users.js**: Display all users in the database
- **set-password.js**: Reset user password
- **fix-product-schema.js**: Migrate products to new schema
- **inject-test-profit-data.js**: Add test data with profit information

Run scripts with:
```bash
node scripts/<script-name>.js
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
```




