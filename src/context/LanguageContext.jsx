import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    // Navigation
    products: "Products",
    combos: "Combos", 
    kits: "Kits",
    brands: "Brands",
    deals: "Deals",
    
    // Cart
    cart: "Shopping Cart",
    addToCart: "Add to Cart",
    viewDetails: "View Details",
    outOfStock: "Out of Stock",
    inCart: "In Cart",
    clearCart: "Clear Cart",
    checkout: "Checkout",
    yourCartIsEmpty: "Your cart is empty",
    total: "Total",
    item: "item",
    items: "items",
    
    // Filters
    filters: "Filters",
    clearAll: "Clear All",
    priceRange: "Price Range",
    min: "Min",
    max: "Max", 
    applyPriceRange: "Apply Price Range",
    brands: "Brands",
    conditions: "Conditions",
    locations: "Locations",
    productTypes: "Product Types",
    anyBrand: "Any brand (inclusive)",
    allBrands: "All brands (exclusive)",
    
    // Sorting
    sortBy: "Sort by:",
    relevance: "Relevance",
    priceLowToHigh: "Price: Low to High", 
    priceHighToLow: "Price: High to Low",
    newestFirst: "Newest First",
    
    // Common
    available: "available",
    loading: "Loading",
    error: "Error loading",
    onlyLeft: "Only",
    left: "left!",
    sku: "SKU:",
    power: "Power:",
    specs: "Specs:",
    location: "Location:",
    search: "Search",
    searchPlaceholder: "Search tools, batteries, kits…",
    
    // Currency
    currency: "MX$"
  },
  es: {
    // Navigation  
    products: "Productos",
    combos: "Combos",
    kits: "Kits", 
    brands: "Marcas",
    deals: "Ofertas",
    
    // Cart
    cart: "Carrito de Compras",
    addToCart: "Agregar al Carrito",
    viewDetails: "Ver Detalles", 
    outOfStock: "Sin Existencias",
    inCart: "En Carrito",
    clearCart: "Vaciar Carrito",
    checkout: "Finalizar Compra",
    yourCartIsEmpty: "Tu carrito está vacío",
    total: "Total",
    item: "artículo",
    items: "artículos",
    
    // Filters
    filters: "Filtros",
    clearAll: "Limpiar Todo",
    priceRange: "Rango de Precio",
    min: "Mín",
    max: "Máx",
    applyPriceRange: "Aplicar Rango de Precio",
    brands: "Marcas", 
    conditions: "Condiciones",
    locations: "Ubicaciones",
    productTypes: "Tipos de Producto",
    anyBrand: "Cualquier marca (inclusivo)",
    allBrands: "Todas las marcas (exclusivo)",
    
    // Sorting
    sortBy: "Ordenar por:",
    relevance: "Relevancia",
    priceLowToHigh: "Precio: Menor a Mayor",
    priceHighToLow: "Precio: Mayor a Menor", 
    newestFirst: "Más Nuevo Primero",
    
    // Common
    available: "disponible",
    loading: "Cargando",
    error: "Error al cargar",
    onlyLeft: "Solo",
    left: "restante!",
    sku: "SKU:",
    power: "Energía:",
    specs: "Especificaciones:",
    location: "Ubicación:",
    search: "Buscar",
    searchPlaceholder: "Buscar herramientas, baterías, kits…",
    
    // Currency
    currency: "$"
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  
  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('makmex-language');
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);
  
  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'es' : 'en';
    setLanguage(newLanguage);
    localStorage.setItem('makmex-language', newLanguage);
  };
  
  const t = (key, count = null) => {
    let translation = translations[language][key] || translations.en[key] || key;
    
    // Handle pluralization for count-based translations
    if (count !== null) {
      if (key === 'item' || key === 'items') {
        return count === 1 ? translations[language].item : translations[language].items;
      }
    }
    
    return translation;
  };
  
  const formatPrice = (price) => {
    const currency = translations[language].currency;
    return `${currency}${price.toFixed(2)}`;
  };
  
  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    formatPrice
  };
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}