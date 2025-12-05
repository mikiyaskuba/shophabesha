import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, DollarSign, CreditCard, Users, Package, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { icon: FileText, label: 'Reports', path: '/reports', color: 'bg-blue-500' },
    { icon: DollarSign, label: 'Cash Sale', path: '/add', color: 'bg-success' },
    { icon: CreditCard, label: 'Credit Sale', path: '/add?credit=true', color: 'bg-accent' },
    { icon: Users, label: 'Debtors', path: '/customers', color: 'bg-primary' },
    { icon: Package, label: 'Inventory', path: '/inventory', color: 'bg-yellow-500' },
  ];

  return (
    <div className="fixed right-4 bottom-24 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-16 right-0 flex flex-col gap-3"
          >
            {actions.map((action, index) => (
              <motion.button
                key={action.path}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  navigate(action.path);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl ${action.color} shadow-lg hover:scale-105 transition`}
              >
                <action.icon size={20} className="text-white" />
                <span className="text-white font-medium whitespace-nowrap">{action.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent shadow-xl flex items-center justify-center"
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <Plus size={24} className="text-white" />
        )}
      </motion.button>
    </div>
  );
}
