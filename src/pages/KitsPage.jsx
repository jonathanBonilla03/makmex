import { useMemo, useState, useEffect } from "react";
import KitCard from "../components/KitCard";
import FilterSidebar from "../components/FilterSidebar";
import { getKits, getBrands, getWarehouses, getProductTypes, getConditions } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";

export default function KitsPage({ title = "Kits" }) {
  const { t } = useLanguage();
  
  // Data state
  const [kits, setKits] = useState([]);
  const [conditions, setConditions] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [selectedConditions, setSelectedConditions] = useState(new Set());
  const [selectedLocations, setSelectedLocations] = useState(new Set());
  const [selectedProductTypes, setSelectedProductTypes] = useState(new Set());
  // Price range filter
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [priceInputs, setPriceInputs] = useState({ min: '', max: '' });
  const [brandFilterMode, setBrandFilterMode] = useState('inclusive');

  // Sorting
  const [sort, setSort] = useState("relevance"); // relevance | price_asc | price_desc | newest

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        // Load all data in parallel
        const [
          kitsResult,
          brandsResult,
          warehousesResult,
          productTypesResult,
          conditionsResult
        ] = await Promise.all([
          getKits(),
          getBrands(),
          getWarehouses(),
          getProductTypes(),
          getConditions()
        ]);

        if (!kitsResult.success) {
          throw new Error(`Kits: ${kitsResult.error}`);
        }
        if (!brandsResult.success) {
          throw new Error(`Brands: ${brandsResult.error}`);
        }
        if (!warehousesResult.success) {
          throw new Error(`Warehouses: ${warehousesResult.error}`);
        }
        if (!productTypesResult.success) {
          throw new Error(`Product Types: ${productTypesResult.error}`);
        }
        if (!conditionsResult.success) {
          throw new Error(`Conditions: ${conditionsResult.error}`);
        }

        setKits(kitsResult.data);
        setConditions(conditionsResult.data);
        
        // Set price range bounds based on actual kit prices
        if (kitsResult.data && kitsResult.data.length > 0) {
          const prices = kitsResult.data.map(k => k.price);
          const minPrice = Math.floor(Math.min(...prices));
          const maxPrice = Math.ceil(Math.max(...prices));
          setPriceRange({ min: minPrice, max: maxPrice });
          setPriceInputs({ min: minPrice.toString(), max: maxPrice.toString() });
        }
      } catch (err) {
        setError(err.message);
        console.error("Error loading kits page data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredKits = useMemo(() => {
    let items = [...kits];

    // Price range filter
    const minPrice = parseFloat(priceInputs.min) || 0;
    const maxPrice = parseFloat(priceInputs.max) || Infinity;
    items = items.filter((k) => k.price >= minPrice && k.price <= maxPrice);

    // Brand filter
    if (selectedBrands.size > 0) {
      if (brandFilterMode === 'inclusive') {
        // Inclusive: kit matches if it has ANY of the selected brands in its items
        items = items.filter((k) => {
          // Get all brands from kit items
          const kitBrands = new Set();
          if (k.kit_items) {
            k.kit_items.forEach(item => {
              if (item.products?.brand_name) {
                kitBrands.add(item.products.brand_name);
              }
            });
          }
          // Also check kit's own brand
          if (k.brand_name) {
            kitBrands.add(k.brand_name);
          }
          
          // Check if any selected brand is in the kit
          return Array.from(selectedBrands).some(brand => kitBrands.has(brand));
        });
      } else {
        // Exclusive: kit matches ONLY if ALL its brands are in the selected brands
        items = items.filter((k) => {
          // Get all brands from kit items
          const kitBrands = new Set();
          if (k.kit_items) {
            k.kit_items.forEach(item => {
              if (item.products?.brand_name) {
                kitBrands.add(item.products.brand_name);
              }
            });
          }
          // Also check kit's own brand
          if (k.brand_name) {
            kitBrands.add(k.brand_name);
          }
          
          // Check if ALL kit brands are in selected brands
          return Array.from(kitBrands).every(brand => selectedBrands.has(brand)) && kitBrands.size > 0;
        });
      }
    }

    // Condition filter
    if (selectedConditions.size > 0) {
      items = items.filter((k) => {
        // Get all conditions from kit items
        const kitConditions = new Set();
        if (k.kit_items) {
          k.kit_items.forEach(item => {
            if (item.products?.conditions?.general_condition) {
              kitConditions.add(item.products.conditions.general_condition);
            }
          });
        }
        // Check if any selected condition is in the kit
        return Array.from(selectedConditions).some(condition => kitConditions.has(condition));
      });
    }

    // Location filter
    if (selectedLocations.size > 0) {
      items = items.filter((k) => selectedLocations.has(k.warehouse_location));
    }

    // Product Type filter
    if (selectedProductTypes.size > 0) {
      items = items.filter((k) => selectedProductTypes.has(k.product_type_name));
    }

    // Sorting
    if (sort === "price_asc") {
      items.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      items.sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      // Sort by creation date if available, otherwise by ID
      items.sort((a, b) => new Date(b.created_at || b.id) - new Date(a.created_at || a.id));
    } // relevance = keep original order

    return items;
  }, [kits, selectedBrands, selectedConditions, selectedLocations, selectedProductTypes, sort, priceInputs, brandFilterMode]);

  // Calculate available filter options based on current kits in stock
  const availableFilterOptions = useMemo(() => {
    // Only consider kits that are in stock
    const inStockKits = kits.filter(k => k.in_stock);
    
    // Get all brands from kits and their items
    const allBrands = new Set();
    inStockKits.forEach(k => {
      if (k.brand_name) allBrands.add(k.brand_name);
      if (k.kit_items) {
        k.kit_items.forEach(item => {
          if (item.products?.brand_name) {
            allBrands.add(item.products.brand_name);
          }
        });
      }
    });
    
    // Get all conditions from kit items
    const allConditions = new Set();
    inStockKits.forEach(k => {
      if (k.kit_items) {
        k.kit_items.forEach(item => {
          if (item.products?.conditions?.general_condition) {
            allConditions.add(item.products.conditions.general_condition);
          }
        });
      }
    });
    
    return {
      brands: Array.from(allBrands).sort(),
      conditions: conditions.filter(condition => allConditions.has(condition.general_condition)),
      locations: Array.from(new Set(inStockKits.map(k => k.warehouse_location).filter(Boolean))).sort(),
      productTypes: Array.from(new Set(inStockKits.map(k => k.product_type_name))).sort()
    };
  }, [kits, conditions]);

  const shownKits = filteredKits.slice(0, 12);

  // Filter handlers
  const handleBrandChange = (brand) => {
    setSelectedBrands((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(brand)) {
        newSet.delete(brand);
      } else {
        newSet.add(brand);
      }
      return newSet;
    });
  };

  const handleConditionChange = (condition) => {
    setSelectedConditions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(condition)) {
        newSet.delete(condition);
      } else {
        newSet.add(condition);
      }
      return newSet;
    });
  };

  const handleLocationChange = (location) => {
    setSelectedLocations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(location)) {
        newSet.delete(location);
      } else {
        newSet.add(location);
      }
      return newSet;
    });
  };

  const handleProductTypeChange = (type) => {
    setSelectedProductTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const clearAllFilters = () => {
    setSelectedBrands(new Set());
    setSelectedConditions(new Set());
    setSelectedLocations(new Set());
    setSelectedProductTypes(new Set());
    setPriceInputs({ min: priceRange.min.toString(), max: priceRange.max.toString() });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t('kits')}</h1>
        <div className="text-makmex-muted">{t('loading')} {t('kits').toLowerCase()}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t('kits')}</h1>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="font-semibold text-red-400">{t('error')} {t('kits').toLowerCase()}</div>
          <div className="text-sm text-red-300 mt-1">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('kits')}</h1>
        <div className="text-sm text-makmex-muted">
          {filteredKits.length} {filteredKits.length === 1 ? t('item') : t('items')} {t('available')}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <aside className="w-72 flex-shrink-0">
          <FilterSidebar
            priceRange={priceRange}
            priceInputs={priceInputs}
            setPriceInputs={setPriceInputs}
            selectedBrands={selectedBrands}
            handleBrandChange={handleBrandChange}
            selectedConditions={selectedConditions}
            handleConditionChange={handleConditionChange}
            selectedLocations={selectedLocations}
            handleLocationChange={handleLocationChange}
            selectedProductTypes={selectedProductTypes}
            handleProductTypeChange={handleProductTypeChange}
            brandFilterMode={brandFilterMode}
            setBrandFilterMode={setBrandFilterMode}
            availableFilterOptions={availableFilterOptions}
            clearAllFilters={clearAllFilters}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Sort Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-makmex-muted">{t('sortBy')}</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-makmex-border bg-makmex-surface px-3 py-2 text-sm"
              >
                <option value="relevance">{t('relevance')}</option>
                <option value="price_asc">{t('priceLowToHigh')}</option>
                <option value="price_desc">{t('priceHighToLow')}</option>
                <option value="newest">{t('newestFirst')}</option>
              </select>
            </div>
          </div>

          {/* Kits Grid */}
          {shownKits.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-makmex-muted">No {t('kits').toLowerCase()} match your {t('filters').toLowerCase()}</div>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-3 lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1">
              {shownKits.map((kit) => (
                <KitCard key={kit.id} {...kit} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}