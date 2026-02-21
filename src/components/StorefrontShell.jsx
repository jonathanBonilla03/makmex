import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";

function Icon({ children }) {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-makmex-border bg-makmex-panel text-makmex-muted">
      {children}
    </span>
  );
}

function CartIcon() {
  const { getCartItemsCount, getCartTotal, items } = useCart();
  const { formatPrice, t } = useLanguage();
  const itemsCount = getCartItemsCount();
  const total = getCartTotal();
  
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Icon>🛒</Icon>
        {itemsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-makmex-orange text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {itemsCount > 9 ? '9+' : itemsCount}
          </span>
        )}
      </div>
      <div className="hidden sm:block text-sm text-makmex-text">
        <div className="font-semibold">{formatPrice(total)}</div>
        <div className="text-xs text-makmex-muted">
          {itemsCount} {t(itemsCount === 1 ? 'item' : 'items')}
        </div>
      </div>
    </div>
  );
}

function CartSidebar({ isOpen, onClose }) {
  const { items, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { formatPrice, t } = useLanguage();

  return (
    <div className={`fixed right-0 top-0 h-full w-96 bg-makmex-bg border-l border-makmex-border z-50 transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-makmex-border p-4">
          <h2 className="text-lg font-semibold text-makmex-text">{t('cart')}</h2>
          <button 
            onClick={onClose}
            className="text-makmex-muted hover:text-makmex-text text-xl"
          >
            ✕
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center text-makmex-muted py-8">
              <div className="text-4xl mb-2">🛒</div>
              <p>{t('yourCartIsEmpty')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={`${item.id}-${item.type}`} className="border border-makmex-border rounded-lg p-3 bg-makmex-surface">
                  <div className="flex items-start gap-3">
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt={item.description || item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-makmex-text line-clamp-2">
                        {item.description || item.name}
                      </h3>
                      {item.display_sku && (
                        <p className="text-xs text-makmex-muted">{t('sku')} {item.display_sku}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-semibold text-makmex-text">
                          {formatPrice(item.price)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}
                            className="w-6 h-6 rounded bg-makmex-border text-makmex-text hover:bg-makmex-orange"
                          >
                            −
                          </button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => {
                              if (item.quantity < item.available_quantity) {
                                updateQuantity(item.id, item.type, item.quantity + 1);
                              }
                            }}
                            className="w-6 h-6 rounded bg-makmex-border text-makmex-text hover:bg-makmex-orange disabled:opacity-50"
                            disabled={item.quantity >= item.available_quantity}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id, item.type)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-makmex-border p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-makmex-text">
                {t('total')}: {formatPrice(getCartTotal())}
              </span>
              <button 
                onClick={clearCart}
                className="text-sm text-red-500 hover:text-red-700"
              >
                {t('clearCart')}
              </button>
            </div>
            <button className="w-full bg-makmex-orange text-black font-semibold py-3 rounded-lg hover:bg-makmex-ember">
              {t('checkout')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StorefrontShell({ children }) {
  const [query, setQuery] = useState("");
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);
  const { t, language, toggleLanguage } = useLanguage();

  const toggleCartSidebar = () => {
    setIsCartSidebarOpen(!isCartSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-makmex-bg text-makmex-text">
      {/* Top promo bar */}
      <div className="border-b border-makmex-border bg-black/40">
        <div className="mx-auto max-w-7xl px-4 py-2 text-center text-xs text-makmex-muted">
          Up to 20% off kits this week • Free pickup in AZ • Fast shipping available
        </div>
      </div>

      {/* Main content with subtle desktop cart push */}
      <div className={`transition-transform duration-300 ease-in-out ${isCartSidebarOpen ? 'xl:-translate-x-24' : ''}`}>
          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-makmex-border bg-makmex-bg/90 backdrop-blur">
        {/* Row 1 */}
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-makmex-orange px-3 py-2 font-extrabold tracking-tight text-black">
                MAKMEX
              </div>
              <div className="hidden text-sm font-semibold text-makmex-muted sm:block">
                Store
              </div>
            </div>

            {/* Search */}
            <div className="flex-1">
              <div className="flex items-center overflow-hidden rounded-2xl border border-makmex-border bg-makmex-surface">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchPlaceholder') || "Search tools, batteries, kits…"}
                  className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-makmex-muted/70"
                />
                <button
                  className="m-1 rounded-xl bg-makmex-orange px-4 py-2 text-sm font-semibold text-black hover:bg-makmex-ember"
                  onClick={() => console.log("search:", query)}
                >
                  {t('search') || 'Search'}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="hidden items-center gap-3 md:flex">
              {/* Language Toggle */}
              <button 
                onClick={toggleLanguage}
                className="relative flex items-center gap-2 rounded-2xl border border-makmex-border bg-makmex-surface px-3 py-2 hover:border-makmex-orange/60"
              >
                <span className="text-sm font-medium text-makmex-text">
                  {language === 'en' ? 'ES' : 'EN'}
                </span>
              </button>
              
              <button 
                onClick={toggleCartSidebar}
                className="relative flex items-center gap-2 rounded-2xl border border-makmex-border bg-makmex-surface px-3 py-2 hover:border-makmex-orange/60"
              >
                <CartIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Nav */}
        <div className="border-t border-makmex-border bg-black/30">
          <nav className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2 text-sm">
        
{[
  { label: t('products'), to: "/products" },
  { label: t('combos'), to: "/combos" },
  { label: t('kits'), to: "/kits" },
  { label: t('brands'), to: "/brands" },
  { label: t('deals'), to: "/deals" },
].map((item) => (
  <Link
    key={item.label}
    to={item.to}
    className="rounded-xl px-3 py-2 font-semibold text-makmex-muted hover:bg-makmex-surface hover:text-makmex-text"
  >
    <span className="flex items-center gap-2">
      {item.label}
    </span>
  </Link>
))}


            <div className="ml-auto hidden text-xs text-makmex-muted md:block">
              Arizona • Local pickup available
            </div>
          </nav>
        </div>
      </header>

      {/* Main content slot */}
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      </div>

      {/* Cart Sidebar (out of layout flow) */}
      <CartSidebar isOpen={isCartSidebarOpen} onClose={() => setIsCartSidebarOpen(false)} />
    </div>
  );
}
