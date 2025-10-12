"use client";
import { useState, useEffect } from "react";
import { Menu, Package } from "lucide-react";
import Sidebar from "./SideBar";

export default function Layout({ children }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [totals, setTotals] = useState({ profitLoss: 0, totalSales: 0, totalPurchases: 0 });

  useEffect(() => {
    async function fetchData() {
      try {
        const prodRes = await fetch("/api/products");
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);

        const orderRes = await fetch("/api/orders");
        const orderData = await orderRes.json();
        setOrders(orderData.orders || []);

        // Calculate totals from actual orders
        let totalSales = 0, totalPurchases = 0;
        (orderData.orders || []).forEach(order => {
          totalSales += order.orderTotal || 0;
        });
        
        // Calculate total purchases from products in stock
        (prodData.products || []).forEach(p => {
          totalPurchases += (p.purchasePrice || 0) * (p.stock || 0);
        });
        
        setTotals({
          profitLoss: totalSales - totalPurchases,
          totalSales,
          totalPurchases
        });
      } catch (err) {
        // Handle error
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getMainContentMargin = () => {
    if (isMobile) return '0px';
    return sidebarExpanded ? '250px' : '70px';
  };

  const toggleMobileSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg z-30 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
e            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
             
            </div>
          </div>
          <button
            onClick={toggleMobileSidebar}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
      )}

      <Sidebar 
        onExpandChange={setSidebarExpanded} 
        isExpanded={sidebarExpanded}
        onToggle={toggleMobileSidebar}
        products={products}
        orders={orders}
        totals={totals}
      />
      
      <main 
        className="transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: getMainContentMargin(),
          marginTop: isMobile ? '64px' : '0px', // Add top margin for mobile header
          minHeight: isMobile ? 'calc(100vh - 64px)' : '100vh'
        }}
      >
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
