import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
}

export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
  const baseClasses = 'bg-gradient-to-r from-card via-surface to-card animate-pulse';
  
  const variantClasses = {
    text: 'h-4 rounded-lg',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
    card: 'rounded-2xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-5 border border-accent/20">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-32 h-5" />
          <Skeleton variant="text" className="w-24 h-4" />
        </div>
        <Skeleton variant="rectangular" className="w-20 h-8" />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="rectangular" className="w-12 h-12" />
        <Skeleton variant="rectangular" className="w-12 h-12" />
        <Skeleton variant="rectangular" className="w-12 h-12" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-2xl p-5 border border-accent/20">
            <Skeleton variant="text" className="w-24 h-4 mb-3" />
            <Skeleton variant="text" className="w-32 h-8 mb-2" />
            <Skeleton variant="text" className="w-20 h-3" />
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-accent/20">
          <Skeleton variant="text" className="w-40 h-5 mb-4" />
          <Skeleton variant="rectangular" className="w-full h-48" />
        </div>
        <div className="bg-card rounded-2xl p-5 border border-accent/20">
          <Skeleton variant="text" className="w-32 h-5 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rectangular" className="w-full h-16" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
