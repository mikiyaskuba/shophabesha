// src/pages/Login.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { signInAnonymously } from "firebase/auth";

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto login with Firebase
    signInAnonymously(auth).then(() => {
      // If opened from Telegram, expand it
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }
      navigate("/dashboard");
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="bg-card/90 backdrop-blur-xl rounded-3xl p-12 text-center shadow-2xl border border-accent/30">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-6">
          ShopHabesha Pro
        </h1>
        <p className="text-xl text-gray-300">Loading your shop...</p>
        <div className="mt-8 animate-pulse">
          <div className="h-20 w-20 mx-auto border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}