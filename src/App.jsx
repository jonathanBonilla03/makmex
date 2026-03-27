import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import DatabaseConnectionWrapper from "./components/DatabaseConnectionWrapper"
import StorefrontShell from "./components/StorefrontShell"
import HomePage from "./pages/HomePage"
import BrandsPage from "./pages/BrandsPage"
import ContactPage from "./pages/ContactPage"
import CategoryPage from "./pages/CategoryPage"
import ItemDetailsPage from "./pages/ItemDetailsPage"
import CheckoutPage from "./pages/CheckoutPage"
import OrderSuccessPage from "./pages/OrderSuccessPage"
import { CartProvider } from "./context/CartContext"
import { LanguageProvider } from "./context/LanguageContext"
import { LocationProvider } from "./context/LocationContext"

export default function App() {
  return (
    <DatabaseConnectionWrapper>
      <LanguageProvider>
        <CartProvider>
          <LocationProvider>
            <BrowserRouter>
              <StorefrontShell>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shopping" element={<CategoryPage />} />
                  <Route path="/products" element={<Navigate to="/shopping" replace />} />
                  <Route path="/combos" element={<Navigate to="/shopping" replace />} />
                  <Route path="/kits" element={<Navigate to="/shopping" replace />} />
                  <Route path="/item/:type/:id" element={<ItemDetailsPage />} />
                  <Route path="/brands" element={<BrandsPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order-success" element={<OrderSuccessPage />} />
                </Routes>
              </StorefrontShell>
            </BrowserRouter>
          </LocationProvider>
        </CartProvider>
      </LanguageProvider>
    </DatabaseConnectionWrapper>
  )
}