import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import BottomNav from "../components/BottomNav";
import { StatsCard } from "../components/StatsCard";
import { DashboardSkeleton } from "../components/LoadingSkeleton";
import { QuickActions } from "../components/QuickActions";

import {
  Plus,
  TrendingUp,
  CreditCard,
  Users,
  DollarSign,
  Package,
  AlertTriangle,
  Clock,
} from "lucide-react";

import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

interface SaleRaw {
  id: string;
  customer: string;
  amount: number;
  isCredit: boolean;
  timestamp?: any;
  paidAmount?: number;
  shopId?: string;
  phone?: string | null;
}

interface Sale extends SaleRaw {
  date: Date;
}

const currency = (n: number) => `${n.toLocaleString()} ETB`;

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

const formatDay = (d: Date) => {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const COLORS = ["#6d28d9", "#00d4ff", "#22c55e", "#f43f5e"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [viewRange, setViewRange] = useState<"7d" | "30d">("7d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedPhone = localStorage.getItem("ownerPhone");
    if (!savedPhone) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "sales"),
      where("shopId", "==", auth.currentUser?.uid || "demo-shop")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const arr: Sale[] = [];

      snapshot.forEach((doc) => {
        const d = doc.data() as SaleRaw;
        const rawTimestamp = d.timestamp;
        let date = new Date();
        if (rawTimestamp && typeof rawTimestamp.toDate === "function") {
          date = rawTimestamp.toDate();
        } else if (rawTimestamp) {
          date = new Date(rawTimestamp);
        }

        arr.push({
          id: doc.id,
          customer: (d.customer || "Unknown").toString(),
          amount: Number(d.amount || 0),
          isCredit: Boolean(d.isCredit),
          paidAmount: Number(d.paidAmount || 0),
          timestamp: d.timestamp,
          date,
          shopId: d.shopId,
          phone: d.phone || null,
        });
      });

      arr.sort((a, b) => b.date.getTime() - a.date.getTime());
      setSales(arr);
      setLoading(false);
    });

    return unsub;
  }, []);

  const kpis = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = addDays(todayStart, -1);
    const weekStart = addDays(todayStart, -7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    let todayTotal = 0;
    let yesterdayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;
    let lastMonthTotal = 0;
    let cashTotal = 0;
    let creditTotal = 0;
    let paidTotal = 0;

    const debtMap = new Map<string, { owed: number; paid: number; phone?: string | null; oldestDate?: Date }>();

    for (const s of sales) {
      const t = s.date.getTime();
      if (t >= todayStart.getTime()) todayTotal += s.amount;
      if (t >= yesterdayStart.getTime() && t < todayStart.getTime()) yesterdayTotal += s.amount;
      if (t >= weekStart.getTime()) weekTotal += s.amount;
      if (t >= monthStart.getTime()) monthTotal += s.amount;
      if (t >= lastMonthStart.getTime() && t <= lastMonthEnd.getTime()) lastMonthTotal += s.amount;

      if (s.isCredit) {
        creditTotal += s.amount;
        paidTotal += s.paidAmount || 0;
        const name = s.customer.trim();
        const existing = debtMap.get(name) || { owed: 0, paid: 0, phone: s.phone };
        existing.owed += s.amount;
        existing.paid += s.paidAmount || 0;
        existing.phone = existing.phone || s.phone;
        if (!existing.oldestDate || s.date < existing.oldestDate) {
          existing.oldestDate = s.date;
        }
        debtMap.set(name, existing);
      } else {
        cashTotal += s.amount;
      }
    }

    let activeDebtors = 0;
    let overdueDebtors = 0;
    let criticalDebtors = 0;
    let topDebtor: { name: string; balance: number; phone?: string | null; daysOverdue: number } | null = null;

    for (const [name, { owed, paid, phone, oldestDate }] of debtMap.entries()) {
      const balance = owed - (paid || 0);
      if (balance > 0) {
        activeDebtors++;
        const daysOverdue = oldestDate
          ? Math.floor((now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        if (daysOverdue > 7) overdueDebtors++;
        if (daysOverdue > 30) criticalDebtors++;

        if (!topDebtor || balance > topDebtor.balance) {
          topDebtor = { name, balance, phone, daysOverdue };
        }
      }
    }

    const outstanding = creditTotal - paidTotal;

    return {
      todayTotal,
      yesterdayTotal,
      weekTotal,
      todayVsYesterdayPct:
        yesterdayTotal === 0 ? (todayTotal === 0 ? 0 : 100) : ((todayTotal - yesterdayTotal) / Math.abs(yesterdayTotal)) * 100,
      monthTotal,
      lastMonthTotal,
      monthVsLastMonthPct:
        lastMonthTotal === 0 ? (monthTotal === 0 ? 0 : 100) : ((monthTotal - lastMonthTotal) / Math.abs(lastMonthTotal)) * 100,
      cashTotal,
      creditTotal,
      paidTotal,
      outstanding,
      collectionRate: creditTotal > 0 ? (paidTotal / creditTotal) * 100 : 0,
      activeDebtors,
      overdueDebtors,
      criticalDebtors,
      topDebtor,
    };
  }, [sales]);

  const chartData = useMemo(() => {
    const days = viewRange === "7d" ? 7 : 30;
    const now = startOfDay(new Date());
    const buckets: { date: Date; cash: number; credit: number; total: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = addDays(now, -i);
      buckets.push({ date: d, cash: 0, credit: 0, total: 0 });
    }

    for (const s of sales) {
      const saleDay = startOfDay(s.date);
      for (const b of buckets) {
        if (b.date.getTime() === saleDay.getTime()) {
          if (s.isCredit) {
            b.credit += s.amount;
          } else {
            b.cash += s.amount;
          }
          b.total += s.amount;
          break;
        }
      }
    }

    return buckets.map((b) => ({
      date: formatDay(b.date),
      cash: Math.round(b.cash),
      credit: Math.round(b.credit),
      total: Math.round(b.total),
    }));
  }, [sales, viewRange]);

  const paymentMixData = useMemo(() => {
    return [
      { name: "Cash", value: kpis.cashTotal },
      { name: "Credit", value: kpis.creditTotal },
    ].filter((d) => d.value > 0);
  }, [kpis]);

  const activityFeed = useMemo(() => {
    return sales.slice(0, 8).map((s) => {
      const type = s.isCredit ? "Credit" : "Cash";
      return {
        id: s.id,
        title: s.customer,
        amount: s.amount,
        type,
        isCredit: s.isCredit,
        date: s.date,
      };
    });
  }, [sales]);

  const shopName = localStorage.getItem("shopName") || "ShopHabesha Pro";

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
      <div className="flex justify-between items-center gap-4 mb-6">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl md:text-3xl font-bold text-white"
          >
            {shopName}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-sm"
          >
            Real-time business insights
          </motion.p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => setViewRange("7d")}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                viewRange === "7d" ? "bg-accent text-white" : "bg-card text-gray-400"
              }`}
            >
              7D
            </button>
            <button
              onClick={() => setViewRange("30d")}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                viewRange === "30d" ? "bg-accent text-white" : "bg-card text-gray-400"
              }`}
            >
              30D
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/add")}
            className="bg-gradient-to-r from-primary to-accent p-3 rounded-2xl shadow-xl"
          >
            <Plus size={22} className="text-white" />
          </motion.button>
        </div>
      </div>

      {kpis.criticalDebtors > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-danger/20 border border-danger/50 rounded-2xl p-4 mb-4 flex items-center gap-3"
        >
          <AlertTriangle className="text-danger" size={24} />
          <div className="flex-1">
            <p className="text-danger font-medium">Critical Alert</p>
            <p className="text-danger/80 text-sm">
              {kpis.criticalDebtors} customers overdue 30+ days ({currency(kpis.outstanding)} outstanding)
            </p>
          </div>
          <button
            onClick={() => navigate("/customers")}
            className="px-4 py-2 bg-danger rounded-xl text-white text-sm font-medium"
          >
            View
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatsCard
          title="Today"
          value={Math.round(kpis.todayTotal)}
          subtitle="ETB"
          icon={DollarSign}
          iconColor="text-success"
          trend={{
            value: Math.round(kpis.todayVsYesterdayPct),
            label: "vs yesterday",
          }}
          delay={0}
        />
        <StatsCard
          title="This Week"
          value={Math.round(kpis.weekTotal)}
          subtitle="ETB"
          icon={TrendingUp}
          iconColor="text-accent"
          delay={0.1}
        />
        <StatsCard
          title="Outstanding"
          value={Math.round(kpis.outstanding)}
          subtitle="ETB"
          icon={CreditCard}
          iconColor="text-danger"
          delay={0.2}
        />
        <StatsCard
          title="Debtors"
          value={kpis.activeDebtors}
          subtitle={kpis.overdueDebtors > 0 ? `${kpis.overdueDebtors} overdue` : "active"}
          icon={Users}
          iconColor="text-primary"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-card rounded-2xl p-5 border border-accent/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">
              Sales Trend ({viewRange === "7d" ? "7 Days" : "30 Days"})
            </h3>
            <div className="flex gap-2 md:hidden">
              <button
                onClick={() => setViewRange("7d")}
                className={`px-2 py-1 rounded-lg text-xs ${
                  viewRange === "7d" ? "bg-accent text-white" : "bg-surface text-gray-400"
                }`}
              >
                7D
              </button>
              <button
                onClick={() => setViewRange("30d")}
                className={`px-2 py-1 rounded-lg text-xs ${
                  viewRange === "30d" ? "bg-accent text-white" : "bg-surface text-gray-400"
                }`}
              >
                30D
              </button>
            </div>
          </div>

          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6d28d9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6d28d9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid #6d28d9",
                    borderRadius: 12,
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} ETB`, "Sales"]}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#6d28d9"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl p-5 border border-accent/20"
        >
          <h3 className="text-lg font-bold text-white mb-4">Payment Mix</h3>

          {paymentMixData.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              No sales yet
            </div>
          ) : (
            <>
              <div style={{ width: "100%", height: 120 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={paymentMixData}
                      innerRadius={35}
                      outerRadius={55}
                      dataKey="value"
                      stroke="none"
                    >
                      {paymentMixData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-gray-300 text-sm">Cash</span>
                  </div>
                  <span className="text-white text-sm font-medium">
                    {kpis.cashTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    <span className="text-gray-300 text-sm">Credit</span>
                  </div>
                  <span className="text-white text-sm font-medium">
                    {kpis.creditTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-2xl p-5 border border-accent/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
            <span className="text-sm text-gray-400">{sales.length} total</span>
          </div>

          {activityFeed.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package size={40} className="mx-auto mb-2 opacity-50" />
              <p>No sales yet</p>
              <button
                onClick={() => navigate("/add")}
                className="mt-3 text-accent text-sm"
              >
                Add your first sale
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-auto pr-2">
              <AnimatePresence>
                {activityFeed.map((a, index) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between bg-surface/50 rounded-xl p-3 hover:bg-surface/80 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          a.isCredit ? "bg-accent" : "bg-success"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-white text-sm">{a.title}</p>
                        <p className="text-xs text-gray-500">
                          {a.date.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold text-sm ${
                          a.isCredit ? "text-accent" : "text-success"
                        }`}
                      >
                        {a.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">{a.type}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card rounded-2xl p-5 border border-accent/20"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-danger" />
            <h3 className="text-lg font-bold text-white">Collection Status</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Collection Rate</span>
                <span className="text-white font-medium">
                  {Math.round(kpis.collectionRate)}%
                </span>
              </div>
              <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(kpis.collectionRate, 100)}%` }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="bg-gradient-to-r from-success to-accent h-full rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-3 bg-surface/50 rounded-xl">
                <p className="text-2xl font-bold text-success">{kpis.paidTotal.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Collected</p>
              </div>
              <div className="text-center p-3 bg-surface/50 rounded-xl">
                <p className="text-2xl font-bold text-danger">{kpis.outstanding.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Outstanding</p>
              </div>
              <div className="text-center p-3 bg-surface/50 rounded-xl">
                <p className="text-2xl font-bold text-yellow-500">{kpis.overdueDebtors}</p>
                <p className="text-xs text-gray-400">Overdue</p>
              </div>
            </div>

            {kpis.topDebtor && (
              <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 mt-2">
                <p className="text-sm text-gray-400 mb-1">Top Debtor</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white">{kpis.topDebtor.name}</p>
                    {kpis.topDebtor.daysOverdue > 0 && (
                      <p className="text-xs text-danger">{kpis.topDebtor.daysOverdue} days overdue</p>
                    )}
                  </div>
                  <p className="text-xl font-bold text-danger">
                    {kpis.topDebtor.balance.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <QuickActions />
      <BottomNav />
    </div>
  );
}
