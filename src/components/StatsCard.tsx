import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
  };
  delay?: number;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-accent',
  trend,
  delay = 0,
}: StatsCardProps) {
  const isPositive = trend ? trend.value >= 0 : true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', damping: 20 }}
      whileHover={{ scale: 1.02 }}
      className="bg-card rounded-2xl p-5 border border-accent/20 hover:border-accent/40 transition-all shadow-lg hover:shadow-xl"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.1 }}
            className="flex items-baseline gap-2"
          >
            <span className="text-3xl font-bold text-white">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {subtitle && (
              <span className="text-sm text-gray-400">{subtitle}</span>
            )}
          </motion.div>
          
          {trend && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.2 }}
              className="flex items-center gap-1 mt-2"
            >
              {isPositive ? (
                <TrendingUp size={16} className="text-success" />
              ) : (
                <TrendingDown size={16} className="text-danger" />
              )}
              <span className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
                {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">{trend.label}</span>
            </motion.div>
          )}
        </div>
        
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: delay + 0.15, type: 'spring' }}
          className={`p-3 rounded-xl bg-gradient-to-br from-surface to-card ${iconColor}`}
        >
          <Icon size={24} />
        </motion.div>
      </div>
    </motion.div>
  );
}
