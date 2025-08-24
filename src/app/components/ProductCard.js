"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2, Save, X, DollarSign, Package, Calendar, Eye, EyeOff } from "lucide-react";

export default function ProductCard({ product, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const startEdit = (product) => {
    setEditingId(product._id);
    setEditForm({ 
      name: product.name || '',
      description: product.description || '',
      category: product.category || '',
      price: product.price || '',
      stock: product.stock || '',
      isActive: product.isActive
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const formatPrice = (value) => {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    return cleaned;
  };

  const formatStock = (value) => {
    // Only allow whole numbers
    return value.replace(/[^0-9]/g, '');
  };

  const handleKeyPress = (e, fieldType) => {
    if (fieldType === 'price') {
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'];
      const isNumber = /[0-9]/.test(e.key);
      const isDecimal = e.key === '.' && !e.target.value.includes('.');
      
      if (!allowedKeys.includes(e.key) && !isNumber && !isDecimal) {
        e.preventDefault();
      }
    }
    
    if (fieldType === 'stock') {
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'];
      const isNumber = /[0-9]/.test(e.key);
      
      if (!allowedKeys.includes(e.key) && !isNumber) {
        e.preventDefault();
      }
    }
  };

  const saveEdit = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: product._id, 
          updates: {
            ...editForm,
            price: Number(editForm.price) || 0,
            stock: Number(editForm.stock) || 0
          }
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setEditingId(null);
        setEditForm({});
        onUpdate?.();
      } else {
        alert(data.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Failed to update product:", error);
      alert("Failed to update product");
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteProduct = async () => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product._id }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        onDelete?.();
      } else {
        alert(data.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Electronics: 'bg-blue-100 text-blue-700 border-blue-200',
      Books: 'bg-green-100 text-green-700 border-green-200',
      Clothing: 'bg-purple-100 text-purple-700 border-purple-200',
      Furniture: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      Food: 'bg-red-100 text-red-700 border-red-200',
      Sports: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      Home: 'bg-pink-100 text-pink-700 border-pink-200',
      Beauty: 'bg-rose-100 text-rose-700 border-rose-200',
      Toys: 'bg-orange-100 text-orange-700 border-orange-200',
      Automotive: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { 
      text: 'Out of Stock', 
      color: 'text-red-600 bg-red-50 border-red-200',
    };
    if (stock < 10) return { 
      text: 'Low Stock', 
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    };
    if (stock < 50) return { 
      text: 'In Stock', 
      color: 'text-green-600 bg-green-50 border-green-200',
    };
    return { 
      text: 'Well Stocked', 
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (editingId === product._id) {
    return (
      <motion.div
        className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200"
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              value={editForm.name || ''}
              onChange={(e) => handleEditChange('name', e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-400"
              placeholder="Enter product name"
              maxLength="200"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={editForm.description || ''}
              onChange={(e) => handleEditChange('description', e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-400 resize-none"
              placeholder="Enter product description"
              rows="3"
              maxLength="1000"
            />
          </div>

          {/* Category, Price, Stock Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <input
                type="text"
                value={editForm.category || ''}
                onChange={(e) => handleEditChange('category', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-400"
                placeholder="Category"
                maxLength="50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={editForm.price || ''}
                  onChange={(e) => handleEditChange('price', formatPrice(e.target.value))}
                  onKeyDown={(e) => handleKeyPress(e, 'price')}
                  className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-400"
                  placeholder="0.00"
                  inputMode="decimal"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock *
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={editForm.stock || ''}
                  onChange={(e) => handleEditChange('stock', formatStock(e.target.value))}
                  onKeyDown={(e) => handleKeyPress(e, 'stock')}
                  className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-400"
                  placeholder="0"
                  inputMode="numeric"
                  required
                />
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => handleEditChange('isActive', e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Active Product
              </span>
            </label>
          </div>


          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={cancelEdit}
              disabled={isUpdating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <X size={18} />
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={isUpdating || !editForm.name || !editForm.category}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }


  const stockStatus = getStockStatus(product.stock);

  return (
    <motion.div
      className={`bg-white rounded-2xl p-6 shadow-lg border transition-all duration-300 group hover:shadow-xl ${
        product.isActive ? 'border-gray-100 hover:border-purple-200' : 'border-red-200 bg-gray-50'
      }`}
      whileHover={{ y: -2 }}
      layout
    >

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <h3 className={`text-xl font-bold transition-colors ${
              product.isActive 
                ? 'text-gray-800 group-hover:text-purple-600' 
                : 'text-gray-500'
            }`}>
              {product.name}
            </h3>
            <div className="flex items-center gap-2">
              {!product.isActive && (
                <div className="flex items-center gap-1 text-red-500">
                  <EyeOff size={14} />
                  <span className="text-xs font-medium">Inactive</span>
                </div>
              )}
              <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                {product.sku}
              </span>
            </div>
          </div>
          
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(product.category)}`}>
            {product.category}
          </span>
        </div>
      </div>


      {product.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>
      )}


      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-700">
            <DollarSign size={18} className="text-green-500" />
            <span className="text-2xl font-bold text-green-600">
              ${Number(product.price).toFixed(2)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Package size={18} className="text-gray-500" />
            <span className="text-lg font-semibold text-gray-600">
              {product.stock}
            </span>
          </div>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${stockStatus.color}`}>
          <span className="mr-1">{stockStatus.icon}</span>
          {stockStatus.text}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <motion.button
          onClick={() => startEdit(product)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          <Pencil size={18} />
          Edit
        </motion.button>
        
        <motion.button
          onClick={deleteProduct}
          disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          whileTap={{ scale: 0.95 }}
        >
          <Trash2 size={18} />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </motion.button>
      </div>
      

      <div className="flex justify-between items-center text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
        {product.createdAt && (
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>Added: {formatDate(product.createdAt)}</span>
          </div>
        )}
        {product.updatedAt && product.updatedAt !== product.createdAt && (
          <div>
            Updated: {formatDate(product.updatedAt)}
          </div>
        )}
      </div>
    </motion.div>
  );
}