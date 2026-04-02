import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    // Navigation
    shopping: "Shopping",
    products: "Products",
    combos: "Combos", 
    kits: "Kits",
    brands: "Brands",
    contact: "Contact Us",
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
    types: "Types",
    viewMode: "View",
    compact: "Default",
    standard: "Wide",
    clearAll: "Clear All",
    priceRange: "Price Range",
    min: "Min",
    max: "Max", 
    applyPriceRange: "Apply Price Range",
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
    showItems: "Show",
    retry: "Retry",
    noItemsFound: "No items found",
    noItemsFoundHint: "Try adjusting your filters or check back later for new inventory.",
    previous: "Previous",
    next: "Next",
    paginationSummary: "Page {currentPage} of {totalPages} ({totalItems} total items)",
    loadingPage: "Loading {page}...",
    
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
    selectLocations: "Select Locations",
    selectedLocations: "Selected Locations",
    noLocationsAvailable: "No locations available",
    role: "Role",
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
    loading: "Loading",
    error: "Error loading",
    onlyLeft: "Only",
    left: "left!",
    search: "Search",
    searchPlaceholder: "Search tools, batteries, kits…",
    light: "Light",
    dark: "Dark",
    switchToLightMode: "Switch to light mode",
    switchToDarkMode: "Switch to dark mode",
    switchToEnglish: "Switch language to English",
    switchToSpanish: "Switch language to Spanish",
    specs: "Specs",
    brandsPageTitle: "Explore Our Brands",
    brandsPageSubtitle: "Browse MakMex's stock by top leading brands.",
    shoppingPageTitle: "Shop MakMex",
    shoppingPageSubtitle: "Browse MakMex's stock of products, kits, and combos.",
    makmexHome: "MakMex Home",
    homeHeroTitle: "Welcome to MakMex",
    homeHeroSubtitle: "Save on Milwaukee and top tool brands. Clear condition, honest pricing, and value-packed kits and combos.",
    shopMakmex: "Shop MakMex",
    brandLogoPlaceholder: "Brand logo placeholder",
    itemInStock: "item in stock",
    itemsInStock: "items in stock",
    shopWithBrand: "Shop with {brand}",
    contactPageTitle: "Contact Us",
    contactPageSubtitle: "Find store addresses and reach each branch by phone or email.",
    contactAddress: "Address",
    contactPhone: "Phone",
    contactEmail: "Email",
    contactHours: "Business Hours",
    contactHoursValue: "Mon - Sat • 9:00 AM - 7:00 PM",
    
    // Checkout
    checkout: "Checkout",
    orderSummary: "Order Summary",
    yourCartIsEmpty: "Your cart is empty",
    total: "Total",
    shippingInformation: "Shipping Information",
    fullName: "Full Name",
    email: "Email",
    phoneNumber: "Phone Number (Optional)",
    placeOrder: "Place Order",
    placingOrder: "Placing Order...",
    important: "Important",
    securityNotice: "For security reasons, customers are limited to one order per day. Please ensure all items in your cart are correct before placing your order.",
    questionsOrIssues: "Questions or Issues?",
    contactUsAt: "Contact us at",
    pleaseFillRequiredFields: "Please fill in all required fields",
    pleaseEnterValidEmail: "Please enter a valid email address",
    welcomeBack: "Welcome back",
    foundExistingAccount: "We found your existing account",
    errorCheckingOrderHistory: "Error checking order history",
    alreadyPlacedOrder: "You have already placed an order on",
    oneOrderPerDay: "For security reasons, you can only place one order per day. Please try again tomorrow.",
    errorCheckingDuplicates: "Error checking for duplicate orders",
    duplicateOrder: "It appears you already placed this same order at",
    checkEmailOrContact: "Please check your email for order confirmation or contact us if you need assistance",
    errorCreatingOrder: "Error creating order",
    unexpectedError: "Unexpected error",
    
    // Order Success
    orderSuccessTitle: "Thank You for Your Order!",
    orderSuccessMessage: "Your order has been successfully placed. A Makmex representative will contact you within 24 hours to confirm the details and arrange delivery.",
    whatHappensNext: "What happens next?",
    emailConfirmationShortly: "You'll receive an email confirmation shortly",
    teamReviewOrder: "Our team will review your order within 24 hours",
    representativeContactDetails: "A representative will contact you to confirm details",
    deliveryArrangements: "Delivery arrangements will be made after confirmation",
    questions: "Questions?",
    questionsAboutOrder: "If you have any questions about your order, please contact us at:",
    continueShopping: "Continue Shopping",
    orderLimitReminder: "Remember: For security reasons, customers are limited to one order per day.",
    
    // Currency
    currency: "MX$"
  },
  es: {
    // Navigation  
    shopping: "Compras",
    products: "Productos",
    combos: "Combos",
    kits: "Kits", 
    brands: "Marcas",
    contact: "Contáctanos",
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
    types: "Tipos",
    viewMode: "Vista",
    compact: "Defecto",
    standard: "Ancho",
    clearAll: "Limpiar Todo",
    priceRange: "Rango de Precio",
    min: "Mín",
    max: "Máx",
    applyPriceRange: "Aplicar Rango de Precio",
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
    conditionB: "Semi Nuevo",
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
    showItems: "Mostrar",
    retry: "Reintentar",
    noItemsFound: "No se encontraron artículos",
    noItemsFoundHint: "Intenta ajustar tus filtros o vuelve más tarde para ver nuevo inventario.",
    previous: "Anterior",
    next: "Siguiente",
    paginationSummary: "Página {currentPage} de {totalPages} ({totalItems} artículos en total)",
    loadingPage: "Cargando {page}...",
    
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
    selectLocations: "Seleccionar ubicaciones",
    selectedLocations: "Ubicaciones seleccionadas",
    noLocationsAvailable: "No hay ubicaciones disponibles",
    role: "Rol",
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
    loading: "Cargando",
    error: "Error al cargar",
    onlyLeft: "Solo",
    left: "restante!",
    search: "Buscar",
    searchPlaceholder: "Buscar herramientas, baterías, kits…",
    light: "Claro",
    dark: "Oscuro",
    switchToLightMode: "Cambiar a modo claro",
    switchToDarkMode: "Cambiar a modo oscuro",
    switchToEnglish: "Cambiar idioma a inglés",
    switchToSpanish: "Cambiar idioma a español",
    specs: "Especificaciones",
    brandsPageTitle: "Explora Nuestras Marcas",
    brandsPageSubtitle: "Explora el inventario de MakMex por marcas líderes.",
    shoppingPageTitle: "Compra en MakMex",
    shoppingPageSubtitle: "Explora el inventario de MakMex de productos, kits y combos.",
    makmexHome: "Inicio MakMex",
    homeHeroTitle: "Bienvenido a MakMex",
    homeHeroSubtitle: "Ahorra en Milwaukee y las mejores marcas de herramientas. Condición clara, precios honestos y kits y combos con gran valor.",
    shopMakmex: "Comprar en MakMex",
    brandLogoPlaceholder: "Espacio para logotipo de marca",
    itemInStock: "artículo en stock",
    itemsInStock: "artículos en stock",
    shopWithBrand: "Comprar con {brand}",
    contactPageTitle: "Contáctanos",
    contactPageSubtitle: "Encuentra direcciones de tienda y contacta cada sucursal por teléfono o correo.",
    contactAddress: "Dirección",
    contactPhone: "Teléfono",
    contactEmail: "Correo",
    contactHours: "Horario",
    contactHoursValue: "Lun - Sáb • 9:00 AM - 7:00 PM",
    
    // Checkout
    checkout: "Finalizar Compra",
    orderSummary: "Resumen del Pedido",
    yourCartIsEmpty: "Tu carrito está vacío",
    total: "Total",
    shippingInformation: "Información de Envío",
    fullName: "Nombre Completo",
    email: "Correo",
    phoneNumber: "Número de Teléfono (Opcional)",
    placeOrder: "Realizar Pedido",
    placingOrder: "Realizando Pedido...",
    important: "Importante",
    securityNotice: "Por razones de seguridad, los clientes están limitados a un pedido por día. Por favor asegúrese de que todos los artículos en su carrito sean correctos antes de realizar su pedido.",
    questionsOrIssues: "¿Preguntas o Problemas?",
    contactUsAt: "Contáctanos en",
    pleaseFillRequiredFields: "Por favor complete todos los campos requeridos",
    pleaseEnterValidEmail: "Por favor ingrese una dirección de correo válida",
    welcomeBack: "Bienvenido de nuevo",
    foundExistingAccount: "Encontramos tu cuenta existente",
    errorCheckingOrderHistory: "Error al verificar el historial de pedidos",
    alreadyPlacedOrder: "Ya has realizado un pedido el",
    oneOrderPerDay: "Por razones de seguridad, solo puedes realizar un pedido por día. Por favor intenta de nuevo mañana.",
    errorCheckingDuplicates: "Error al verificar pedidos duplicados",
    duplicateOrder: "Parece que ya realizaste este mismo pedido el",
    checkEmailOrContact: "Por favor revisa tu correo para la confirmación del pedido o contáctanos si necesitas asistencia",
    errorCreatingOrder: "Error al crear el pedido",
    unexpectedError: "Error inesperado",
    
    // Order Success
    orderSuccessTitle: "¡Gracias por tu Pedido!",
    orderSuccessMessage: "Tu pedido ha sido realizado exitosamente. Un representante de Makmex te contactará dentro de 24 horas para confirmar los detalles y organizar la entrega.",
    whatHappensNext: "¿Qué sucede después?",
    emailConfirmationShortly: "Recibirás una confirmación por correo electrónico en breve",
    teamReviewOrder: "Nuestro equipo revisará tu pedido dentro de 24 horas",
    representativeContactDetails: "Un representante te contactará para confirmar los detalles",
    deliveryArrangements: "Los arreglos de entrega se harán después de la confirmación",
    questions: "¿Preguntas?",
    questionsAboutOrder: "Si tienes alguna pregunta sobre tu pedido, por favor contáctanos en:",
    continueShopping: "Continuar Comprando",
    orderLimitReminder: "Recuerda: Por razones de seguridad, los clientes están limitados a un pedido por día.",
    
    // Currency
    currency: "$"
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('makmex-language');
    if (savedLanguage && translations[savedLanguage]) {
      return savedLanguage;
    }
    return 'es';
  });
  
  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('makmex-language');
    if (!savedLanguage || !translations[savedLanguage]) {
      localStorage.setItem('makmex-language', 'es');
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

  // Helper to translate condition names by full name (tolerant to formatting/case variants)
  const translateConditionName = (fullConditionName) => {
    if (!fullConditionName) return fullConditionName;

    const normalized = String(fullConditionName).trim().toLowerCase();
    const nameMap = {
      'new': 'conditionAA',
      'new in box': 'conditionAA',
      'new (in box)': 'conditionAA',
      'new without a box': 'conditionA',
      'new (without a box)': 'conditionA',
      'pre-owned (minimal defects)': 'conditionB',
      'pre-owned (moderate wear)': 'conditionC',
      'used': 'conditionD',
      'used (notable touches)': 'conditionE',
      'very used': 'conditionF'
    };

    const key = nameMap[normalized];
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