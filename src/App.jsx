import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Vendors from "./pages/Vendors";
import VendorMenu from "./pages/VendorMenu";
import FoodDetails from "./pages/FoodDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import StaticPage from "./pages/StaticPage";
import NotFound from "./pages/NotFound";

import VendorDashboard from "./pages/vendor/VendorDashboard";
import ManageFoods from "./pages/vendor/ManageFoods";
import FoodForm from "./pages/vendor/FoodForm";
import ManageOrders from "./pages/vendor/ManageOrders";
import VendorGrow from "./pages/vendor/VendorGrow";
import VendorPayouts from "./pages/vendor/VendorPayouts";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminPages from "./pages/admin/AdminPages";
import AdminAds from "./pages/admin/AdminAds";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import AdminSettlements from "./pages/admin/AdminSettlements";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/vendors/:id" element={<VendorMenu />} />
            <Route path="/foods/:id" element={<FoodDetails />} />

            <Route path="/about" element={<StaticPage title="About us" settingKey="page_about" />} />
            <Route path="/founder" element={<StaticPage title="About the founder" settingKey="page_founder" />} />
            <Route path="/terms" element={<StaticPage title="Terms of service" settingKey="page_terms" />} />
            <Route path="/privacy" element={<StaticPage title="Privacy policy" settingKey="page_privacy" />} />

            {/* Admins log in and are seeded, not self-registered — send these to the one login page */}
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route path="/admin/register" element={<Navigate to="/login" replace />} />

            <Route
              path="/cart"
              element={
                <ProtectedRoute role="customer">
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute role="customer">
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute role="customer">
                  <MyOrders />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendor/dashboard"
              element={
                <ProtectedRoute role="vendor">
                  <VendorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/foods"
              element={
                <ProtectedRoute role="vendor">
                  <ManageFoods />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/foods/new"
              element={
                <ProtectedRoute role="vendor">
                  <FoodForm mode="create" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/foods/:id/edit"
              element={
                <ProtectedRoute role="vendor">
                  <FoodForm mode="edit" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/orders"
              element={
                <ProtectedRoute role="vendor">
                  <ManageOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/grow"
              element={
                <ProtectedRoute role="vendor">
                  <VendorGrow />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/payouts"
              element={
                <ProtectedRoute role="vendor">
                  <VendorPayouts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute role="admin">
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pages"
              element={
                <ProtectedRoute role="admin">
                  <AdminPages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/ads"
              element={
                <ProtectedRoute role="admin">
                  <AdminAds />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute role="admin">
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subscriptions"
              element={
                <ProtectedRoute role="admin">
                  <AdminSubscriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/campaigns"
              element={
                <ProtectedRoute role="admin">
                  <AdminCampaigns />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settlements"
              element={
                <ProtectedRoute role="admin">
                  <AdminSettlements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute role="admin">
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </CartProvider>
    </AuthProvider>
  );
}
