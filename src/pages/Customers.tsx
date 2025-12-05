import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import BottomNav from "../components/BottomNav";
import { MessageModal } from "../components/MessageModal";
import { ConfirmModal } from "../components/Modal";
import { EmptyState } from "../components/EmptyState";
import { ListSkeleton } from "../components/LoadingSkeleton";
import { showToast } from "../components/Toast";
import {
  Phone,
  MessageCircle,
  Trash2,
  CheckCircle,
  Search,
  Users,
  AlertTriangle,
  Clock,
} from "lucide-react";

interface SaleDoc {
  id: string;
  customer: string;
  phone: string | null;
  amount: number;
  paidAmount?: number;
  isCredit: boolean;
  shopId: string;
  timestamp?: any;
}

interface Customer {
  name: string;
  phone: string | null;
  totalCredit: number;
  paidAmount: number;
  docs: SaleDoc[];
  oldestDebt?: Date;
  daysOverdue: number;
}

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageCustomer, setMessageCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ docId: string; customerName: string } | null>(null);
  const [paymentModal, setPaymentModal] = useState<{
    docId: string;
    paidSoFar: number;
    total: number;
    customerName: string;
  } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("ownerPhone")) navigate("/");
  }, [navigate]);

  useEffect(() => {
    const q = collection(db, "sales");

    const unsub = onSnapshot(q, (snapshot) => {
      const map = new Map<string, Customer>();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as SaleDoc;
        const id = docSnap.id;

        if (
          data.isCredit &&
          data.shopId === (auth.currentUser?.uid || "demo-shop")
        ) {
          const name = data.customer.trim();

          if (!map.has(name)) {
            map.set(name, {
              name,
              phone: data.phone,
              totalCredit: 0,
              paidAmount: 0,
              docs: [],
              daysOverdue: 0,
            });
          }

          const cust = map.get(name)!;
          cust.totalCredit += data.amount;
          cust.paidAmount += data.paidAmount || 0;
          cust.docs.push({ ...data, id });

          const saleDate = data.timestamp?.toDate?.();
          if (saleDate) {
            if (!cust.oldestDebt || saleDate < cust.oldestDebt) {
              cust.oldestDebt = saleDate;
            }
          }
        }
      });

      const now = new Date();
      const filtered = Array.from(map.values())
        .filter((c) => c.totalCredit > c.paidAmount)
        .map((c) => ({
          ...c,
          daysOverdue: c.oldestDebt
            ? Math.floor((now.getTime() - c.oldestDebt.getTime()) / (1000 * 60 * 60 * 24))
            : 0,
        }))
        .sort((a, b) => b.daysOverdue - a.daysOverdue);

      setCustomers(filtered);
      setLoading(false);
    });

    return unsub;
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
  );

  const totalOutstanding = customers.reduce(
    (sum, c) => sum + (c.totalCredit - c.paidAmount),
    0
  );
  const overdueCount = customers.filter((c) => c.daysOverdue > 7).length;

  const handleMarkPaid = async () => {
    if (!paymentModal) return;
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    try {
      await updateDoc(doc(db, "sales", paymentModal.docId), {
        paidAmount: paymentModal.paidSoFar + amount,
      });
      showToast("Payment recorded!", "success");
    } catch {
      showToast("Failed to record payment", "error");
    }
    setPaymentModal(null);
    setPaymentAmount("");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "sales", deleteTarget.docId));
      showToast("Credit deleted", "success");
    } catch {
      showToast("Failed to delete", "error");
    }
    setDeleteTarget(null);
  };

  const call = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="min-h-screen bg-surface p-4 pb-28">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Debtors</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">
            {customers.length} customers | {totalOutstanding.toLocaleString()} ETB outstanding
          </span>
          {overdueCount > 0 && (
            <span className="flex items-center gap-1 text-danger">
              <AlertTriangle size={14} />
              {overdueCount} overdue
            </span>
          )}
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-card rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-400 border border-accent/20 focus:border-accent/50 transition"
        />
      </div>

      {loading ? (
        <ListSkeleton count={4} />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchTerm ? "No Results" : "No Debtors"}
          description={
            searchTerm
              ? "Try a different search term"
              : "All credits have been paid! Great job collecting."
          }
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredCustomers.map((c, index) => {
              const remaining = c.totalCredit - c.paidAmount;
              const isOverdue = c.daysOverdue > 7;
              const isCritical = c.daysOverdue > 30;

              return (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-card rounded-2xl p-5 border-2 transition-all ${
                    isCritical
                      ? "border-danger/80 shadow-lg shadow-danger/20"
                      : isOverdue
                      ? "border-yellow-500/50"
                      : "border-accent/20"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-bold text-white">{c.name}</p>
                        {isOverdue && (
                          <div
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              isCritical
                                ? "bg-danger/20 text-danger"
                                : "bg-yellow-500/20 text-yellow-500"
                            }`}
                          >
                            <Clock size={12} />
                            {c.daysOverdue}d
                          </div>
                        )}
                      </div>
                      {c.phone && (
                        <p className="text-sm text-gray-400">{c.phone}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-2xl font-bold ${
                          isCritical ? "text-danger" : isOverdue ? "text-yellow-500" : "text-white"
                        }`}
                      >
                        {remaining.toLocaleString()} ETB
                      </p>
                      {c.paidAmount > 0 && (
                        <p className="text-success text-sm">
                          Paid: {c.paidAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-between items-center">
                    <div className="flex gap-2">
                      {c.phone && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => call(c.phone!)}
                            className="bg-green-600 p-3 rounded-xl shadow-lg"
                          >
                            <Phone size={20} className="text-white" />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setMessageCustomer(c)}
                            className="bg-blue-600 p-3 rounded-xl shadow-lg"
                          >
                            <MessageCircle size={20} className="text-white" />
                          </motion.button>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {c.docs.map((d) => (
                        <div key={d.id} className="flex gap-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              setPaymentModal({
                                docId: d.id,
                                paidSoFar: d.paidAmount || 0,
                                total: d.amount,
                                customerName: c.name,
                              })
                            }
                            className="bg-success p-3 rounded-xl shadow-lg"
                          >
                            <CheckCircle size={20} className="text-white" />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              setDeleteTarget({ docId: d.id, customerName: c.name })
                            }
                            className="bg-danger/80 p-3 rounded-xl shadow-lg"
                          >
                            <Trash2 size={20} className="text-white" />
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {messageCustomer && messageCustomer.phone && (
        <MessageModal
          isOpen={!!messageCustomer}
          onClose={() => setMessageCustomer(null)}
          customer={{
            name: messageCustomer.name,
            phone: messageCustomer.phone,
            amount: messageCustomer.totalCredit - messageCustomer.paidAmount,
            daysOverdue: messageCustomer.daysOverdue,
          }}
        />
      )}

      {paymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-3xl p-6 w-full max-w-sm border border-accent/30"
          >
            <h3 className="text-xl font-bold text-white mb-4">Record Payment</h3>
            <p className="text-gray-400 mb-2">{paymentModal.customerName}</p>
            <p className="text-sm text-gray-500 mb-4">
              Remaining: {(paymentModal.total - paymentModal.paidSoFar).toLocaleString()} ETB
            </p>
            <input
              type="number"
              placeholder="Amount paid"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full bg-surface/50 rounded-xl px-4 py-4 text-white text-xl mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPaymentModal(null);
                  setPaymentAmount("");
                }}
                className="flex-1 py-3 rounded-xl bg-surface text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                className="flex-1 py-3 rounded-xl bg-success text-white font-bold"
              >
                Record
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Credit"
        message={`Are you sure you want to delete this credit record for ${deleteTarget?.customerName}?`}
        confirmText="Delete"
        variant="danger"
      />

      <BottomNav />
    </div>
  );
}
