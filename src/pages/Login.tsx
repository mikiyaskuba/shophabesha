import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { signInAnonymously } from "firebase/auth";

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // Safe Telegram init
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }

    // Always login with Firebase (anonymous)
    signInAnonymously(auth)
      .then(() => {
        console.log("Logged in with Firebase");
        navigate("/dashboard");
      })
      .catch((err) => console.error("Firebase login error:", err));
  }, [navigate]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="bg-card rounded-3xl p-10 text-center max-w-sm w-full shadow-2xl border border-accent/20">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
          ShopHabesha Pro
        </h1>
        <p className="text-gray-300 mb-8">Loading your shop...</p>
        <div className="animate-pulse">
          <div className="h-16 w-16 mx-auto border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}