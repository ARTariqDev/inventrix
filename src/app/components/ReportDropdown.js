import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download } from "lucide-react";

const months = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function ReportDropdown({ onDownload }) {
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);

  // Generate years from 2020 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i);

  const handleDownload = async () => {
    if (!selectedMonth) return;
    setLoading(true);
    await onDownload(selectedMonth, selectedYear);
    setLoading(false);
    setOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
        whileHover={{ x: 5 }}
        whileTap={{ scale: 0.98 }}
      >
        <Download size={18} />
        <span className="font-medium">Download Report</span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-3 mt-2 w-48 bg-gradient-to-br from-purple-700 via-purple-800 to-pink-700 border border-purple-400/30 rounded-xl shadow-lg z-50 p-3"
          >
            <label className="block text-white/80 text-sm mb-1.5">Select Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded-lg bg-purple-900/50 text-white border border-purple-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all mb-2"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <label className="block text-white/80 text-sm mb-1.5">Select Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded-lg bg-purple-900/50 text-white border border-purple-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all mb-3"
            >
              <option value="">Choose month</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <button
              onClick={handleDownload}
              disabled={!selectedMonth || loading}
              className="w-full px-3 py-1.5 text-sm bg-pink-600 hover:bg-pink-700 rounded-lg text-white font-semibold transition-all disabled:opacity-50"
            >
              {loading ? "Generating..." : "Download PDF"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
