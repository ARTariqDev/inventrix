"use client";
import { useState, useEffect } from "react";
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

  // Calculate the margin left based on sidebar state and screen size
  const getMainContentMargin = () => {
    if (isMobile) return '0px'; // No margin on mobile
    return sidebarExpanded ? '250px' : '70px'; // Adjust based on sidebar width
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Sidebar onExpandChange={setSidebarExpanded} />
      <main 
        className="transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: getMainContentMargin(),
          minHeight: '100vh'
        }}
      >
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
