// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { db, auth } from "../lib/firebase";
// import { collection, addDoc, serverTimestamp } from "firebase/firestore";
// import BottomNav from "../components/BottomNav";

// export default function AddSale() {
//   const navigate = useNavigate();
//   const [customer, setCustomer] = useState("");
//   const [amount, setAmount] = useState("");
//   const [isCredit, setIsCredit] = useState(false);
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     const pending = localStorage.getItem("pendingSales");
//     if (pending) {
//       JSON.parse(pending).forEach(async (sale: any) => {
//         await addDoc(collection(db, "sales"), { ...sale, shopId: auth.currentUser?.uid || "demo-shop" });
//       });
//       localStorage.removeItem("pendingSales");
//     }
//   }, []);

//   const handleSave = async () => {
//     if (!customer || !amount || saving) return;
//     setSaving(true);

//     const sale = {
//       customer,
//       amount: Number(amount),
//       isCredit,
//       timestamp: serverTimestamp(),
//       shopId: auth.currentUser?.uid || "demo-shop"
//     };

//     try {
//       await addDoc(collection(db, "sales"), sale);
//       console.log("Sale saved to Firebase!");
//     } catch (e) {
//       const localSales = JSON.parse(localStorage.getItem("pendingSales") || "[]");
//       localSales.push(sale);
//       localStorage.setItem("pendingSales", JSON.stringify(localSales));
//     }

//     setSaving(false);
//     navigate("/dashboard");
//   };

//   return (
//     <div className="min-h-screen bg-surface p-6 pb-24">
//       <h1 className="text-3xl font-bold text-white mb-8">Add New Sale</h1>

//       <div className="bg-card rounded-3xl p-8 space-y-6 border border-accent/20">
//         <input
//           type="text"
//           placeholder="Customer name"
//           value={customer}
//           onChange={(e) => setCustomer(e.target.value)}
//           className="w-full bg-surface/50 rounded-2xl px-6 py-5 text-white placeholder-gray-400 text-xl"
//         />

//         <input
//           type="number"
//           placeholder="Amount in ETB"
//           value={amount}
//           onChange={(e) => setAmount(e.target.value)}
//           className="w-full bg-surface/50 rounded-2xl px-6 py-5 text-white placeholder-gray-400 text-xl"
//         />

//         <label className="flex items-center gap-4 text-xl">
//           <input type="checkbox" checked={isCredit} onChange={(e) => setIsCredit(e.target.checked)} className="w-8 h-8 accent-accent" />
//           <span className="text-white">Credit sale (biddir)</span>
//         </label>

//         <button
//           onClick={handleSave}
//           disabled={saving}
//           className="w-full bg-gradient-to-r from-primary to-accent py-6 rounded-2xl text-white font-bold text-2xl shadow-xl hover:scale-105 transition-transform disabled:opacity-70"
//         >
//           {saving ? "Saving..." : "Save Sale"}
//         </button>
//       </div>
//       <BottomNav />
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import BottomNav from "../components/BottomNav";

export default function AddSale() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");  // ← NEW
  const [amount, setAmount] = useState("");
  const [isCredit, setIsCredit] = useState(false);
  const [saving, setSaving] = useState(false);

  // ... (offline sync useEffect stays the same)

  const handleSave = async () => {
    if (!customer || !amount || saving) return;
    setSaving(true);

    const sale = {
      customer,
      phone: phone || null,  // ← SAVE PHONE
      amount: Number(amount),
      isCredit,
      timestamp: serverTimestamp(),
      shopId: auth.currentUser?.uid || "demo-shop"
    };

    try {
      await addDoc(collection(db, "sales"), sale);
    } catch (e) {
      const localSales = JSON.parse(localStorage.getItem("pendingSales") || "[]");
      localSales.push(sale);
      localStorage.setItem("pendingSales", JSON.stringify(localSales));
    }

    setSaving(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-surface p-6 pb-24">
      <h1 className="text-3xl font-bold text-white mb-8">Add New Sale</h1>

      <div className="bg-card rounded-3xl p-8 space-y-6 border border-accent/20">
        <input
          type="text"
          placeholder="Customer name *"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          className="w-full bg-surface/50 rounded-2xl px-6 py-5 text-white placeholder-gray-400 text-xl"
        />

        <input
          type="tel"
          placeholder="Phone number (09xxxxxxxx)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full bg-surface/50 rounded-2xl px-6 py-5 text-white placeholder-gray-400 text-xl"
        />

        <input
          type="number"
          placeholder="Amount in ETB *"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-surface/50 rounded-2xl px-6 py-5 text-white placeholder-gray-400 text-xl"
        />

        <label className="flex items-center gap-4 text-xl">
          <input type="checkbox" checked={isCredit} onChange={(e) => setIsCredit(e.target.checked)} className="w-8 h-8 accent-accent" />
          <span className="text-white">Credit sale (biddir)</span>
        </label>

        <button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-primary to-accent py-6 rounded-2xl text-white font-bold text-2xl shadow-xl hover:scale-105 transition-transform disabled:opacity-70">
          {saving ? "Saving..." : "Save Sale"}
        </button>
      </div>
      <BottomNav />
    </div>
  );
}