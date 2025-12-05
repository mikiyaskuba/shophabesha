import { motion } from "framer-motion";
import { Home, PlusCircle, Users, Package, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: PlusCircle, label: "Sale", path: "/add" },
    { icon: Users, label: "Debtors", path: "/customers" },
    { icon: Package, label: "Stock", path: "/inventory" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-accent/20 safe-area-pb"
    >
      <div className="grid grid-cols-5 py-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <motion.button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              whileTap={{ scale: 0.9 }}
              className={`flex flex-col items-center py-2 px-1 relative ${
                isActive ? "text-accent" : "text-gray-500"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-accent rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <tab.icon size={24} />
              </motion.div>
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-accent' : ''}`}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
