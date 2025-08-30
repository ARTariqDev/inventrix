import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  FileText, 
  Menu, 
  X 
} from "lucide-react";

export default function Sidebar({ onExpandChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-collapse on mobile
      if (mobile && isExpanded) {
        setIsExpanded(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isExpanded]);

  // Notify parent component when sidebar expands/collapses
  useEffect(() => {
    if (onExpandChange) {
      onExpandChange(isExpanded);
    }
  }, [isExpanded, onExpandChange]);

  const toggleSidebar = () => {
    if (isAnimating) return; // Prevent multiple clicks during animation
    setIsAnimating(true);
    setIsExpanded(!isExpanded);
    
    // Reset animation lock after animation completes
    setTimeout(() => setIsAnimating(false), 300);
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: BarChart3,
      href: "/stats"
    },
    {
      name: "Inventory",
      icon: Package,
      href: "/products"
    },
    {
      name: "Orders",
      icon: ShoppingCart,
      href: "/orders"
    },
    {
      name: "Invoices",
      icon: FileText,
      href: "/invoices"
    }
  ];

  const sidebarVariants = {
    expanded: {
      width: isMobile ? "250px" : "250px",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    collapsed: {
      width: isMobile ? "0px" : "70px",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  const contentVariants = {
    expanded: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.25,
        delay: 0.15,
        ease: "easeOut"
      }
    },
    collapsed: {
      opacity: 0,
      x: -10,
      transition: {
        duration: 0.1,
        ease: "easeIn"
      }
    }
  };

  return (
    <>
      {/* Overlay for mobile when sidebar is expanded */}
      <AnimatePresence>
        {isMobile && isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.div
        variants={sidebarVariants}
        animate={isExpanded ? "expanded" : "collapsed"}
        onAnimationComplete={() => setIsAnimating(false)}
        className={`
          fixed left-0 top-0 h-screen bg-gradient-to-b from-purple-600 via-purple-700 to-pink-600 shadow-xl z-40 flex flex-col
          ${isMobile ? 'transform transition-transform duration-300' : ''}
          ${isMobile && !isExpanded ? '-translate-x-full' : 'translate-x-0'}
        `}
        style={{
          width: isMobile ? (isExpanded ? '250px' : '0px') : undefined
        }}
      >
      {/* Header Section */}
      <div className="p-4 border-b border-purple-400/30">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.div
                key="brand-content"
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-xl font-bold text-white">Inventrix</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.button
            onClick={toggleSidebar}
            disabled={isAnimating}
            className={`w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors ${isAnimating ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            whileHover={!isAnimating ? { scale: 1.05 } : {}}
            whileTap={!isAnimating ? { scale: 0.95 } : {}}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              {isExpanded ? <X size={18} /> : <Menu size={18} />}
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <motion.li
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.a
                href={item.href}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group relative overflow-hidden"
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Hover effect background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-xl"
                  initial={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
                
                {/* Icon */}
                <motion.div
                  className="relative z-10 w-6 h-6 flex items-center justify-center"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <item.icon size={20} />
                </motion.div>
                
                {/* Text Label */}
                <AnimatePresence mode="wait">
                  {isExpanded && (
                    <motion.span
                      key={`nav-${item.name}`}
                      variants={contentVariants}
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      className="relative z-10 font-medium whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip for collapsed state */}
                <AnimatePresence>
                  {!isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, x: -10, scale: 0.8 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -10, scale: 0.8 }}
                      className="absolute left-16 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    >
                      {item.name}
                      <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-0 h-0 border-r-4 border-r-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.a>
            </motion.li>
          ))}
        </ul>
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-purple-400/30">
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              key="footer-content"
              variants={contentVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="text-center"
            >
              <p className="text-xs text-white/60">
                v1.0.0
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Glowing border effect */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
    </motion.div>
    </>
  );
}