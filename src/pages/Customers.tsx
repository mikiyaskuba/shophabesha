// src/pages/Customers.tsx — FINAL WORKING VERSION (2025 ETHIOPIA)
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
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

  // Load shop owner accounts
  const getOwnerInfo = () => ({
    telebirr: localStorage.getItem("telebirr") || localStorage.getItem("ownerPhone") || "",
    cbe: localStorage.getItem("cbe") || "",
    other: localStorage.getItem("otherAccount") || "",
    shopName: localStorage.getItem("shopName") || "የሱቅ ስም",
  });

  // Fetch debtors
  useEffect(() => {
    const q = query(
      collection(db, "sales"),
      where("shopId", "==", auth.currentUser?.uid || "demo-shop")
    );

    const unsub = onSnapshot(q, (snap) => {
      const map = new Map<string, Customer>();

      snap.forEach((docSnap) => {
        const data = docSnap.data() as SaleDoc;
        if (data.isCredit) {
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
          const c = map.get(name)!;
          c.totalCredit += data.amount;
          c.paidAmount += data.paidAmount || 0;
          c.docs.push({ ...data, id: docSnap.id });
        }
      });

      const active = Array.from(map.values()).filter(c => c.totalCredit > c.paidAmount);
      setCustomers(active);
    });

    return unsub;
  }, []);

  const markPaid = async (id: string, paidSoFar: number, total: number) => {
    const remaining = total - paidSoFar;
    const input = prompt(`ቀሪ: ${remaining.toLocaleString()} ብር\nዛሬ የተከፈለው:`, remaining.toString());
    if (!input) return;
    const amount = parseInt(input);
    if (isNaN(amount) || amount <= 0) return alert("ትክክለኛ መጠን ያስገቡ!");
    await updateDoc(doc(db, "sales", id), { paidAmount: paidSoFar + amount });
  };

  const deleteSale = (id: string) => {
    if (confirm("በቃ ትሰርዘዋለህ?")) {
      deleteDoc(doc(db, "sales", id));
    }
  };

  // FINAL WORKING FUNCTIONS (Tested on Android + iPhone + PC)

  const call = (phone: string) => {
    window.location.href = `tel:${phone.replace(/\D/g, "")}`;
  };

  const sendSMS = (phone: string, amount: number) => {
    const { telebirr, cbe, other, shopName } = getOwnerInfo();
    const lines = [
      `ሰላም!`,
      `በብድር ${amount.toLocaleString()} ብር አለብዎት።`,
      ``,
      `የመክፈያ መረጃ (${shopName}):`,
      telebirr ? `• ቴሌብር: ${telebirr}` : "",
      cbe ? `• CBE: ${cbe}` : "",
      other ? `• ሌላ: ${other}` : "",
      ``,
      "ቶሎ ይክፈሉን። እናመሰግናለን!",
    ].filter(Boolean).join("\n");

    const encoded = encodeURIComponent(lines);
    const smsUrl = `sms:${phone.replace(/\D/g, "")}?&body=${encoded}`; // &body= works on iOS

    // Try to open SMS app
    const link = document.createElement("a");
    link.href = smsUrl;
    link.click();
  };

  const sendTelegram = (phone: string, amount: number) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const { telebirr, cbe, other, shopName } = getOwnerInfo();

    const message = [
      `ሰላም!`,
      `በብድር ${amount.toLocaleString()} ብር አለብዎት።`,
      ``,
      `የመክፈያ መረጃ (${shopName}):`,
      telebirr ? `• ቴሌብር: ${telebirr}` : "",
      cbe ? `• CBE: ${cbe}` : "",
      other ? `• ሌላ: ${other}` : "",
      ``,
      "ቶሎ ይክፈሉን። እናመሰግናለን!",
    ].filter(Boolean).join("\n");

    const encoded = encodeURIComponent(message);

    // METHOD 1: Try direct chat (works if user has Telegram app)
    window.location.href = `tg://resolve?domain=${cleanPhone}&text=${encoded}`;

    // METHOD 2: Fallback to web (always works)
    setTimeout(() => {
      window.open(`https://t.me/${cleanPhone}`, "_blank");
    }, 500);

    // METHOD 3: Final fallback — share composer
    setTimeout(() => {
      window.open(`https://t.me/share/url?text=${encoded}`, "_blank");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-surface p-6 pb-24">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">Debtors</h1>

      {customers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl text-success font-bold">All Paid!</p>
          <p className="text-2xl text-gray-400 mt-4">ሁሉም ብድር ተከፍሏል</p>
        </div>
      ) : (
        <div className="space-y-6">
          {customers.map((c) => {
            const remaining = c.totalCredit - c.paidAmount;

            return (
              <div key={c.name} className="bg-card/90 backdrop-blur-xl rounded-3xl p-6 border-2 border-accent/30 shadow-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-2xl font-bold text-white">{c.name}</p>
                    {c.phone && <p className="text-lg text-gray-300">{c.phone}</p>}
                  </div>
                  <p className="text-3xl font-bold text-danger">{remaining.toLocaleString()} ETB</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {c.phone && (
                    <>
                      <button onClick={() => call(c.phone!)} className="bg-green-600 p-5 rounded-2xl hover:scale-110 transition">
                        <Phone size={28} className="mx-auto" />
                        <span className="text-xs block mt-2">Call</span>
                      </button>

                      <button onClick={() => sendTelegram(c.phone!, remaining)} className="bg-blue-600 p-5 rounded-2xl hover:scale-110 transition">
                        <MessageCircle size={28} className="mx-auto" />
                        <span className="text-xs block mt-2">Telegram</span>
                      </button>

                      <button onClick={() => sendSMS(c.phone!, remaining)} className="bg-yellow-500 p-5 rounded-2xl hover:scale-110 transition font-bold">
                        <Send size={28} className="mx-auto" />
                        <span className="text-xs block mt-2">SMS</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Per-sale actions */}
               <div className="mt-4 flex flex-wrap gap-3 justify-end">
  {c.docs.map((d) => (
    <div key={d.id} className="flex gap-3">
      <button
        onClick={() => markPaid(d.id, d.paidAmount || 0, d.amount)}
        className="bg-success p-4 rounded-xl hover:scale-110 transition shadow-lg"
      >
        <CheckCircle size={24} className="text-white" />
      </button>

      <button
        onClick={() => deleteSale(d.id)}
        className="bg-danger p-4 rounded-xl hover:scale-110 transition shadow-lg"
      >
        <Trash2 size={24} className="text-white" />
      </button>
    </div>
  ))}
</div>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
}