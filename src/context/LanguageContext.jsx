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
    
    // Promo & Locations
    upToOff: "Up to 20% off kits this week",
    freePickup: "Free pickup in AZ",
    fastShipping: "Fast shipping available",
    pickup: "Local pickup available",
    arizonaLocation: "Arizona",
    
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
    powerSources: "Power Sources",
    anyBrand: "Any brand (inclusive)",
    allBrands: "All brands (exclusive)",
    hasImages: "Has Images",
    
    // Condition values
    conditionAA: "New in Box",
    conditionA: "New without a box",
    conditionB: "Pre-owned (minimal defects)",
    conditionC: "Pre-owned (moderate wear)",
    conditionD: "Used",
    conditionE: "Used (notable touches)",
    conditionF: "Very Used",
    
    // Power source values
    powerNone: "No Power Source",
    powerCable: "Cable",
    powerM12: "M12",
    powerM18: "M18",
    power18V: "18V",
    power40V: "40V",
    
    // Product types
    typeAccessories: "Accessories",
    typeBatteries: "Batteries, Chargers & Power Supplies",
    typeHandTools: "Hand Tools",
    typeInstruments: "Instruments",
    typeJobsiteApparel: "Jobsite Apparel",
    typeOutdoorPower: "Outdoor Power Equipment",
    typePowerTools: "Power Tools",
    
    // Sorting
    sortBy: "Sort by:",
    relevance: "Relevance",
    priceLowToHigh: "Price: Low to High", 
    priceHighToLow: "Price: High to Low",
    newestFirst: "Newest First",
    
    // Item details
    specifications: "Specifications",
    conditionDetails: "Condition Details",
    stock: "Stock",
    available: "available",
    sku: "SKU",
    brand: "Brand",
    condition: "Condition",
    type: "Type",
    power: "Power",
    location: "Location",
    role: "Role",
    items: "Items",
    pieces: "pieces",
    backToCatalog: "Back to catalog",
    quantity: "Quantity",
    product: "PRODUCT",
    combo: "COMBO",
    kit: "KIT",
    piece: "piece",
    noImageAvailable: "No image available",
    loadingItem: "Loading item...",
    pleaseWait: "Please wait while we fetch the details.",
    errorLoadingItem: "Error loading item",
    goBack: "Go Back",
    itemNotFound: "Item not found",
    requestedItemNotFound: "The requested item could not be found.",
    addedToCart: "Added to Cart!",
    includedItems: "Included Items",
    itemNumber: "Item",
    limitedStock: "Only {quantity} left in stock!",
    
    // Common
    available: "available",
    loading: "Loading",
    error: "Error loading",
    onlyLeft: "Only",
    left: "left!",
    search: "Search",
    searchPlaceholder: "Search tools, batteries, kits…",
    specs: "Specs",
    
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
    
    // Promo & Locations
    upToOff: "Hasta 20% de descuento en kits esta semana",
    freePickup: "Recogida gratis en AZ",
    fastShipping: "Envío rápido disponible",
    pickup: "Recogida local disponible",
    arizonaLocation: "Arizona",
    
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
    powerSources: "Fuentes de Energía",
    anyBrand: "Cualquier marca (inclusivo)",
    allBrands: "Todas las marcas (exclusivo)",
    hasImages: "Tiene Imágenes",
    
    // Condition values
    conditionAA: "Nuevo en Caja",
    conditionA: "Nuevo sin caja",
    conditionB: "Usado (defectos mínimos)",
    conditionC: "Usado (desgaste moderado)",
    conditionD: "Usado",
    conditionE: "Usado (con detalles notables)",
    conditionF: "Muy Usado",
    
    // Power source values
    powerNone: "Sin Fuente de Energía",
    powerCable: "Cable",
    powerM12: "M12",
    powerM18: "M18",
    power18V: "18V",
    power40V: "40V",
    
    // Product types
    typeAccessories: "Accesorios",
    typeBatteries: "Baterías, Cargadores y Suministros de Energía",
    typeHandTools: "Herramientas Manuales",
    typeInstruments: "Instrumentos",
    typeJobsiteApparel: "Ropa para Obra",
    typeOutdoorPower: "Equipos de Potencia para Exteriores",
    typePowerTools: "Herramientas Eléctricas",
    
    // Sorting
    sortBy: "Ordenar por:",
    relevance: "Relevancia",
    priceLowToHigh: "Precio: Menor a Mayor",
    priceHighToLow: "Precio: Mayor a Menor", 
    newestFirst: "Más Nuevo Primero",
    
    // Item details
    specifications: "Especificaciones",
    conditionDetails: "Detalles de Condición",
    stock: "Stock",
    available: "disponible",
    sku: "SKU",
    brand: "Marca",
    condition: "Condición",
    type: "Tipo",
    power: "Energía",
    location: "Ubicación",
    role: "Rol",
    items: "Artículos",
    pieces: "piezas",
    backToCatalog: "Volver al catálogo",
    quantity: "Cantidad",
    product: "PRODUCTO",
    combo: "COMBO",
    kit: "KIT",
    piece: "pieza",
    noImageAvailable: "No hay imagen disponible",
    loadingItem: "Cargando artículo...",
    pleaseWait: "Por favor espere mientras obtenemos los detalles.",
    errorLoadingItem: "Error al cargar el artículo",
    goBack: "Volver",
    itemNotFound: "Artículo no encontrado",
    requestedItemNotFound: "El artículo solicitado no pudo ser encontrado.",
    addedToCart: "¡Agregado al Carrito!",
    includedItems: "Artículos Incluidos",
    itemNumber: "Artículo",
    limitedStock: "¡Solo {quantity} resto en stock!",
    
    // Common
    available: "disponible",
    loading: "Cargando",
    error: "Error al cargar",
    onlyLeft: "Solo",
    left: "restante!",
    search: "Buscar",
    searchPlaceholder: "Buscar herramientas, baterías, kits…",
    specs: "Especificaciones",
    
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
  
  const t = (key, params = null) => {
    let translation = translations[language][key] || translations.en[key] || key;
    
    // Handle parameter substitution for complex strings
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(param => {
        const regex = new RegExp(`\\{${param}\\}`, 'g');
        translation = translation.replace(regex, params[param]);
      });
    }
    
    return translation;
  };
  
  const formatPrice = (price) => {
    const currency = translations[language].currency;
    return `${currency}${price.toFixed(2)}`;
  };

  // Helper to translate condition names by ID
  const getConditionTranslation = (conditionId) => {
    const conditionMap = {
      'AA': 'conditionAA',
      'A': 'conditionA',
      'B': 'conditionB',
      'C': 'conditionC',
      'D': 'conditionD',
      'E': 'conditionE',
      'F': 'conditionF'
    };
    const key = conditionMap[conditionId];
    return key ? t(key) : conditionId;
  };

  // Helper to translate condition names by full name
  const translateConditionName = (fullConditionName) => {
    const nameMap = {
      'New in Box': 'conditionAA',
      'New without a box': 'conditionA',
      'Pre-owned (minimal defects)': 'conditionB',
      'Pre-owned (moderate wear)': 'conditionC',
      'Used': 'conditionD',
      'Used (notable touches)': 'conditionE',
      'Very Used': 'conditionF'
    };
    const key = nameMap[fullConditionName];
    return key ? t(key) : fullConditionName;
  };

  // Helper to translate power source
  const translatePowerSource = (powerSource) => {
    if (!powerSource || powerSource === 'none') return t('powerNone');
    
    const powerMap = {
      'Cable': 'powerCable',
      'cable': 'powerCable',
      'M12': 'powerM12',
      'M18': 'powerM18',
      '18V': 'power18V',
      '40V': 'power40V'
    };
    const key = powerMap[powerSource];
    return key ? t(key) : powerSource;
  };

  // Helper to translate product type
  const translateProductType = (productTypeName) => {
    const typeMap = {
      'Accessories': 'typeAccessories',
      'Batteries, Chargers & Power Supplies': 'typeBatteries',
      'Hand Tools': 'typeHandTools',
      'Instruments': 'typeInstruments',
      'Jobsite Apparel': 'typeJobsiteApparel',
      'Outdoor Power Equipment': 'typeOutdoorPower',
      'Power Tools': 'typePowerTools'
    };
    const key = typeMap[productTypeName];
    return key ? t(key) : productTypeName;
  };
  
  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    formatPrice,
    getConditionTranslation,
    translateConditionName,
    translatePowerSource,
    translateProductType
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