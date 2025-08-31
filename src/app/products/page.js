"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Filter, Search, Plus, X, Package } from "lucide-react";
import ProductCard from "../components/ProductCard";
import Layout from "../components/Layout";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableCategories, setAvailableCategories] = useState([]);
  
  const [filters, setFilters] = useState({
    name: { value: "", operator: "include" },
    category: { value: "", operator: "include" },
    sku: { value: "", operator: "include" },
    
    price: { value: "", operator: "equal" },
    stock: { value: "", operator: "equal" },
    
    isActive: { value: "all", operator: "equal" }
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    stock: ""
  });
  const [categoryColors, setCategoryColors] = useState({});
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const colorOptions = [
    { name: 'Blue', value: '#3B82F6', classes: 'bg-blue-100 text-blue-700 border-blue-200' },
    { name: 'Purple', value: '#8B5CF6', classes: 'bg-purple-100 text-purple-700 border-purple-200' },
    { name: 'Green', value: '#10B981', classes: 'bg-green-100 text-green-700 border-green-200' },
    { name: 'Red', value: '#EF4444', classes: 'bg-red-100 text-red-700 border-red-200' },
    { name: 'Yellow', value: '#F59E0B', classes: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { name: 'Pink', value: '#EC4899', classes: 'bg-pink-100 text-pink-700 border-pink-200' },
    { name: 'Indigo', value: '#6366F1', classes: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { name: 'Teal', value: '#14B8A6', classes: 'bg-teal-100 text-teal-700 border-teal-200' },
    { name: 'Orange', value: '#F97316', classes: 'bg-orange-100 text-orange-700 border-orange-200' },
    { name: 'Cyan', value: '#06B6D4', classes: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    { name: 'Lime', value: '#84CC16', classes: 'bg-lime-100 text-lime-700 border-lime-200' },
    { name: 'Rose', value: '#F43F5E', classes: 'bg-rose-100 text-rose-700 border-rose-200' }
  ];


  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        
        // Extract unique categories
        const categories = [...new Set(data.products.map(p => p.category))];
        setAvailableCategories(categories);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    loadCategoryColors();
  }, []);

  // Load category colors from localStorage
  const loadCategoryColors = () => {
    const savedColors = localStorage.getItem('inventrix-category-colors');
    if (savedColors) {
      setCategoryColors(JSON.parse(savedColors));
    }
  };

  // Save category colors to localStorage
  const saveCategoryColors = (colors) => {
    localStorage.setItem('inventrix-category-colors', JSON.stringify(colors));
    setCategoryColors(colors);
  };

  // Get color for a category
  const getCategoryColor = (category) => {
    if (categoryColors[category]) {
      const colorOption = colorOptions.find(c => c.value === categoryColors[category]);
      if (colorOption) {
        return colorOption.classes;
      }
    }
    // Default color if not set
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Check if category is new (not in existing categories)
  const isNewCategory = (category) => {
    return category && !availableCategories.includes(category) && !categoryColors[category];
  };

  // Apply filters and search
  useEffect(() => {
    let filtered = [...products];


    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search) ||
        (product.description && product.description.toLowerCase().includes(search))
      );
    }


    Object.entries(filters).forEach(([field, filter]) => {
      if (!filter.value || (field === 'isActive' && filter.value === 'all')) return;

      filtered = filtered.filter(product => {
        const productValue = product[field];

        if (field === 'isActive') {
          return productValue === (filter.value === 'true');
        }


        if (['name', 'category', 'sku'].includes(field)) {
          const productText = String(productValue).toLowerCase();
          const filterText = String(filter.value).toLowerCase();
          
          if (filter.operator === 'include') {
            return productText.includes(filterText);
          } else { // exclude
            return !productText.includes(filterText);
          }
        }


        if (['price', 'stock'].includes(field)) {
          const productNum = Number(productValue);
          const filterNum = Number(filter.value);
          
          switch (filter.operator) {
            case 'equal':
              return productNum === filterNum;
            case 'not-equal':
              return productNum !== filterNum;
            case 'greater':
              return productNum > filterNum;
            case 'less':
              return productNum < filterNum;
            default:
              return true;
          }
        }

        return true;
      });
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, filters]);

  const updateFilter = (field, key, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: { ...prev[field], [key]: value }
    }));
  };

  const clearFilters = () => {
    setFilters({
      name: { value: "", operator: "include" },
      category: { value: "", operator: "include" },
      sku: { value: "", operator: "include" },
      price: { value: "", operator: "equal" },
      stock: { value: "", operator: "equal" },
      isActive: { value: "all", operator: "equal" }
    });
    setSearchTerm("");
  };

  const hasActiveFilters = () => {
    return searchTerm.trim() || 
           Object.values(filters).some(filter => 
             filter.value && filter.value !== "all"
           );
  };


  const handleNewProductChange = (field, value) => {
    setNewProductForm(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const addProduct = async () => {
    try {
      // If it's a new category and no color is assigned, require color selection
      if (isNewCategory(newProductForm.category) && !categoryColors[newProductForm.category]) {
        setShowColorPicker(true);
        return;
      }

      const productData = {
        name: newProductForm.name.trim(),
        description: newProductForm.description.trim(),
        category: newProductForm.category.trim(),
        price: parseFloat(newProductForm.price) || 0,
        stock: parseInt(newProductForm.stock) || 0,
        isActive: true
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {

        setNewProductForm({
          name: "",
          description: "",
          category: "",
          price: "",
          stock: ""
        });
        

        setShowAddModal(false);
        await fetchProducts();
      } else {
        console.error("Failed to add product");
      }
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  // Handle color selection for new category
  const handleColorSelection = (color) => {
    const updatedColors = {
      ...categoryColors,
      [newProductForm.category]: color.value
    };
    saveCategoryColors(updatedColors);
    setShowColorPicker(false);
    // Now add the product
    addProduct();
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
            Products Management
          </h1>
          <p className="text-gray-600">
            {filteredProducts.length} of {products.length} products
          </p>
        </motion.div>


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
                placeholder="Search products by name, category, SKU..."
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


          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-gray-200 pt-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                  {['name', 'category', 'sku'].map(field => (
                    <div key={field} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {field}
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={filters[field].operator}
                          onChange={(e) => updateFilter(field, 'operator', e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                          <option value="include">Include</option>
                          <option value="exclude">Exclude</option>
                        </select>
                        {field === 'category' ? (
                          <select
                            value={filters[field].value}
                            onChange={(e) => updateFilter(field, 'value', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                          >
                            <option value="">All Categories</option>
                            {availableCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={filters[field].value}
                            onChange={(e) => updateFilter(field, 'value', e.target.value)}
                            placeholder={`Filter by ${field}...`}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                          />
                        )}
                      </div>
                    </div>
                  ))}


                  {['price', 'stock'].map(field => (
                    <div key={field} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {field}
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={filters[field].operator}
                          onChange={(e) => updateFilter(field, 'operator', e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                          <option value="equal">=</option>
                          <option value="not-equal">≠</option>
                          <option value="greater">&gt;</option>
                          <option value="less">&lt;</option>
                        </select>
                        <input
                          type="number"
                          value={filters[field].value}
                          onChange={(e) => updateFilter(field, 'value', e.target.value)}
                          placeholder="0"
                          min="0"
                          step={field === 'price' ? '0.01' : '1'}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                        />
                      </div>
                    </div>
                  ))}


                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={filters.isActive.value}
                      onChange={(e) => updateFilter('isActive', 'value', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    >
                      <option value="all">All Products</option>
                      <option value="true">Active Only</option>
                      <option value="false">Inactive Only</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Products Grid */}
        <motion.div layout className="product-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onUpdate={fetchProducts}
                onDelete={fetchProducts}
                getCategoryColor={getCategoryColor}
              />
            ))}
          </AnimatePresence>
        </motion.div>


        {filteredProducts.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {hasActiveFilters() ? "No products match your filters" : "No products found"}
            </h3>
            <p className="text-gray-500 mb-4">
              {hasActiveFilters() 
                ? "Try adjusting your search criteria"
                : "Start by adding your first product"
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


        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={24} />
        </motion.button>


        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowAddModal(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={newProductForm.name}
                      onChange={(e) => handleNewProductChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter product name"
                      maxLength="200"
                      required
                    />
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newProductForm.description}
                      onChange={(e) => handleNewProductChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      placeholder="Enter product description"
                      rows="3"
                      maxLength="1000"
                    />
                  </div>


                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newProductForm.category}
                        onChange={(e) => handleNewProductChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter category"
                        maxLength="50"
                        list="categories"
                        required
                      />
                      <datalist id="categories">
                        {availableCategories.map(cat => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                      
                      {/* Category Color Preview */}
                      {newProductForm.category && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm text-gray-600">Preview:</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(newProductForm.category)}`}>
                            {newProductForm.category}
                          </span>
                          {isNewCategory(newProductForm.category) && (
                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                              New category - color will be assigned
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">Rs</span>
                        <input
                          type="text"
                          value={newProductForm.price}
                          onChange={(e) => handleNewProductChange('price', e.target.value)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      <input
                        type="text"
                        value={newProductForm.stock}
                        onChange={(e) => handleNewProductChange('stock', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                        inputMode="numeric"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addProduct}
                    disabled={!newProductForm.name || !newProductForm.category}
                    className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Product
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Color Picker Modal */}
        <AnimatePresence>
          {showColorPicker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowColorPicker(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Choose Color for &ldquo;{newProductForm.category}&rdquo;
                  </h2>
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <p className="text-gray-600 mb-6">
                  This is a new category. Please select a color to represent it throughout the app.
                </p>

                {/* Color Grid */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {colorOptions.map((color) => (
                    <motion.button
                      key={color.value}
                      onClick={() => handleColorSelection(color)}
                      className="bg-gray-100 hover:scale-110 transition-transform rounded-xl h-16 w-full shadow-lg relative group border-2 border-gray-200 hover:border-gray-300"
                      style={{ backgroundColor: color.value }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="absolute inset-0 bg-white bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all"></div>
                      <div className="absolute bottom-1 left-1 right-1 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded px-1 py-0.5">
                        {color.name}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Preview */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.slice(0, 3).map((color) => (
                      <span
                        key={color.value}
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${color.classes}`}
                      >
                        {newProductForm.category}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleColorSelection(colorOptions[0])}
                    className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    Use Default (Blue)
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