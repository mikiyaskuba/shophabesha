import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { format } from "date-fns";
import BottomNav from "../components/BottomNav";
import { EmptyState } from "../components/EmptyState";
import { ListSkeleton } from "../components/LoadingSkeleton";
import { CreditCard, AlertTriangle, Clock, CheckCircle } from "lucide-react";

interface Sale {
  id: string;
  customer: string;
  amount: number;
  timestamp: any;
  isCredit: boolean;
  shopId: string;
  paidAmount?: number;
}

export default function Credits() {
  const navigate = useNavigate();
  const [credits, setCredits] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "overdue" | "paid">("all");

  useEffect(() => {
    const savedPhone = localStorage.getItem("ownerPhone");
    if (!savedPhone) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const q = query(
      collection(db, "sales"),
      where("shopId", "==", auth.currentUser?.uid || "demo-shop")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data: Sale[] = [];
      snapshot.forEach((doc) => {
        const sale = doc.data() as Sale;
        if (sale.isCredit) {
          data.push({ ...sale, id: doc.id });
        }
      });

      data.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.()?.getTime() || 0;
        const timeB = b.timestamp?.toDate?.()?.getTime() || 0;
        return timeB - timeA;
      });

      setCredits(data);
      setLoading(false);
    });

    return unsub;
  }, []);

  const totalCredit = credits.reduce((sum, c) => sum + c.amount, 0);
  const totalPaid = credits.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
  const outstanding = totalCredit - totalPaid;

  const filteredCredits = credits.filter((c) => {
    const saleDate = c.timestamp?.toDate?.() || new Date();
    const daysAgo = Math.floor(
      (Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const remaining = c.amount - (c.paidAmount || 0);
    const isPaid = remaining <= 0;
    const isOverdue = daysAgo > 7 && !isPaid;

    if (filter === "overdue") return isOverdue;
    if (filter === "paid") return isPaid;
    return true;
  });

  return (
    <div className="min-h-screen bg-surface p-4 pb-28">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Credit Tracker</h1>
        <p className="text-gray-400">Track all credit sales and payments</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        <div className="bg-card rounded-2xl p-4 border border-accent/20 text-center">
          <p className="text-gray-400 text-xs mb-1">Total Credit</p>
          <p className="text-xl font-bold text-white">
            {totalCredit.toLocaleString()}
          </p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-success/20 text-center">
          <p className="text-gray-400 text-xs mb-1">Collected</p>
          <p className="text-xl font-bold text-success">
            {totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-danger/20 text-center">
          <p className="text-gray-400 text-xs mb-1">Outstanding</p>
          <p className="text-xl font-bold text-danger">
            {outstanding.toLocaleString()}
          </p>
        </div>
      </motion.div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {(["all", "overdue", "paid"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition ${
              filter === f
                ? "bg-accent text-white"
                : "bg-card text-gray-400 hover:text-white"
            }`}
          >
            {f === "all" && `All (${credits.length})`}
            {f === "overdue" && "Overdue"}
            {f === "paid" && "Paid"}
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton count={4} />
      ) : filteredCredits.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={filter === "all" ? "No Credits Yet" : "No Results"}
          description={
            filter === "all"
              ? "Credit sales will appear here"
              : "No items match this filter"
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredCredits.map((c, index) => {
              const saleDate = c.timestamp?.toDate?.() || new Date();
              const daysAgo = Math.floor(
                (Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              const remaining = c.amount - (c.paidAmount || 0);
              const isPaid = remaining <= 0;
              const isOverdue = daysAgo > 7 && !isPaid;
              const isCritical = daysAgo > 30 && !isPaid;

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-card rounded-2xl p-4 border-2 transition-all ${
                    isPaid
                      ? "border-success/50 opacity-70"
                      : isCritical
                      ? "border-danger/80 shadow-lg shadow-danger/20"
                      : isOverdue
                      ? "border-yellow-500/50"
                      : "border-accent/20"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-white">{c.customer}</p>
                        {isPaid && (
                          <CheckCircle size={16} className="text-success" />
                        )}
                        {isOverdue && !isPaid && (
                          <div
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              isCritical
                                ? "bg-danger/20 text-danger"
                                : "bg-yellow-500/20 text-yellow-500"
                            }`}
                          >
                            <Clock size={10} />
                            {daysAgo}d
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {format(saleDate, "dd MMM yyyy")}
                        {daysAgo > 0 &&
                          !isPaid &&
                          ` | ${daysAgo} ${daysAgo === 1 ? "day" : "days"} ago`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-xl font-bold ${
                          isPaid
                            ? "text-success line-through"
                            : isCritical
                            ? "text-danger"
                            : isOverdue
                            ? "text-yellow-500"
                            : "text-white"
                        }`}
                      >
                        {c.amount.toLocaleString()} ETB
                      </p>
                      {c.paidAmount && c.paidAmount > 0 && (
                        <p className="text-success text-sm">
                          Paid: {c.paidAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {!isPaid && remaining > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Payment progress</span>
                        <span>
                          {Math.round(((c.paidAmount || 0) / c.amount) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${((c.paidAmount || 0) / c.amount) * 100}%`,
                          }}
                          className="bg-gradient-to-r from-success to-accent h-full rounded-full"
                        />
                      </div>
                    </div>
                  )}

                  {isOverdue && !isPaid && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`mt-3 p-2 rounded-xl flex items-center gap-2 ${
                        isCritical
                          ? "bg-danger/10 border border-danger/30"
                          : "bg-yellow-500/10 border border-yellow-500/30"
                      }`}
                    >
                      <AlertTriangle
                        size={16}
                        className={isCritical ? "text-danger" : "text-yellow-500"}
                      />
                      <p
                        className={`text-sm font-medium ${
                          isCritical ? "text-danger" : "text-yellow-500"
                        }`}
                      >
                        {isCritical ? "Critical: " : ""}Overdue by {daysAgo} days
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
