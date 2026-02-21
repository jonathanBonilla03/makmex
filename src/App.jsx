import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import DatabaseConnectionWrapper from "./components/DatabaseConnectionWrapper"
import StorefrontShell from "./components/StorefrontShell"
import CategoryPage from "./pages/CategoryPage"
import CombosPage from "./pages/CombosPage"
import KitsPage from "./pages/KitsPage"
import ItemDetailsPage from "./pages/ItemDetailsPage"
import { CartProvider } from "./context/CartContext"
import { LanguageProvider } from "./context/LanguageContext"

function Placeholder({ title }) {
  return (
    <div className="rounded-2xl border border-makmex-border bg-makmex-surface p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-makmex-muted">Next we'll wire this to Supabase.</p>
    </div>
  );
}

export default function App() {
  return (
    <DatabaseConnectionWrapper>
      <LanguageProvider>
        <CartProvider>
          <BrowserRouter>
            <StorefrontShell>
              <Routes>
                <Route path="/" element={<Navigate to="/products" replace />} />
                <Route path="/products" element={<CategoryPage title="Products" />} />
                <Route path="/combos" element={<CombosPage title="Combos" />} />
                <Route path="/kits" element={<KitsPage title="Kits" />} />
                <Route path="/item/:type/:id" element={<ItemDetailsPage />} />
                <Route path="/brands" element={<Placeholder title="Brands" />} />
                <Route path="/deals" element={<Placeholder title="Deals" />} />
              </Routes>
            </StorefrontShell>
          </BrowserRouter>
        </CartProvider>
      </LanguageProvider>
    </DatabaseConnectionWrapper>
  )
}