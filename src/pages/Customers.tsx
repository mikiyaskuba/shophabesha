import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";

import BottomNav from "../components/BottomNav";
import { Phone, MessageCircle, Send, Trash2, CheckCircle } from "lucide-react";

interface SaleDoc {
  id: string;
  customer: string;
  phone: string | null;
  amount: number;
  paidAmount?: number;
  isCredit: boolean;
  shopId: string;
}

interface Customer {
  name: string;
  phone: string | null;
  totalCredit: number;
  paidAmount: number;
  docs: SaleDoc[];
}

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  // Phone recovery protection
  useEffect(() => {
    if (!localStorage.getItem("ownerPhone")) navigate("/");
  }, [navigate]);

  useEffect(() => {
    const q = collection(db, "sales");

    const unsub = onSnapshot(q, (snapshot) => {
      const map = new Map<string, Customer>();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as SaleDoc;
        const id = docSnap.id;

        if (
          data.isCredit &&
          data.shopId === (auth.currentUser?.uid || "demo-shop")
        ) {
          const name = data.customer.trim();

          if (!map.has(name)) {
            map.set(name, {
              name,
              phone: data.phone,
              totalCredit: 0,
              paidAmount: 0,
              docs: [],
            });
          }

          const cust = map.get(name)!;

          cust.totalCredit += data.amount;
          cust.paidAmount += data.paidAmount || 0;
          cust.docs.push({ ...data, id });
        }
      });

      // Only show customers who still have remaining balance
      const filtered = Array.from(map.values()).filter(
        (c) => c.totalCredit > c.paidAmount
      );

      setCustomers(filtered);
    });

    return unsub;
  }, []);

  // ------------------------ MARK AS PAID ------------------------
  const markPaid = async (docId: string, paidSoFar: number, total: number) => {
    let remaining = total - paidSoFar;

    const input = prompt(
      `ቀሪ መክፈል ያለበት: ${remaining.toLocaleString()} ብር\n\nያስፈልጋል ዛሬ የተከፈለው መጠን ያስገቡ:`,
      remaining.toString()
    );

    if (!input) return;

    const amount = parseInt(input);
    if (isNaN(amount) || amount <= 0) return alert("ትክክለኛ መጠን ያስገቡ!");

    await updateDoc(doc(db, "sales", docId), {
      paidAmount: (paidSoFar || 0) + amount,
    });
  };

  // ------------------------ DELETE SALE ------------------------
  const deleteSale = async (docId: string) => {
    if (confirm("እርግጠኛ ነህ? ይህን ብድር መሰረዝ ትፈልጋለህ?")) {
      await deleteDoc(doc(db, "sales", docId));
    }
  };

  // ------------------------ PHONE ACTIONS ------------------------
  const call = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const sms = (phone: string, remaining: number) => {
    const msg = `ሰላም! ${remaining.toLocaleString()} ብር ብድር አለብዎት። ቶሎ ይክፈሉን`;
    window.location.href = `sms:${phone}?body=${encodeURIComponent(msg)}`;
  };

  // ------------------------ TELEGRAM ------------------------
  const sendTelegram = (phone: string, remaining: number) => {
    const sanitized = phone.replace(/\D/g, "");

    const message =
      `ሰላም ወንድሜ/ሓብት!\n` +
      `በብድር ${remaining.toLocaleString()} ብር አለብዎት።\n` +
      `እባክዎን ቶሎ ይክፈሉን\n`;

    // Try using phone-number search on Telegram
    window.open(`https://t.me/${sanitized}`, "_blank");

    // Backup message window
    setTimeout(() => {
      window.location.href = `tg://msg?text=${encodeURIComponent(message)}`;
    }, 500);
  };

  // ------------------------------------------------------------
  return (
    <div className="min-h-screen bg-surface p-6 pb-24">
      <h1 className="text-3xl font-bold text-white mb-6">Debtors List</h1>

      <div className="space-y-4">
        {customers.length === 0 ? (
          <p className="text-center text-success text-2xl py-12">
            All credits paid!
          </p>
        ) : (
          customers.map((c) => {
            const remaining = c.totalCredit - c.paidAmount;

            return (
              <div
                key={c.name}
                className="bg-card rounded-2xl p-5 border border-accent/20 shadow-lg"
              >
                {/* HEADER */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xl font-bold text-white">{c.name}</p>
                    {c.phone && (
                      <p className="text-sm text-gray-400">{c.phone}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-danger">
                      {remaining.toLocaleString()} ETB
                    </p>

                    {c.paidAmount > 0 && (
                      <p className="text-success text-sm">
                        Paid: {c.paidAmount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="flex flex-wrap gap-3 justify-end">
                  {c.phone && (
                    <>
                      {/* CALL */}
                      <button
                        onClick={() => call(c.phone!)}
                        className="bg-green-600 p-4 rounded-xl hover:scale-110 transition"
                      >
                        <Phone size={22} className="text-white" />
                      </button>

                      {/* TELEGRAM */}
                      <button
                        onClick={() =>
                          sendTelegram(c.phone!, remaining)
                        }
                        className="bg-blue-600 p-4 rounded-xl hover:scale-110 transition"
                      >
                        <MessageCircle size={22} className="text-white" />
                      </button>

                      {/* SMS */}
                      <button
                        onClick={() => sms(c.phone!, remaining)}
                        className="bg-accent p-4 rounded-xl hover:scale-110 transition"
                      >
                        <Send size={22} className="text-white" />
                      </button>
                    </>
                  )}

                  {/* MARK PAID + DELETE */}
                  {c.docs.map((d) => (
                    <div key={d.id} className="flex gap-2">
                      <button
                        onClick={() =>
                          markPaid(
                            d.id,
                            d.paidAmount || 0,
                            d.amount
                          )
                        }
                        className="bg-success p-4 rounded-xl hover:scale-110 transition"
                      >
                        <CheckCircle size={22} className="text-white" />
                      </button>

                      <button
                        onClick={() => deleteSale(d.id)}
                        className="bg-danger p-4 rounded-xl hover:scale-110 transition"
                      >
                        <Trash2 size={22} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
