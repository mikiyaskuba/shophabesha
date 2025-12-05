import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import BottomNav from '../components/BottomNav';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  CreditCard,
  PieChart,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';

interface Sale {
  id: string;
  customer: string;
  amount: number;
  isCredit: boolean;
  timestamp: any;
  paidAmount?: number;
}

const COLORS = ['#6d28d9', '#00d4ff', '#22c55e', '#f43f5e', '#eab308'];

export default function Reports() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    if (!localStorage.getItem('ownerPhone')) navigate('/');
  }, [navigate]);

  useEffect(() => {
    const q = query(
      collection(db, 'sales'),
      where('shopId', '==', auth.currentUser?.uid || 'demo-shop')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data: Sale[] = [];
      snapshot.forEach((docSnap) => {
        const sale = docSnap.data() as Sale;
        data.push({ ...sale, id: docSnap.id });
      });
      setSales(data);
      setLoading(false);
    });

    return unsub;
  }, []);

  const filteredSales = useMemo(() => {
    const now = new Date();
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : Infinity;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return sales.filter((s) => {
      const saleDate = s.timestamp?.toDate?.() || new Date();
      return saleDate >= cutoff;
    });
  }, [sales, dateRange]);

  const stats = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, s) => sum + s.amount, 0);
    const cashSales = filteredSales.filter((s) => !s.isCredit).reduce((sum, s) => sum + s.amount, 0);
    const creditSales = filteredSales.filter((s) => s.isCredit).reduce((sum, s) => sum + s.amount, 0);
    const collected = filteredSales.filter((s) => s.isCredit).reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const outstanding = creditSales - collected;

    const uniqueCustomers = new Set(filteredSales.map((s) => s.customer.trim())).size;
    const avgSale = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;

    return {
      totalSales,
      cashSales,
      creditSales,
      collected,
      outstanding,
      uniqueCustomers,
      avgSale,
      transactionCount: filteredSales.length,
    };
  }, [filteredSales]);

  const paymentMixData = useMemo(() => {
    return [
      { name: 'Cash', value: stats.cashSales },
      { name: 'Credit', value: stats.creditSales },
    ];
  }, [stats]);

  const topCustomers = useMemo(() => {
    const customerMap = new Map<string, number>();
    filteredSales.forEach((s) => {
      const name = s.customer.trim();
      customerMap.set(name, (customerMap.get(name) || 0) + s.amount);
    });
    return Array.from(customerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));
  }, [filteredSales]);

  const dailySales = useMemo(() => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 14;
    const buckets: { date: string; amount: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      buckets.push({
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        amount: 0,
      });
    }

    filteredSales.forEach((s) => {
      const saleDate = s.timestamp?.toDate?.() || new Date();
      const dateStr = saleDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const bucket = buckets.find((b) => b.date === dateStr);
      if (bucket) bucket.amount += s.amount;
    });

    return buckets;
  }, [filteredSales, dateRange]);

  const exportCSV = () => {
    const headers = ['Date', 'Customer', 'Amount', 'Type', 'Paid'];
    const rows = filteredSales.map((s) => [
      s.timestamp?.toDate?.()?.toLocaleDateString() || '',
      s.customer,
      s.amount,
      s.isCredit ? 'Credit' : 'Cash',
      s.paidAmount || 0,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface p-4 pb-28">
        <DashboardSkeleton />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-4 pb-28">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports</h1>
          <p className="text-gray-400">Business analytics & insights</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-accent text-white font-medium"
        >
          <Download size={18} />
          Export
        </motion.button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['7d', '30d', '90d', 'all'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition ${
              dateRange === range
                ? 'bg-accent text-white'
                : 'bg-card text-gray-400 hover:text-white'
            }`}
          >
            {range === '7d' && 'Last 7 Days'}
            {range === '30d' && 'Last 30 Days'}
            {range === '90d' && 'Last 90 Days'}
            {range === 'all' && 'All Time'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 border border-accent/20"
        >
          <DollarSign size={24} className="text-success mb-2" />
          <p className="text-gray-400 text-sm">Total Sales</p>
          <p className="text-2xl font-bold text-white">{stats.totalSales.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-4 border border-accent/20"
        >
          <FileText size={24} className="text-accent mb-2" />
          <p className="text-gray-400 text-sm">Transactions</p>
          <p className="text-2xl font-bold text-white">{stats.transactionCount}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-4 border border-accent/20"
        >
          <Users size={24} className="text-primary mb-2" />
          <p className="text-gray-400 text-sm">Customers</p>
          <p className="text-2xl font-bold text-white">{stats.uniqueCustomers}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-4 border border-accent/20"
        >
          <TrendingUp size={24} className="text-yellow-500 mb-2" />
          <p className="text-gray-400 text-sm">Avg Sale</p>
          <p className="text-2xl font-bold text-white">{Math.round(stats.avgSale).toLocaleString()}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-5 border border-accent/20"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-accent" />
            <h3 className="text-lg font-bold text-white">Daily Sales</h3>
          </div>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={dailySales}>
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12 }}
                  formatter={(value: number) => [`${value.toLocaleString()} ETB`, 'Sales']}
                />
                <Bar dataKey="amount" fill="#6d28d9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl p-5 border border-accent/20"
        >
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={20} className="text-accent" />
            <h3 className="text-lg font-bold text-white">Payment Mix</h3>
          </div>
          <div className="flex items-center gap-4">
            <div style={{ width: 120, height: 120 }}>
              <ResponsiveContainer>
                <RePieChart>
                  <Pie
                    data={paymentMixData}
                    innerRadius={30}
                    outerRadius={50}
                    dataKey="value"
                    stroke="none"
                  >
                    {paymentMixData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index]} />
                    ))}
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-gray-300">Cash: {stats.cashSales.toLocaleString()} ETB</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-gray-300">Credit: {stats.creditSales.toLocaleString()} ETB</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-2xl p-5 border border-accent/20"
        >
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={20} className="text-danger" />
            <h3 className="text-lg font-bold text-white">Accounts Receivable</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Credit Given</span>
              <span className="text-white font-medium">{stats.creditSales.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Collected</span>
              <span className="text-success font-medium">{stats.collected.toLocaleString()} ETB</span>
            </div>
            <div className="h-px bg-accent/20" />
            <div className="flex justify-between">
              <span className="text-gray-400">Outstanding</span>
              <span className="text-danger font-bold text-xl">{stats.outstanding.toLocaleString()} ETB</span>
            </div>
            <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
              <div
                className="bg-success h-full rounded-full transition-all"
                style={{
                  width: `${stats.creditSales > 0 ? (stats.collected / stats.creditSales) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-sm text-gray-500 text-center">
              {stats.creditSales > 0
                ? `${((stats.collected / stats.creditSales) * 100).toFixed(0)}% collected`
                : 'No credit sales'}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card rounded-2xl p-5 border border-accent/20"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-primary" />
            <h3 className="text-lg font-bold text-white">Top Customers</h3>
          </div>
          <div className="space-y-3">
            {topCustomers.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No customers yet</p>
            ) : (
              topCustomers.map((customer, index) => (
                <div key={customer.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0
                          ? 'bg-yellow-500 text-black'
                          : index === 1
                          ? 'bg-gray-400 text-black'
                          : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-surface text-gray-400'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-white">{customer.name}</span>
                  </div>
                  <span className="text-gray-400">{customer.amount.toLocaleString()} ETB</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
