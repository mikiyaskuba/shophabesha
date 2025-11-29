// Dashboard.tsx
import  { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import BottomNav from "../components/BottomNav";

import {
  Plus,
  TrendingUp,
  CreditCard,
  Users,
  
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import { XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

interface SaleRaw {
  id: string;
  customer: string;
  amount: number;
  isCredit: boolean;
  timestamp?: any; // Firestore Timestamp or Date-like
  paidAmount?: number;
  shopId?: string;
  phone?: string | null;
}

interface Sale extends SaleRaw {
  date: Date;
}

const currency = (n: number) => `${n.toLocaleString()} ETB`;

// helpers
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [viewRange, setViewRange] = useState<"7d" | "30d">("7d"); // chart toggle
  const [loading, setLoading] = useState(true);

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
          // attempt fallback
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

      // sort newest first
      arr.sort((a, b) => b.date.getTime() - a.date.getTime());
      setSales(arr);
      setLoading(false);
    });

    return unsub;
  }, []);

  // --- derived KPIs ---
  const kpis = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = addDays(todayStart, -1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0); // last day of last month

    let todayTotal = 0;
    let yesterdayTotal = 0;
    let monthTotal = 0;
    let lastMonthTotal = 0;
    let totalCredit = 0;

    const debtMap = new Map<string, { owed: number; paid: number; phone?: string | null }>();

    for (const s of sales) {
      const t = s.date.getTime();
      if (t >= todayStart.getTime()) todayTotal += s.amount;
      if (t >= yesterdayStart.getTime() && t < todayStart.getTime()) yesterdayTotal += s.amount;
      if (t >= monthStart.getTime()) monthTotal += s.amount;
      if (t >= lastMonthStart.getTime() && t <= lastMonthEnd.getTime()) lastMonthTotal += s.amount;

      if (s.isCredit) {
        totalCredit += s.amount;
        const name = s.customer.trim();
        const existing = debtMap.get(name) || { owed: 0, paid: 0, phone: s.phone };
        existing.owed += s.amount;
        existing.paid += s.paidAmount || 0;
        existing.phone = existing.phone || s.phone;
        debtMap.set(name, existing);
      }
    }

    // top debtor
    let activeDebtors = 0;
    let topDebtor: { name: string; balance: number; phone?: string | null } | null = null;
    for (const [name, { owed, paid, phone }] of debtMap.entries()) {
      const balance = owed - (paid || 0);
      if (balance > 0) {
        activeDebtors++;
        if (!topDebtor || balance > topDebtor.balance) {
          topDebtor = { name, balance, phone };
        }
      }
    }

    return {
      todayTotal,
      yesterdayTotal,
      todayVsYesterdayPct:
        yesterdayTotal === 0 ? (todayTotal === 0 ? 0 : 100) : ((todayTotal - yesterdayTotal) / Math.abs(yesterdayTotal)) * 100,
      monthTotal,
      lastMonthTotal,
      monthVsLastMonthPct:
        lastMonthTotal === 0 ? (monthTotal === 0 ? 0 : 100) : ((monthTotal - lastMonthTotal) / Math.abs(lastMonthTotal)) * 100,
      totalCredit,
      activeDebtors,
      topDebtor,
    };
  }, [sales]);

  // --- chart data (last 7 or 30 days) ---
  const chartData = useMemo(() => {
    const days = viewRange === "7d" ? 7 : 30;
    const now = startOfDay(new Date());
    const buckets: { date: Date; total: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = addDays(now, -i);
      buckets.push({ date: d, total: 0 });
    }

    for (const s of sales) {
      const saleDay = startOfDay(s.date);
      for (const b of buckets) {
        if (b.date.getTime() === saleDay.getTime()) {
          b.total += s.amount;
          break;
        }
      }
    }

    return buckets.map((b) => ({
      date: formatDay(b.date),
      total: Math.round(b.total),
    }));
  }, [sales, viewRange]);

  // activity feed: recent 10 sales, friendly text
  const activityFeed = useMemo(() => {
    return sales.slice(0, 10).map((s) => {
      const type = s.isCredit ? "Credit" : "Cash";
      return {
        id: s.id,
        title: `${s.customer} — ${type}`,
        subtitle: `${currency(s.amount)} • ${s.date.toLocaleString()}`,
        date: s.date,
      };
    });
  }, [sales]);

  // small animated number component
  function AnimatedNumber({ value }: { value: number }) {
    return (
      <motion.span
        key={value}
        initial={{ opacity: 0.2, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="font-bold text-3xl"
      >
        {value.toLocaleString()}
      </motion.span>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-4 pb-28">
      <div className="flex justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">ShopHabesha Pro</h1>
          <p className="text-gray-400">Live analytics — updated in real-time</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex gap-3">
            <button
              onClick={() => setViewRange("7d")}
              className={`px-3 py-2 rounded-xl ${viewRange === "7d" ? "bg-accent text-white" : "bg-card text-gray-300"}`}
            >
              7d
            </button>
            <button
              onClick={() => setViewRange("30d")}
              className={`px-3 py-2 rounded-xl ${viewRange === "30d" ? "bg-accent text-white" : "bg-card text-gray-300"}`}
            >
              30d
            </button>
          </div>

          <button
            onClick={() => navigate("/add")}
            className="bg-gradient-to-r from-primary to-accent p-3 rounded-2xl shadow-xl hover:scale-105 transition"
            title="Add Sale"
          >
            <Plus size={22} className="text-white" />
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-2xl p-5 border border-accent/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Today's Sales</p>
              <div className="flex items-end gap-2">
                <AnimatedNumber value={Math.round(kpis.todayTotal)} />
                <span className="text-sm text-gray-400">ETB</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Compared to yesterday</p>
            </div>
            <div className="flex flex-col items-end">
              <TrendingUp size={28} className="text-success" />
              <div className="flex items-center gap-1 mt-1">
                {kpis.todayVsYesterdayPct >= 0 ? (
                  <ArrowUpRight className="text-success" />
                ) : (
                  <ArrowDownRight className="text-danger" />
                )}
                <span className={`text-sm ${kpis.todayVsYesterdayPct >= 0 ? "text-success" : "text-danger"}`}>
                  {Math.abs(Math.round(kpis.todayVsYesterdayPct))}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-accent/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">This Month</p>
              <div className="flex items-end gap-2">
                <AnimatedNumber value={Math.round(kpis.monthTotal)} />
                <span className="text-sm text-gray-400">ETB</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Compared to last month</p>
            </div>

            <div className="flex flex-col items-end">
              <CreditCard size={28} className="text-warning" />
              <div className="flex items-center gap-1 mt-1">
                {kpis.monthVsLastMonthPct >= 0 ? (
                  <ArrowUpRight className="text-success" />
                ) : (
                  <ArrowDownRight className="text-danger" />
                )}
                <span className={`text-sm ${kpis.monthVsLastMonthPct >= 0 ? "text-success" : "text-danger"}`}>
                  {Math.abs(Math.round(kpis.monthVsLastMonthPct))}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-accent/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Debtors</p>
              <div className="flex items-baseline gap-2">
                <motion.span initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="font-bold text-3xl">
                  {kpis.activeDebtors}
                </motion.span>
                <span className="text-sm text-gray-400">customers</span>
              </div>

              <p className="text-xs text-gray-400 mt-1">Total owed: {currency(Math.round(kpis.totalCredit))}</p>
            </div>

            <div className="flex flex-col items-end">
              <Users size={28} className="text-primary" />
              <div className="text-right mt-2">
                {kpis.topDebtor ? (
                  <div className="text-xs">
                    <div className="font-medium">{kpis.topDebtor.name}</div>
                    <div className="text-gray-400">{currency(Math.round(kpis.topDebtor.balance))}</div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">No debtors</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHART + RECENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-2xl p-5 border border-accent/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">Sales ({viewRange === "7d" ? "Last 7 days" : "Last 30 days"})</h3>
            <div className="text-sm text-gray-400">{loading ? "Loading..." : `${sales.length} records`}</div>
          </div>

          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.06} />
                <XAxis dataKey="date" tick={{ fill: "#cbd5e1" }} />
                <YAxis tick={{ fill: "#cbd5e1" }} />
                <Tooltip formatter={(value: any) => `${value.toLocaleString()} ETB`} />
                <Bar dataKey="total" fill="#4f46e5" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-accent/20">
          <h3 className="text-lg font-bold text-white mb-3">Activity Feed</h3>

          {activityFeed.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-auto pr-2">
              {activityFeed.map((a) => (
                <div key={a.id} className="flex items-center justify-between bg-surface/50 rounded-xl p-3">
                  <div>
                    <div className="font-medium text-white">{a.title}</div>
                    <div className="text-xs text-gray-400">{a.subtitle}</div>
                  </div>
                  <div className="text-right text-xs text-gray-400">{a.date.toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button onClick={() => navigate("/credits")} className="text-sm px-3 py-2 rounded-xl bg-card text-gray-300 hover:bg-accent transition">
              View All
            </button>
          </div>
        </div>
      </div>

      {/* RECENT CREDIT LIST */}
      <div className="bg-card rounded-2xl p-5 border border-accent/20 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Recent Credit Sales</h3>
        {sales.filter(s => s.isCredit).slice(0, 8).length === 0 ? (
          <p className="text-gray-400 text-center py-8">No credit sales yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sales.filter(s => s.isCredit).slice(0, 8).map(s => (
              <div key={s.id} className="flex items-center justify-between bg-surface/50 rounded-xl p-3">
                <div>
                  <div className="font-medium text-white">{s.customer}</div>
                  <div className="text-xs text-gray-400">{s.date.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-danger">{s.amount.toLocaleString()} ETB</div>
                  {s.paidAmount ? <div className="text-xs text-success">Paid: {s.paidAmount.toLocaleString()}</div> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div className="fixed right-4 bottom-20 flex flex-col gap-3 z-40">
        <button onClick={() => navigate("/customers")} title="View Customers" className="bg-card p-3 rounded-xl shadow-lg hover:scale-105 transition">
          <Users size={18} className="text-white" />
        </button>
        <button onClick={() => navigate("/add?credit=true")} title="Quick credit" className="bg-accent p-3 rounded-xl shadow-lg hover:scale-105 transition">
          <CreditCard size={18} className="text-white" />
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
