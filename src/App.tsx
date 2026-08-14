import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ProductList from './pages/inventory/ProductList';
import InventoryLedger from './pages/inventory/InventoryLedger';
import AITools from './pages/ai/AITools';
import POS from './pages/sales/POS';
import Invoice from './pages/sales/Invoice';
import PurchaseOrders from './pages/purchases/PurchaseOrders';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<ProductList />} />
          <Route path="inventory/ledger" element={<InventoryLedger />} />
          <Route path="purchases" element={<PurchaseOrders />} />
          <Route path="ai-tools" element={<AITools />} />
          <Route path="sales" element={<POS />} />
          <Route path="sales/invoice" element={<Invoice />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
