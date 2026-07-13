import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';

// Admin
import AdminDashboard from '@/pages/admin/DashboardPage';
import OrdersPage from '@/pages/admin/OrdersPage';
import ClientsPage from '@/pages/admin/ClientsPage';
import ClientDetailPage from '@/pages/admin/ClientDetailPage';
import ProductsPage from '@/pages/admin/ProductsPage';
import InvoicesPage from '@/pages/admin/InvoicesPage';
import PaymentsPage from '@/pages/admin/PaymentsPage';
import StockPage from '@/pages/admin/StockPage';
import ReportsPage from '@/pages/admin/ReportsPage';
import UsersPage from '@/pages/admin/UsersPage';
import SettingsPage from '@/pages/admin/SettingsPage';

// Client
import ClientDashboard from '@/pages/client/DashboardPage';
import NewOrderPage from '@/pages/client/NewOrderPage';
import MyOrdersPage from '@/pages/client/MyOrdersPage';
import ClientInvoicesPage from '@/pages/client/InvoicesPage';
import ProfilePage from '@/pages/client/ProfilePage';

function App() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected app routes */}
      <Route path="/app" element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* Admin routes */}
          <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrdersPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/:id" element={<ClientDetailPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="invoices/:id" element={<InvoicesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="stock" element={<StockPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          {/* Client routes */}
          <Route path="client" element={<ProtectedRoute requiredRole="CLIENT" />}>
            <Route index element={<ClientDashboard />} />
            <Route path="orders" element={<MyOrdersPage />} />
            <Route path="orders/new" element={<NewOrderPage />} />
            <Route path="orders/:id" element={<MyOrdersPage />} />
            <Route path="invoices" element={<ClientInvoicesPage />} />
            <Route path="invoices/:id" element={<ClientInvoicesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
