import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { auth } from "../lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { Store, Phone, Wallet, CreditCard, ArrowRight, Sparkles } from "lucide-react";

export default function Welcome() {
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [telebirr, setTelebirr] = useState("");
  const [cbe, setCbe] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const start = async () => {
    if (!phone.match(/^09\d{8}$/)) {
      alert("Please enter a valid phone number: 09xxxxxxxx");
      return;
    }

    setLoading(true);
    localStorage.setItem("ownerPhone", phone);
    localStorage.setItem("shopName", shopName || "My Shop");
    localStorage.setItem("telebirr", telebirr || phone);
    localStorage.setItem("cbe", cbe || "");

    try {
      await signInAnonymously(auth);
      navigate("/dashboard");
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/90 backdrop-blur-xl rounded-3xl p-8 text-center max-w-md w-full shadow-2xl border border-accent/30"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl"
        >
          <Store size={40} className="text-white" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-2"
        >
          ShopHabesha Pro
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 text-accent mb-6"
        >
          <Sparkles size={16} />
          <span className="text-sm font-medium">Enterprise Edition</span>
          <Sparkles size={16} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-300 mb-8"
        >
          Set up your shop once and manage your business like a pro
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <div className="relative">
            <Phone
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              placeholder="Your phone (09...)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-surface/50 rounded-2xl pl-12 pr-6 py-4 text-white text-lg border border-accent/50 focus:border-accent transition"
            />
          </div>

          <div className="relative">
            <Store
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              placeholder="Shop name (optional)"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full bg-surface/50 rounded-2xl pl-12 pr-6 py-4 text-white text-lg border border-surface/50 focus:border-accent transition"
            />
          </div>

          <div className="relative">
            <Wallet
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500"
            />
            <input
              placeholder="Telebirr number (09...)"
              value={telebirr}
              onChange={(e) => setTelebirr(e.target.value)}
              className="w-full bg-surface/50 rounded-2xl pl-12 pr-6 py-4 text-white text-lg border border-yellow-500/30 focus:border-yellow-500 transition"
            />
          </div>

          <div className="relative">
            <CreditCard
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500"
            />
            <input
              placeholder="CBE account (optional)"
              value={cbe}
              onChange={(e) => setCbe(e.target.value)}
              className="w-full bg-surface/50 rounded-2xl pl-12 pr-6 py-4 text-white text-lg border border-purple-500/30 focus:border-purple-500 transition"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={start}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-accent py-5 rounded-2xl text-white font-bold text-xl shadow-xl flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Start Business
                <ArrowRight size={20} />
              </>
            )}
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-sm text-gray-500 mt-6"
        >
          Your data is safe in the cloud and syncs across devices
        </motion.p>
      </motion.div>
    </div>
  );
}
