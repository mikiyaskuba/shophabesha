import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddSale from "./pages/AddSale";
import Customers from "./pages/Customers";
import Credits from "./pages/Credits";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add" element={<AddSale />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/credits" element={<Credits />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;