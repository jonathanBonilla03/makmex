import { useEffect } from 'react'
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
import { LoadingProvider } from "./context/LoadingContext"

export default function App() {
  useEffect(() => {
    const root = document.documentElement

    const updateViewportHeight = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight
      root.style.setProperty('--app-height', `${Math.round(viewportHeight)}px`)
    }

    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', updateViewportHeight)
    window.visualViewport?.addEventListener('resize', updateViewportHeight)

    return () => {
      window.removeEventListener('resize', updateViewportHeight)
      window.removeEventListener('orientationchange', updateViewportHeight)
      window.visualViewport?.removeEventListener('resize', updateViewportHeight)
    }
  }, [])

  return (
    <DatabaseConnectionWrapper>
      <LanguageProvider>
        <CartProvider>
          <LocationProvider>
            <LoadingProvider>
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
            </LoadingProvider>
          </LocationProvider>
        </CartProvider>
      </LanguageProvider>
    </DatabaseConnectionWrapper>
  )
}