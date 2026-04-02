import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../translations/en.js';
import { es } from '../translations/es.js';

const LanguageContext = createContext();

const translations = {
  en,
  es
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('makmex-language');
    if (savedLanguage) {
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