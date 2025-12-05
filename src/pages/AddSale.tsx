import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import BottomNav from "../components/BottomNav";
import { showToast } from "../components/Toast";
import {
  User,
  Phone,
  DollarSign,
  CreditCard,
  Check,
  Banknote,
  Sparkles,
} from "lucide-react";

export default function AddSale() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultCredit = searchParams.get("credit") === "true";

  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [isCredit, setIsCredit] = useState(defaultCredit);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const savedPhone = localStorage.getItem("ownerPhone");
    if (!savedPhone) {
      navigate("/");
    }
  }, [navigate]);

  const quickAmounts = [50, 100, 200, 500, 1000];

  const handleSave = async () => {
    if (!customer || !amount || saving) return;
    
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    setSaving(true);

    const sale = {
      customer,
      phone: phone || null,
      amount: amountNum,
      isCredit,
      timestamp: serverTimestamp(),
      shopId: auth.currentUser?.uid || "demo-shop",
    };

    try {
      await addDoc(collection(db, "sales"), sale);
      setSuccess(true);
      showToast(
        isCredit ? "Credit sale recorded!" : "Cash sale recorded!",
        "success"
      );
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch {
      const localSales = JSON.parse(
        localStorage.getItem("pendingSales") || "[]"
      );
      localSales.push(sale);
      localStorage.setItem("pendingSales", JSON.stringify(localSales));
      showToast("Saved offline - will sync when online", "warning");
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-success flex items-center justify-center"
          >
            <Check size={48} className="text-white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Sale Recorded!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-400"
          >
            {isCredit ? "Credit" : "Cash"} sale of {Number(amount).toLocaleString()} ETB
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-4 pb-28">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-accent">
          <Sparkles size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">New Sale</h1>
          <p className="text-gray-400 text-sm">Record a new transaction</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-3xl p-6 border border-accent/20 space-y-5"
      >
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <User size={16} className="text-accent" />
            Customer Name *
          </label>
          <input
            type="text"
            placeholder="Enter customer name"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="w-full bg-surface/50 rounded-2xl px-5 py-4 text-white placeholder-gray-500 text-lg border border-accent/20 focus:border-accent/50 transition"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Phone size={16} className="text-primary" />
            Phone Number (for reminders)
          </label>
          <input
            type="tel"
            placeholder="09xxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-surface/50 rounded-2xl px-5 py-4 text-white placeholder-gray-500 text-lg border border-accent/20 focus:border-accent/50 transition"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <DollarSign size={16} className="text-success" />
            Amount (ETB) *
          </label>
          <input
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-surface/50 rounded-2xl px-5 py-4 text-white placeholder-gray-500 text-3xl font-bold text-center border border-accent/20 focus:border-accent/50 transition"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {quickAmounts.map((amt) => (
              <motion.button
                key={amt}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAmount(amt.toString())}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  amount === amt.toString()
                    ? "bg-accent text-white"
                    : "bg-surface/50 text-gray-400 hover:text-white"
                }`}
              >
                {amt}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-3 block">
            Payment Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCredit(false)}
              className={`p-4 rounded-2xl border-2 transition flex flex-col items-center gap-2 ${
                !isCredit
                  ? "border-success bg-success/10"
                  : "border-surface bg-surface/50"
              }`}
            >
              <Banknote
                size={32}
                className={!isCredit ? "text-success" : "text-gray-400"}
              />
              <span
                className={`font-medium ${
                  !isCredit ? "text-success" : "text-gray-400"
                }`}
              >
                Cash
              </span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCredit(true)}
              className={`p-4 rounded-2xl border-2 transition flex flex-col items-center gap-2 ${
                isCredit
                  ? "border-accent bg-accent/10"
                  : "border-surface bg-surface/50"
              }`}
            >
              <CreditCard
                size={32}
                className={isCredit ? "text-accent" : "text-gray-400"}
              />
              <span
                className={`font-medium ${
                  isCredit ? "text-accent" : "text-gray-400"
                }`}
              >
                Credit
              </span>
            </motion.button>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving || !customer || !amount}
          className={`w-full py-5 rounded-2xl font-bold text-xl shadow-xl flex items-center justify-center gap-2 transition ${
            isCredit
              ? "bg-gradient-to-r from-primary to-accent"
              : "bg-gradient-to-r from-success to-emerald-500"
          } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {saving ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check size={24} />
              Save {isCredit ? "Credit" : "Cash"} Sale
            </>
          )}
        </motion.button>
      </motion.div>

      <BottomNav />
    </div>
  );
}
