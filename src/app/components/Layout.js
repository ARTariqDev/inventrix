"use client";
import { useState, useEffect } from "react";
import { Menu, Package } from "lucide-react";
import Sidebar from "./SideBar";

export default function Layout({ children }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xl font-bold text-white">Inventrix</span>
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
