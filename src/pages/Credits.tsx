import { useEffect, useState } from "react";
import { collection, onSnapshot, where } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { format } from "date-fns";
import BottomNav from "../components/BottomNav";

interface Sale {
  id: string;
  customer: string;
  amount: number;
  timestamp: any;
  isCredit: boolean;        // ← ADD
  shopId: string;
}

export default function Credits() {
  const [credits, setCredits] = useState<Sale[]>([]);

  useEffect(() => {
    const q = collection(db, "sales");
    onSnapshot(q, (snapshot) => {
      const data: Sale[] = [];
      snapshot.forEach((doc) => {
        const sale = doc.data() as Sale;
        if (sale.isCredit && sale.shopId ===( auth.currentUser?.uid || "demo-shop")) {
          data.push({ ...sale, id: doc.id });
        }
      });
      setCredits(data.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds));
    });
  }, []);

  return (
    <div className="min-h-screen bg-surface p-6 pb-24">
      <h1 className="text-3xl font-bold text-white mb-6">Credit Tracker</h1>

      <div className="space-y-4">
        {credits.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No credits yet</p>
        ) : (
          credits.map((c) => {
            const daysAgo = Math.floor((Date.now() - c.timestamp.toDate().getTime()) / (1000*60*60*24));
            return (
              <div key={c.id} className={`bg-card rounded-2xl p-5 border ${daysAgo > 7 ? 'border-danger' : 'border-accent/20'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xl font-bold text-white">{c.customer}</p>
                    <p className="text-gray-400">{format(c.timestamp.toDate(), "dd MMM yyyy")}</p>
                  </div>
                  <p className={`text-2xl font-bold ${daysAgo > 7 ? 'text-danger' : 'text-white'}`}>
                    {c.amount.toLocaleString()} ETB
                  </p>
                </div>
                {daysAgo > 7 && <p className="text-danger mt-2">Overdue {daysAgo} days!</p>}
              </div>
            );
          })
        )}
      </div>
      <BottomNav />
    </div>
  );
}