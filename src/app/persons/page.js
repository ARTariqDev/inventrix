"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  Calendar,
  Banknote,
  ShoppingBag,
  User,
  Eye,
  X,
  MapPin,
  Phone,
  FileText,
  Package
} from "lucide-react";
import Layout from "../components/Layout";

export default function PersonsPage() {
  const [persons, setPersons] = useState([]);
  const [filteredPersons, setFilteredPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState(false);

  const fetchPersons = async (search = "") => {
    try {
      setLoading(true);
      const url = search 
        ? `/api/persons?search=${encodeURIComponent(search)}`
        : "/api/persons";
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPersons(data.persons || []);
        setFilteredPersons(data.persons || []);
      }
    } catch (error) {
      console.error("Failed to fetch persons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, []);

  useEffect(() => {
    // Live search while typing with short debounce to reduce API calls
    const delayedSearch = setTimeout(() => {
      fetchPersons(searchTerm);
    }, 200);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  // Instant client-side filtering for a seamless feel while the debounced
  // server fetch keeps the data in sync in the background.
  useEffect(() => {
    if (!searchTerm || !searchTerm.trim()) {
      setFilteredPersons(persons);
      return;
    }

    const s = searchTerm.toLowerCase();
    const filtered = persons.filter(p => {
      const recipient = (p.recipient || "").toLowerCase();
      const phone = (p.phoneNumber || "").toLowerCase();
      const address = (p.address || "").toLowerCase();
      return (
        recipient.includes(s) ||
        phone.includes(s) ||
        address.includes(s)
      );
    });
    setFilteredPersons(filtered);
  }, [searchTerm, persons]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
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
      case 'credit': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openOrderHistoryModal = (person) => {
    setSelectedPerson(person);
    setShowOrderHistoryModal(true);
  };

  const splitName = (fullName) => {
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) {
      return { firstName: nameParts[0], lastName: '' };
    }
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    return { firstName, lastName };
  };



  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Recipients Management
          </h1>
          <div className="text-gray-600 flex items-center gap-3">
            <span>Search recipients by name and view their order history</span>
            {loading && (
              <span className="inline-flex items-center text-sm text-gray-500">
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500" />
                <span className="ml-2">Loading</span>
              </span>
            )}
          </div>
        </motion.div>

        {/* Search */}
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
                placeholder="Search by recipient name (e.g., Ali shows all orders for Ali)..."
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500" />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Customers List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Recipients List
            </h2>
            <p className="text-gray-600 text-sm">
              {filteredPersons.length} recipients found
            </p>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPersons.map((person, index) => {
                  const { firstName, lastName } = splitName(person.recipient);
                  return (
                    <motion.tr
                      key={`${person.recipient}-${index}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 text-purple-500 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {firstName}
                            </div>
                            {lastName && (
                              <div className="text-sm text-gray-500">
                                {lastName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="text-sm text-gray-500">
                          {person.phoneNumber && (
                            <div className="flex items-center mb-1">
                              <Phone className="w-4 h-4 mr-2" />
                              {person.phoneNumber}
                            </div>
                          )}
                          {person.address && (
                            <div className="flex items-start">
                              <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-xs">{person.address}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="flex items-center text-sm font-medium text-gray-900">
                          <ShoppingBag className="w-4 h-4 mr-1" />
                          {person.orderCount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="flex items-center text-sm font-medium text-gray-900">
                          <Banknote className="w-4 h-4 mr-1" />
                          {formatCurrency(person.totalAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="text-sm">
                          {person.totalRemainingAmount > 0 ? (
                            <>
                              <div className="flex items-center text-red-600 font-medium mb-1">
                                <Banknote className="w-4 h-4 mr-1" />
                                {formatCurrency(person.totalRemainingAmount)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {person.creditOrdersCount} credit orders
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">No credit</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(person.lastOrderDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal text-right text-sm font-medium">
                        <button
                          onClick={() => openOrderHistoryModal(person)}
                          className="inline-flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Order History
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-4 space-y-4">
            {filteredPersons.map((person, index) => {
              const { firstName, lastName } = splitName(person.recipient);
              return (
                <motion.div
                  key={`${person.recipient}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  {/* Header with Customer Name */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-purple-500 mr-2" />
                      <div>
                        <div className="font-semibold text-gray-900">{firstName}</div>
                        {lastName && <div className="text-sm text-gray-500">{lastName}</div>}
                      </div>
                    </div>
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      <ShoppingBag className="w-4 h-4 mr-1" />
                      {person.orderCount} orders
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className="space-y-2 mb-4">
                    {person.phoneNumber && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{person.phoneNumber}</span>
                      </div>
                    )}
                    {person.address && (
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{person.address}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span>Last order: {formatDate(person.lastOrderDate)}</span>
                    </div>
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      <Banknote className="w-4 h-4 mr-2 text-green-500" />
                      <span>Total: {formatCurrency(person.totalAmount)}</span>
                    </div>
                    {person.totalRemainingAmount > 0 && (
                      <div className="flex items-center text-sm font-medium text-red-600">
                        <Banknote className="w-4 h-4 mr-2 text-red-500" />
                        <span>Credit: {formatCurrency(person.totalRemainingAmount)} ({person.creditOrdersCount} orders)</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => openOrderHistoryModal(person)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Order History
                  </button>
                </motion.div>
              );
            })}
          </div>

          {filteredPersons.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No recipients found
              </h3>
              <p className="text-gray-500">
                {searchTerm ? "Try adjusting your search criteria" : "No recipients available"}
              </p>
            </div>
          )}
        </motion.div>

        {/* Order History Modal */}
        <AnimatePresence>
          {showOrderHistoryModal && selectedPerson && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowOrderHistoryModal(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedPerson.recipient}
                    </h2>
                    <p className="text-gray-600">Order History</p>
                  </div>
                  <button
                    onClick={() => setShowOrderHistoryModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  <div>
                    {/* Customer Summary */}
                    <div className="bg-purple-50 rounded-xl p-6 mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {selectedPerson.orderCount}
                          </div>
                          <div className="text-sm text-gray-600">Total Orders</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(selectedPerson.totalAmount)}
                          </div>
                          <div className="text-sm text-gray-600">Total Spent</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(selectedPerson.totalRemainingAmount || 0)}
                          </div>
                          <div className="text-sm text-gray-600">Credit Amount</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatDate(selectedPerson.firstOrderDate)}
                          </div>
                          <div className="text-sm text-gray-600">First Order</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {formatDate(selectedPerson.lastOrderDate)}
                          </div>
                          <div className="text-sm text-gray-600">Last Order</div>
                        </div>
                      </div>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
                      {selectedPerson.orders.map((order, index) => (
                        <div key={order.orderId} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-purple-500" />
                              <span className="font-semibold text-gray-900">{order.orderId}</span>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                                {order.orderStatus}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {formatDate(order.orderDate)}
                              </div>
                              <div className="flex items-center font-medium text-gray-900">
                                <Banknote className="w-4 h-4 mr-1" />
                                {formatCurrency(order.orderTotal)}
                              </div>
                            </div>
                          </div>

                          {/* Credit Information for Credit Orders */}
                          {order.orderStatus === 'credit' && (order.creditAmount > 0 || order.remainingAmount > 0) && (
                            <div className="bg-red-50 rounded-lg p-3 mb-3">
                              <div className="text-sm font-medium text-red-700 mb-2">Credit Details:</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center text-green-600">
                                  <Banknote className="w-3 h-3 mr-1" />
                                  <span>Paid: {formatCurrency(order.creditAmount || 0)}</span>
                                </div>
                                <div className="flex items-center text-red-600">
                                  <Banknote className="w-3 h-3 mr-1" />
                                  <span>Remaining: {formatCurrency(order.remainingAmount || 0)}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Order Items */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">Items:</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {order.orderItems.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex items-center text-sm text-gray-600">
                                  <Package className="w-3 h-3 mr-1" />
                                  <span>{item.productName} × {item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
