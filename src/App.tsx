import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { I18nProvider } from './contexts/I18nContext'
import { ToastProvider } from './contexts/ToastContext'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import LoginPage from './pages/LoginPage'
import OrdersPage from './pages/OrdersPage'
import ProfilePage from './pages/ProfilePage'
import StoresPage from './pages/StoresPage'
import ProductDetailPage from './pages/ProductDetailPage'
import AdminPage from './pages/AdminPage'
import POSPage from './pages/POSPage'
import AgentDashboardPage from './pages/AgentDashboardPage'
import AgentLoginPage from './pages/AgentLoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import LineLoginCallback from './pages/LineLoginCallback'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/line-login-callback" element={<LineLoginCallback />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="/pos" element={<POSPage />} />
        <Route path="/agent/login" element={<AgentLoginPage />} />
        <Route path="/agent" element={<AgentDashboardPage />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </I18nProvider>
  )
}

export default App
