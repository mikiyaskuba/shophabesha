// src/pages/Credits.tsx — FINAL CORRECTED VERSION
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { format } from "date-fns";
import BottomNav from "../components/BottomNav";

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

  // PHONE RECOVERY PROTECTION
  useEffect(() => {
    const savedPhone = localStorage.getItem("ownerPhone");
    if (!savedPhone) {
      navigate("/");
    }
  }, [navigate]);

  // FETCH CREDITS
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

      // Sort newest first
      data.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.()?.getTime() || 0;
        const timeB = b.timestamp?.toDate?.()?.getTime() || 0;
        return timeB - timeA;
      });

      setCredits(data);
    });

    return unsub;
  }, []);

  return (
    <div className="min-h-screen bg-surface p-6 pb-24">
      <h1 className="text-3xl font-bold text-white mb-6">Credit Tracker</h1>

      <div className="space-y-4">
        {credits.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl text-success mb-4">All credits paid!</p>
            <p className="text-gray-400">No outstanding debts</p>
          </div>
        ) : (
          credits.map((c) => {
            const saleDate = c.timestamp?.toDate?.() || new Date();
            const daysAgo = Math.floor((Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysAgo > 7;

            return (
              <div
                key={c.id}
                className={`bg-card rounded-2xl p-5 border-2 transition-all ${
                  isOverdue
                    ? "border-danger/80 bg-danger/5 shadow-lg shadow-danger/20"
                    : "border-accent/20"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xl font-bold text-white">{c.customer}</p>
                    <p className="text-sm text-gray-400">
                      {format(saleDate, "dd MMM yyyy")}
                      {daysAgo > 0 && ` • ${daysAgo} ${daysAgo === 1 ? "day" : "days"} ago`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${isOverdue ? "text-danger" : "text-white"}`}>
                      {c.amount.toLocaleString()} ETB
                    </p>
                    {c.paidAmount && c.paidAmount > 0 && (
                      <p className="text-success text-sm">Paid: {c.paidAmount.toLocaleString()}</p>
                    )}
                  </div>
                </div>

                {isOverdue && (
                  <div className="mt-3 p-3 bg-danger/10 rounded-xl border border-danger/50">
                    <p className="text-danger font-bold text-lg">
                      Overdue {daysAgo} days!
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}