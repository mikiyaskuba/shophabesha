import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import AddSale from "./pages/AddSale";
import Customers from "./pages/Customers";
import Credits from "./pages/Credits";
import Settings from "./pages/Settings";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";

function App() {
  const ownerPhone = localStorage.getItem("ownerPhone");

  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-surface">
          <Routes>
            <Route path="/" element={ownerPhone ? <Dashboard /> : <Welcome />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add" element={<AddSale />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
