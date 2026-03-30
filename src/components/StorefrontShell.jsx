import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { useLocations } from "../context/LocationContext";
import { supabase } from "../lib/supabase";

const { data: homeLogoImageData } = supabase.storage
  .from("web-images")
  .getPublicUrl("home-page/MakMex_Logo.png");

const homeLogoImageUrl = homeLogoImageData?.publicUrl || "";

function Icon({ children }) {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-makmex-border bg-makmex-panel text-makmex-muted">
      {children}
    </span>
  );
}

function CartIcon() {
  const { getCartItemsCount, getCartTotal } = useCart();
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
            <Link 
              to="/checkout"
              className="w-full bg-makmex-orange text-black font-semibold py-3 rounded-lg hover:bg-makmex-ember text-center block"
            >
              {t('checkout')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StorefrontShell({ children }) {
  const [query, setQuery] = useState("");
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('makmex-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return 'dark';
  });
  const locationMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { getCartItemsCount } = useCart();
  const { t, language, toggleLanguage } = useLanguage();
  const { selectedLocations, availableLocations, toggleLocation } = useLocations();
  const mobileCartCount = getCartItemsCount();

  const getLocationShortLabel = (location) => {
    const knownLabels = {
      "Mexico City": "CDMX"
    };

    if (knownLabels[location]) return knownLabels[location];

    if (location.includes(" ")) {
      const short = location
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
      return short || location.slice(0, 4).toUpperCase();
    }

    return location.slice(0, 4).toUpperCase();
  };

  const selectedLocationArray = Array.from(selectedLocations);
  const selectedLocationSummary = selectedLocationArray.length === 1
    ? selectedLocationArray[0]
    : selectedLocationArray.length > 1
      ? `${selectedLocationArray.length} ${t('selectedLocations')}`
      : t('selectLocations');

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (locationMenuRef.current && !locationMenuRef.current.contains(event.target)) {
        setIsLocationMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQuery(params.get('q') || '');
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('makmex-theme', theme);
  }, [theme]);

  const toggleCartSidebar = () => {
    setIsCartSidebarOpen(!isCartSidebarOpen);
  };

  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    
    // Auto-clear search when input is emptied and there's currently a query
    if (newValue.trim() === '') {
      const params = new URLSearchParams(location.search);
      if (params.get('q')) {
        // Automatically submit to clear the search
        params.delete('q');
        const queryString = params.toString();
        navigate(`/shopping${queryString ? `?${queryString}` : ''}`);
      }
    }
  };

  const handleSearchSubmit = () => {
    const trimmedQuery = query.trim();
    const params = location.pathname === '/shopping'
      ? new URLSearchParams(location.search)
      : new URLSearchParams();

    if (trimmedQuery) {
      params.set('q', trimmedQuery);
    } else {
      params.delete('q');
    }

    const queryString = params.toString();
    navigate(`/shopping${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-makmex-bg text-makmex-text">
      {/* Top promo bar */}
      <div className={`border-b border-makmex-border ${theme === 'light' ? 'bg-makmex-panel/95' : 'bg-black/40'}`}>
        <div className="mx-auto max-w-7xl px-4 py-2 text-center text-xs text-makmex-muted">
          WORK IN PROGRESS
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
              <Link
                to="/"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-makmex-orange px-2 transition-colors hover:bg-makmex-ember"
              >
                <img
                  src={homeLogoImageUrl}
                  alt="MakMex"
                  className="h-7 w-auto object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </Link>
              <div className="hidden text-sm font-semibold text-makmex-muted sm:block">
                Store
              </div>
            </div>

            {/* Search */}
            <div className="flex-1">
              <form
                className="flex items-center overflow-hidden rounded-2xl border border-makmex-border bg-makmex-surface"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSearchSubmit();
                }}
              >
                <input
                  value={query}
                   onChange={handleSearchChange}
                  placeholder={t('searchPlaceholder') || "Search tools, batteries, kits…"}
                  className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-makmex-muted/70"
                />
                <button
                  type="submit"
                  className="m-1 rounded-xl bg-makmex-orange px-4 py-2 text-sm font-semibold text-black hover:bg-makmex-ember"
                >
                  {t('search') || 'Search'}
                </button>
              </form>
            </div>

            {/* Actions */}
            <div className="hidden items-center gap-3 md:flex">
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
                className="relative flex items-center gap-2 rounded-2xl border border-makmex-border bg-makmex-surface px-3 py-2 hover:border-makmex-orange/60"
                aria-label={theme === 'light' ? t('switchToDarkMode') : t('switchToLightMode')}
                  title={theme === 'light' ? t('light') : t('dark')}
                type="button"
              >
                  <span className="text-sm" aria-hidden="true">{theme === 'light' ? '☀️' : '🌙'}</span>
                  <span className="text-sm font-medium text-makmex-text">{theme === 'light' ? t('light') : t('dark')}</span>
              </button>

              {/* Language Toggle */}
              <button 
                onClick={toggleLanguage}
                className="relative flex items-center gap-2 rounded-2xl border border-makmex-border bg-makmex-surface px-3 py-2 hover:border-makmex-orange/60"
              >
                <span className="text-sm font-medium text-makmex-text">
                  {language === 'en' ? 'EN' : 'ES'}
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
        <div className={`border-t border-makmex-border ${theme === 'light' ? 'bg-makmex-panel/90' : 'bg-black/30'}`}>
          <nav className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2 text-sm">
        
{[
  { label: t('shopping'), to: "/shopping" },
  { label: t('brands'), to: "/brands" },
  { label: t('contact'), to: "/contact" },
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


            <div className="relative ml-auto hidden md:block" ref={locationMenuRef}>
              <button
                type="button"
                onClick={() => setIsLocationMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-xl border border-makmex-border bg-makmex-surface px-3 py-2 text-xs font-semibold text-makmex-muted hover:border-makmex-orange/60 hover:text-makmex-text"
              >
                <span>{selectedLocationSummary}</span>
                <svg className={`h-3 w-3 transition-transform ${isLocationMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isLocationMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] w-80 rounded-xl border border-makmex-border bg-makmex-panel p-3 shadow-card z-50">
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {availableLocations.length === 0 ? (
                      <p className="text-xs text-makmex-muted">{t('noLocationsAvailable')}</p>
                    ) : (
                      availableLocations.map((location) => (
                        <label key={location} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-makmex-muted hover:bg-makmex-surface hover:text-makmex-text">
                          <input
                            type="checkbox"
                            checked={selectedLocations.has(location)}
                            onChange={() => toggleLocation(location)}
                            className="accent-makmex-orange"
                          />
                          <span className="truncate">
                            {location} ({getLocationShortLabel(location)})
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Main content slot */}
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      </div>

      {/* Floating mobile quick actions */}
      <div className="fixed right-3 top-40 z-50 flex flex-col items-center gap-2 md:hidden">
        <button
          onClick={toggleCartSidebar}
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-makmex-orange/70 bg-makmex-surface text-lg text-makmex-text shadow-[0_0_0_2px_rgba(0,0,0,0.18)] hover:border-makmex-orange"
          aria-label={t('cart')}
          title={t('cart')}
        >
          <span className="relative inline-flex items-center justify-center">
            🛒
            {mobileCartCount > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                {mobileCartCount > 9 ? '9+' : mobileCartCount}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-makmex-orange/70 bg-makmex-surface text-lg text-makmex-text shadow-[0_0_0_2px_rgba(0,0,0,0.18)] hover:border-makmex-orange"
          aria-label={theme === 'light' ? t('switchToDarkMode') : t('switchToLightMode')}
          title={theme === 'light' ? t('light') : t('dark')}
        >
          {theme === 'light' ? '☀️' : '🌙'}
        </button>
        <button
          onClick={toggleLanguage}
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-makmex-orange/70 bg-makmex-surface text-sm font-semibold text-makmex-text shadow-[0_0_0_2px_rgba(0,0,0,0.18)] hover:border-makmex-orange"
          aria-label={language === 'en' ? t('switchToSpanish') : t('switchToEnglish')}
          title={language === 'en' ? 'ES' : 'EN'}
        >
          {language === 'en' ? 'EN' : 'ES'}
        </button>
      </div>

      {/* Cart Sidebar (out of layout flow) */}
      <CartSidebar isOpen={isCartSidebarOpen} onClose={() => setIsCartSidebarOpen(false)} />
    </div>
  );
}
