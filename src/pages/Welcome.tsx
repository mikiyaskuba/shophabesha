// src/pages/Welcome.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { signInAnonymously } from "firebase/auth";

export default function Welcome() {
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [telebirr, setTelebirr] = useState("");
  const [cbe, setCbe] = useState("");
  const navigate = useNavigate();

  const start = () => {
    if (!phone.match(/^09\d{8}$/)) {
      alert("ትክክለኛ ስልክ ቁጥር ያስገቡ: 09xxxxxxxx");
      return;
    }

    localStorage.setItem("ownerPhone", phone);
    localStorage.setItem("shopName", shopName || "My Shop");
    localStorage.setItem("telebirr", telebirr || phone); // fallback to owner phone
    localStorage.setItem("cbe", cbe || "");

    signInAnonymously(auth).then(() => {
      navigate("/dashboard");
    });
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="bg-card/90 backdrop-blur-xl rounded-3xl p-10 text-center max-w-md w-full shadow-2xl border border-accent/30">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-8">
          ShopHabesha Pro
        </h1>

        <p className="text-xl text-gray-300 mb-6">ሱቅዎን ያዋቅሩ (አንድ ጊዜ ብቻ)</p>

        <input
          placeholder="የእርስዎ ስልክ (09...)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full bg-surface/50 rounded-2xl px-6 py-5 text-white text-center text-xl mb-4 border border-accent/50"
        />

        <input
          placeholder="ሱቅዎ ስም (አማራጭ)"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          className="w-full bg-surface/50 rounded-2xl px-6 py-5 text-white text-center text-xl mb-4"
        />

        <input
          placeholder="ቴሌብር ቁጥር (09...)"
          value={telebirr}
          onChange={(e) => setTelebirr(e.target.value)}
          className="w-full bg-surface/50 rounded-2xl px-6 py-5 text-white text-center text-xl mb-4 border border-yellow-500/50"
        />

        <input
          placeholder="CBE ብር መለያ (አማራጭ)"
          value={cbe}
          onChange={(e) => setCbe(e.target.value)}
          className="w-full bg-surface/50 rounded-2xl px-6 py-5 text-white text-center text-xl mb-8 border border-purple-500/50"
        />

        <button
          onClick={start}
          className="w-full bg-gradient-to-r from-primary to-accent py-6 rounded-2xl text-white font-bold text-2xl shadow-xl hover:scale-105 transition"
        >
          ይጀምሩ → ገንዘብ ይሰብስቡ
        </button>

        <p className="text-sm text-gray-400 mt-6">
          ስልክ ቢጠፋም ዳታዎ ደህና ነው • በቴሌብር በቀጥታ ይክፈሉ
        </p>
      </div>
    </div>
  );
}