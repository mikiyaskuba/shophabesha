import { Home, PlusCircle, Users, CreditCard } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: PlusCircle, label: "Add", path: "/add" },
    { icon: Users, label: "Customers", path: "/customers" },
    { icon: CreditCard, label: "Credit", path: "/credits" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-accent/20">
      <div className="grid grid-cols-4 py-2">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center py-3 ${
              location.pathname === tab.path ? "text-accent" : "text-gray-500"
            }`}
          >
            <tab.icon size={28} />
            <span className="text-xs mt-1">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}