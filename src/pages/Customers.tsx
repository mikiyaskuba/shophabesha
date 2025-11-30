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
import {
  Phone,
  MessageCircle,
  Send,
  Trash2,
  CheckCircle,
} from "lucide-react";

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

  // Phone recovery protection — ensure shop owner info exists
  useEffect(() => {
    if (!localStorage.getItem("ownerPhone")) navigate("/");
  }, [navigate]);

  // Load customers (debtor aggregation)
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
          const name = (data.customer || "Unknown").toString().trim();

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

          cust.totalCredit += Number(data.amount || 0);
          cust.paidAmount += Number(data.paidAmount || 0);
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
    const remaining = total - (paidSoFar || 0);

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

  // ------------------------ HELPERS: read owner accounts ------------------------
  const getOwnerInfo = () => {
    const telebirr = localStorage.getItem("telebirr") || "";
    const cbe = localStorage.getItem("cbe") || "";
    const other = localStorage.getItem("otherAccount") || "";
    const shopName = localStorage.getItem("shopName") || "የሱቅ ስም";
    const ownerPhone = localStorage.getItem("ownerPhone") || "";
    return { telebirr, cbe, other, shopName, ownerPhone };
  };

  // ------------------------ SMS (works on Android & iPhone via fallback) ------------------------
  const sms = (phone: string, remaining: number) => {
    const { telebirr, cbe, other, shopName } = getOwnerInfo();

    const lines = [
      `ሰላም ${phone}!`,
      `በብድር ${remaining.toLocaleString()} ብር አለብዎት።`,
      ``,
      `💳 የመክፈያ መረጃ (${shopName}):`,
      telebirr ? `• ቴሌብር: ${telebirr}` : "",
      cbe ? `• CBE: ${cbe}` : "",
      other ? `• ከፍተኛ አካውንት: ${other}` : "",
      ``,
      "እባክዎን ቶሎ ይክፈሉን።",
    ]
      .filter(Boolean)
      .join("\n");

    const encoded = encodeURIComponent(lines);

    // Android format (works on many Android devices/browsers)
    const android = `sms:${phone}?body=${encoded}`;

    // iPhone format (some iOS Safari expect &body=)
    const iphone = `sms:${phone}&body=${encoded}`;

    // Use window.location (primary) and a short fallback
    // First try android-format
    window.location.href = android;

    // Fallback to iPhone-style after small delay
    setTimeout(() => {
      window.location.href = iphone;
    }, 300);
  };

  // ------------------------ TELEGRAM (open composer with prefilled text) ------------------------
  const sendTelegram = (_phone: string, remaining: number) => {
    const { telebirr, cbe, other, shopName } = getOwnerInfo();

    const lines = [
      `ሰላም!`,
      `በብድር ${remaining.toLocaleString()} ብር አለብዎት።`,
      ``,
      `💳 የመክፈያ መረጃ (${shopName}):`,
      telebirr ? `• ቴሌብር: ${telebirr}` : "",
      cbe ? `• CBE: ${cbe}` : "",
      other ? `• ከፍተኛ አካውንት: ${other}` : "",
      ``,
      "እባክዎን ቶሎ ይክፈሉን።",
    ]
      .filter(Boolean)
      .join("\n");

    const encoded = encodeURIComponent(lines);

    // 1) Try Telegram native composer (deep link) — opens Telegram app if installed
    const tgDeep = `tg://msg?text=${encoded}`;

    // 2) Web fallback — opens Telegram web share (user picks contact)
    const tgWeb = `https://t.me/share/url?url=&text=${encoded}`;

    // Try deep link first
    window.location.href = tgDeep;

    // Then fallback to web share if deep link didn't open (short timeout)
    setTimeout(() => {
      window.open(tgWeb, "_blank");
    }, 400);
  };

  // ------------------------ UI ------------------------
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
                        className="relative group bg-green-600 p-4 rounded-xl hover:scale-110 transition"
                        title="Call"
                      >
                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                          Call
                        </span>
                        <Phone size={22} className="text-white" />
                      </button>

                      {/* TELEGRAM (share payment accounts) */}
                      <button
                        onClick={() => sendTelegram(c.phone!, remaining)}
                        className="relative group bg-blue-600 p-4 rounded-xl hover:scale-110 transition"
                        title="Send payment accounts via Telegram"
                      >
                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                          Telegram (Share accounts)
                        </span>
                        <MessageCircle size={22} className="text-white" />
                      </button>

                      {/* SMS (share payment accounts) */}
                      <button
                        onClick={() => sms(c.phone!, remaining)}
                        className="relative group bg-accent p-4 rounded-xl hover:scale-110 transition"
                        title="Send payment accounts via SMS"
                      >
                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                          SMS (Share accounts)
                        </span>
                        <Send size={22} className="text-white" />
                      </button>
                    </>
                  )}

                  {/* MARK PAID + DELETE */}
                  {c.docs.map((d) => (
                    <div key={d.id} className="flex gap-2">
                      <button
                        onClick={() =>
                          markPaid(d.id, d.paidAmount || 0, d.amount)
                        }
                        className="relative group bg-success p-4 rounded-xl hover:scale-110 transition"
                        title="Mark partial/full paid"
                      >
                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                          Mark Paid
                        </span>
                        <CheckCircle size={22} className="text-white" />
                      </button>

                      <button
                        onClick={() => deleteSale(d.id)}
                        className="relative group bg-danger p-4 rounded-xl hover:scale-110 transition"
                        title="Delete this credit entry"
                      >
                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                          Delete
                        </span>
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

// Helper call function placed after component to keep file compact
function call(phone: string) {
  window.location.href = `tel:${phone}`;
}
