// src/pages/Settings.tsx
import { useState, useEffect } from "react";
import BottomNav from "../components/BottomNav";

export default function Settings() {
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [telebirr, setTelebirr] = useState("");
  const [cbe, setCbe] = useState("");

  useEffect(() => {
    setPhone(localStorage.getItem("ownerPhone") || "");
    setShopName(localStorage.getItem("shopName") || "");
    setTelebirr(localStorage.getItem("telebirr") || "");
    setCbe(localStorage.getItem("cbe") || "");
  }, []);

  const save = () => {
    if (!phone.match(/^09\d{8}$/)) {
      alert("ትክክለኛ ስልክ ቁጥር ያስገቡ: 09xxxxxxxx");
      return;
    }

    localStorage.setItem("ownerPhone", phone);
    localStorage.setItem("shopName", shopName);
    localStorage.setItem("telebirr", telebirr);
    localStorage.setItem("cbe", cbe);

    alert("ዳታ ተሻሽሏል!");
  };

  return (
    <div className="min-h-screen bg-surface p-9">
      <h1 className="text-4xl font-bold text-center mb-6">⚙️ ማስተካከያ</h1>

      <div className="max-w-lg mx-auto bg-card/40 p-6 rounded-3xl shadow-xl">
        <label className="block mb-3 text-lg">የባለቤት ስልክ</label>
        <input
          className="w-full bg-surface/50 p-4 rounded-2xl mb-4"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <label className="block mb-3 text-lg">ሱቅ ስም</label>
        <input
          className="w-full bg-surface/50 p-4 rounded-2xl mb-4"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
        />

        <label className="block mb-3 text-lg">ቴሌብር ቁጥር</label>
        <input
          className="w-full bg-surface/50 p-4 rounded-2xl mb-4"
          value={telebirr}
          onChange={(e) => setTelebirr(e.target.value)}
        />

        <label className="block mb-3 text-lg">CBE ቁጥር</label>
        <input
          className="w-full bg-surface/50 p-4 rounded-2xl mb-6"
          value={cbe}
          onChange={(e) => setCbe(e.target.value)}
        />

        <button
          onClick={save}
          className="w-full bg-primary text-white py-4 rounded-2xl text-xl"
        >
          💾 መረጃ ያድሱ
        </button>
      </div>
      <BottomNav />

    </div>
  );
}
