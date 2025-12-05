import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BottomNav from "../components/BottomNav";
import { showToast } from "../components/Toast";
import { ConfirmModal } from "../components/Modal";
import {
  Settings as SettingsIcon,
  Phone,
  Store,
  Wallet,
  CreditCard,
  Save,
  LogOut,
  Trash2,
  Shield,
  Bell,
  Moon,
} from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [telebirr, setTelebirr] = useState("");
  const [cbe, setCbe] = useState("");
  const [showLogout, setShowLogout] = useState(false);
  const [showClear, setShowClear] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("ownerPhone")) navigate("/");
  }, [navigate]);

  useEffect(() => {
    setPhone(localStorage.getItem("ownerPhone") || "");
    setShopName(localStorage.getItem("shopName") || "");
    setTelebirr(localStorage.getItem("telebirr") || "");
    setCbe(localStorage.getItem("cbe") || "");
  }, []);

  const save = () => {
    if (!phone.match(/^09\d{8}$/)) {
      showToast("Please enter a valid phone number", "error");
      return;
    }

    localStorage.setItem("ownerPhone", phone);
    localStorage.setItem("shopName", shopName);
    localStorage.setItem("telebirr", telebirr);
    localStorage.setItem("cbe", cbe);

    showToast("Settings saved!", "success");
  };

  const handleLogout = () => {
    localStorage.removeItem("ownerPhone");
    localStorage.removeItem("shopName");
    localStorage.removeItem("telebirr");
    localStorage.removeItem("cbe");
    navigate("/");
  };

  const handleClearData = () => {
    localStorage.clear();
    showToast("Local data cleared", "success");
    navigate("/");
  };

  const settingsGroups = [
    {
      title: "Shop Information",
      items: [
        {
          icon: Phone,
          label: "Owner Phone",
          value: phone,
          onChange: setPhone,
          placeholder: "09xxxxxxxx",
          color: "text-accent",
        },
        {
          icon: Store,
          label: "Shop Name",
          value: shopName,
          onChange: setShopName,
          placeholder: "My Shop",
          color: "text-primary",
        },
      ],
    },
    {
      title: "Payment Accounts",
      items: [
        {
          icon: Wallet,
          label: "Telebirr Number",
          value: telebirr,
          onChange: setTelebirr,
          placeholder: "09xxxxxxxx",
          color: "text-yellow-500",
        },
        {
          icon: CreditCard,
          label: "CBE Account",
          value: cbe,
          onChange: setCbe,
          placeholder: "Account number",
          color: "text-purple-500",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-surface p-4 pb-28">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-accent">
          <SettingsIcon size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm">Manage your shop configuration</p>
        </div>
      </div>

      <div className="space-y-6">
        {settingsGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="bg-card rounded-2xl p-5 border border-accent/20"
          >
            <h2 className="text-lg font-bold text-white mb-4">{group.title}</h2>
            <div className="space-y-4">
              {group.items.map((item) => (
                <div key={item.label}>
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <item.icon size={16} className={item.color} />
                    {item.label}
                  </label>
                  <input
                    value={item.value}
                    onChange={(e) => item.onChange(e.target.value)}
                    placeholder={item.placeholder}
                    className="w-full bg-surface/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 border border-accent/20 focus:border-accent/50 transition"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-5 border border-accent/20"
        >
          <h2 className="text-lg font-bold text-white mb-4">Preferences</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-surface/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-accent" />
                <span className="text-white">Notifications</span>
              </div>
              <div className="w-12 h-6 bg-accent rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Moon size={20} className="text-primary" />
                <span className="text-white">Dark Mode</span>
              </div>
              <div className="w-12 h-6 bg-accent rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-success" />
                <span className="text-white">Auto Backup</span>
              </div>
              <div className="w-12 h-6 bg-accent rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={save}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-lg flex items-center justify-center gap-2 shadow-xl"
        >
          <Save size={20} />
          Save Settings
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-5 border border-danger/20"
        >
          <h2 className="text-lg font-bold text-white mb-4">Danger Zone</h2>
          <div className="space-y-3">
            <button
              onClick={() => setShowLogout(true)}
              className="w-full flex items-center justify-between p-4 bg-surface/50 rounded-xl hover:bg-surface transition"
            >
              <div className="flex items-center gap-3">
                <LogOut size={20} className="text-yellow-500" />
                <span className="text-white">Log Out</span>
              </div>
            </button>
            <button
              onClick={() => setShowClear(true)}
              className="w-full flex items-center justify-between p-4 bg-surface/50 rounded-xl hover:bg-danger/20 transition"
            >
              <div className="flex items-center gap-3">
                <Trash2 size={20} className="text-danger" />
                <span className="text-danger">Clear All Local Data</span>
              </div>
            </button>
          </div>
        </motion.div>

        <p className="text-center text-gray-500 text-sm pb-4">
          ShopHabesha Pro v2.0 | Enterprise Edition
        </p>
      </div>

      <ConfirmModal
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
        title="Log Out"
        message="Are you sure you want to log out? You'll need to enter your phone number again."
        confirmText="Log Out"
        variant="warning"
      />

      <ConfirmModal
        isOpen={showClear}
        onClose={() => setShowClear(false)}
        onConfirm={handleClearData}
        title="Clear Data"
        message="This will clear all local data including your settings. Your cloud data will remain safe."
        confirmText="Clear Data"
        variant="danger"
      />

      <BottomNav />
    </div>
  );
}
