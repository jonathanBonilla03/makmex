import { useMemo, useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import { getProducts, getBrands, getConditions, getWarehouses, getPowerSources } from "../lib/supabase";

export default function CategoryPage({ title = "Power Tools" }) {
  // Data state
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [powerSources, setPowerSources] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [selectedConditions, setSelectedConditions] = useState(new Set());
  const [selectedPowerSources, setSelectedPowerSources] = useState(new Set());
  const [selectedLocations, setSelectedLocations] = useState(new Set());
  const [selectedProductTypes, setSelectedProductTypes] = useState(new Set());
  
  // Price range filter
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [priceInputs, setPriceInputs] = useState({ min: '', max: '' });
  
  // Filter dropdown states (which sections are expanded)
  const [expandedSections, setExpandedSections] = useState(new Set(['brands'])); // Start with brands expanded

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
          productsResult,
          brandsResult,
          conditionsResult,
          warehousesResult,
          powerSourcesResult
        ] = await Promise.all([
          getProducts(),
          getBrands(),
          getConditions(),
          getWarehouses(),
          getPowerSources()
        ]);

        if (!productsResult.success) {
          throw new Error(`Products: ${productsResult.error}`);
        }
        if (!brandsResult.success) {
          throw new Error(`Brands: ${brandsResult.error}`);
        }
        if (!conditionsResult.success) {
          throw new Error(`Conditions: ${conditionsResult.error}`);
        }
        if (!warehousesResult.success) {
          throw new Error(`Warehouses: ${warehousesResult.error}`);
        }
        if (!powerSourcesResult.success) {
          throw new Error(`Power Sources: ${powerSourcesResult.error}`);
        }

        setProducts(productsResult.data);
        setBrands(brandsResult.data);
        setConditions(conditionsResult.data);
        setWarehouses(warehousesResult.data);
        setPowerSources(powerSourcesResult.data);
        
        // Set price range bounds based on actual product prices
        if (productsResult.data && productsResult.data.length > 0) {
          const prices = productsResult.data.map(p => p.price);
          const minPrice = Math.floor(Math.min(...prices));
          const maxPrice = Math.ceil(Math.max(...prices));
          setPriceRange({ min: minPrice, max: maxPrice });
          setPriceInputs({ min: minPrice.toString(), max: maxPrice.toString() });
        }
      } catch (err) {
        setError(err.message);
        console.error("Error loading category page data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    let items = [...products];

    // Price range filter
    const minPrice = parseFloat(priceInputs.min) || 0;
    const maxPrice = parseFloat(priceInputs.max) || Infinity;
    items = items.filter((p) => p.price >= minPrice && p.price <= maxPrice);

    // Brand filter (using brand_name from JOIN)
    if (selectedBrands.size > 0) {
      items = items.filter((p) => selectedBrands.has(p.brand_name));
    }

    // Condition filter (using condition_name from JOIN)
    if (selectedConditions.size > 0) {
      items = items.filter((p) => selectedConditions.has(p.condition_name));
    }

    // Power source filter
    if (selectedPowerSources.size > 0) {
      items = items.filter((p) => {
        if (!p.power_source) return false;
        return selectedPowerSources.has(p.power_source);
      });
    }

    // Location filter
    if (selectedLocations.size > 0) {
      items = items.filter((p) => selectedLocations.has(p.warehouse_location));
    }

    // Product Type filter
    if (selectedProductTypes.size > 0) {
      items = items.filter((p) => selectedProductTypes.has(p.product_type_name));
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
  }, [products, selectedBrands, selectedConditions, selectedPowerSources, selectedLocations, selectedProductTypes, sort, priceInputs]);

  // Calculate available filter options based on current products in stock
  const availableFilterOptions = useMemo(() => {
    // Only consider products that are in stock
    const inStockProducts = products.filter(p => p.in_stock);
    
    return {
      brands: Array.from(new Set(inStockProducts.map(p => p.brand_name))).sort(),
      conditions: conditions.filter(condition => 
        inStockProducts.some(p => p.condition_name === condition.general_condition)
      ).sort((a, b) => {
        const order = ['AA', 'A', 'B', 'C', 'D', 'E', 'F'];
        return order.indexOf(a.id) - order.indexOf(b.id);
      }),
      productTypes: Array.from(new Set(inStockProducts.map(p => p.product_type_name))).sort(),
      powerSources: powerSources.filter(powerSource => 
        inStockProducts.some(p => p.power_source === (powerSource.value || powerSource))
      ),
      locations: Array.from(new Set(inStockProducts.map(p => p.warehouse_location).filter(Boolean))).sort()
    };
  }, [products, conditions, powerSources]);

  const shownProducts = filteredProducts.slice(0, 12);

  const toggleSetValue = (setSetter, currentSet, value) => {
    const next = new Set(currentSet);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setSetter(next);
  };

  const toggleSection = (sectionId) => {
    const next = new Set(expandedSections);
    if (next.has(sectionId)) next.delete(sectionId);
    else next.add(sectionId);
    setExpandedSections(next);
  };

  const handlePriceRangeChange = (type, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    const maxAllowed = priceRange.max;
    const minAllowed = priceRange.min;
    
    setPriceInputs(prev => {
      const currentMin = parseInt(prev.min) || 0;
      const currentMax = parseInt(prev.max) || maxAllowed;
      
      if (type === 'min') {
        // If new min is greater than current max
        if (numValue > currentMax) {
          // If we can increase max, do so
          if (numValue < maxAllowed) {
            return { min: numValue.toString(), max: (numValue + 1).toString() };
          } else {
            // Max is at limit, set min to max - 1 or keep current min if max is at minimum
            const adjustedMin = Math.min(numValue, maxAllowed - 1, maxAllowed);
            return { ...prev, min: Math.max(adjustedMin, minAllowed).toString() };
          }
        }
        return { ...prev, min: numValue.toString() };
      } else {
        // type === 'max'
        // If new max is less than current min
        if (numValue < currentMin) {
          // If we can decrease min, do so
          if (numValue > minAllowed) {
            return { min: (numValue - 1).toString(), max: numValue.toString() };
          } else {
            // Min is at limit, set max to min + 1 or keep current max if min is at maximum
            const adjustedMax = Math.max(numValue, minAllowed + 1, minAllowed);
            return { ...prev, max: Math.min(adjustedMax, maxAllowed).toString() };
          }
        }
        return { ...prev, max: numValue.toString() };
      }
    });
  };

  const handlePriceSliderChange = (type, value) => {
    const numValue = parseInt(value);
    const maxAllowed = priceRange.max;
    const minAllowed = priceRange.min;
    
    setPriceInputs(prev => {
      const currentMin = parseInt(prev.min) || 0;
      const currentMax = parseInt(prev.max) || maxAllowed;
      
      if (type === 'min') {
        // If new min is greater than current max
        if (numValue > currentMax) {
          // If we can increase max, do so
          if (numValue < maxAllowed) {
            return { min: numValue.toString(), max: (numValue + 1).toString() };
          } else {
            // Max is at limit, constrain min to not exceed max
            return { ...prev, min: Math.min(numValue, currentMax).toString() };
          }
        }
        return { ...prev, min: numValue.toString() };
      } else {
        // type === 'max'  
        // If new max is less than current min
        if (numValue < currentMin) {
          // If we can decrease min, do so
          if (numValue > minAllowed) {
            return { min: (numValue - 1).toString(), max: numValue.toString() };
          } else {
            // Min is at limit, constrain max to not go below min
            return { ...prev, max: Math.max(numValue, currentMin).toString() };
          }
        }
        return { ...prev, max: numValue.toString() };
      }
    });
  };

  const clearFilters = () => {
    setSelectedBrands(new Set());
    setSelectedConditions(new Set());
    setSelectedPowerSources(new Set());
    setSelectedLocations(new Set());
    setSelectedProductTypes(new Set());
    setSort("relevance");
    
    // Reset price range to full range
    if (products.length > 0) {
      const prices = products.map(p => p.price);
      const minPrice = Math.floor(Math.min(...prices));
      const maxPrice = Math.ceil(Math.max(...prices));
      setPriceInputs({ min: minPrice.toString(), max: maxPrice.toString() });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-makmex-muted">
            {loading ? "Loading..." : `Showing ${filteredProducts.length} results`}
          </p>
        </div>

        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-makmex-border bg-makmex-surface px-4 py-2 pr-10 text-sm disabled:opacity-50 appearance-none w-full"
          >
            <option value="relevance">Sort by relevance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-4 h-4 text-makmex-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800">Error Loading Products</h3>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="flex items-center gap-2 text-makmex-muted">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-makmex-orange border-t-transparent"></div>
            Loading products...
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <aside className="w-72 flex-shrink-0">
            <div className="sticky top-6 rounded-2xl border border-makmex-border bg-makmex-surface p-5">
              <h2 className="mb-5 text-lg font-bold">Filters</h2>

              <div className="space-y-3 text-sm text-makmex-text">
                <FilterGroup 
                  title="Brand" 
                  sectionId="brands"
                  isExpanded={expandedSections.has('brands')}
                  onToggle={() => toggleSection('brands')}
                  selectedCount={selectedBrands.size}
                >
                  {availableFilterOptions.brands.map((brandName) => {
                    // Find the brand object for the key
                    const brand = brands.find(b => b.name === brandName);
                    return (
                      <Check
                        key={brand?.id || brandName}
                        label={brandName}
                        checked={selectedBrands.has(brandName)}
                        onChange={() =>
                          toggleSetValue(setSelectedBrands, selectedBrands, brandName)
                        }
                      />
                    );
                  })}
                </FilterGroup>

                <FilterGroup 
                  title="Price Range" 
                  sectionId="priceRange"
                  isExpanded={expandedSections.has('priceRange')}
                  onToggle={() => toggleSection('priceRange')}
                  selectedCount={0}
                >
                  <div className="space-y-4">
                    {/* Manual Input Fields */}
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-makmex-muted mb-1">Min</label>
                        <input
                          type="number"
                          min="0"
                          value={priceInputs.min}
                          onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-makmex-border bg-makmex-surface text-makmex-text"
                        />
                      </div>
                      <span className="text-makmex-muted mt-4">-</span>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-makmex-muted mb-1">Max</label>
                        <input
                          type="number"
                          min="0"
                          value={priceInputs.max}
                          onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-makmex-border bg-makmex-surface text-makmex-text"
                        />
                      </div>
                    </div>
                    
                    {/* Range Sliders */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-makmex-muted mb-1">
                          Min: ${priceInputs.min}
                        </label>
                        <input
                          type="range"
                          min={priceRange.min}
                          max={priceRange.max}
                          value={priceInputs.min}
                          onChange={(e) => handlePriceSliderChange('min', e.target.value)}
                          className="w-full h-2 bg-makmex-border rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-makmex-muted mb-1">
                          Max: ${priceInputs.max}
                        </label>
                        <input
                          type="range"
                          min={priceRange.min}
                          max={priceRange.max}
                          value={priceInputs.max}
                          onChange={(e) => handlePriceSliderChange('max', e.target.value)}
                          className="w-full h-2 bg-makmex-border rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    </div>
                    
                    {/* Range Display */}
                    <div className="text-xs text-center text-makmex-muted bg-makmex-panel px-2 py-1 rounded">
                      ${priceInputs.min} - ${priceInputs.max}
                    </div>
                  </div>
                </FilterGroup>

                <FilterGroup 
                  title="Condition" 
                  sectionId="conditions"
                  isExpanded={expandedSections.has('conditions')}
                  onToggle={() => toggleSection('conditions')}
                  selectedCount={selectedConditions.size}
                >
                  {availableFilterOptions.conditions.map((condition) => (
                    <Check
                      key={condition.id}
                      label={condition.general_condition}
                      checked={selectedConditions.has(condition.general_condition)}
                      onChange={() =>
                        toggleSetValue(setSelectedConditions, selectedConditions, condition.general_condition)
                      }
                    />
                  ))}
                </FilterGroup>

                <FilterGroup 
                  title="Product Type" 
                  sectionId="productTypes"
                  isExpanded={expandedSections.has('productTypes')}
                  onToggle={() => toggleSection('productTypes')}
                  selectedCount={selectedProductTypes.size}
                >
                  {availableFilterOptions.productTypes.map((productType) => (
                    <Check
                      key={productType}
                      label={productType}
                      checked={selectedProductTypes.has(productType)}
                      onChange={() =>
                        toggleSetValue(setSelectedProductTypes, selectedProductTypes, productType)
                      }
                    />
                  ))}
                </FilterGroup>

                <FilterGroup 
                  title="Power Source" 
                  sectionId="powerSources"
                  isExpanded={expandedSections.has('powerSources')}
                  onToggle={() => toggleSection('powerSources')}
                  selectedCount={selectedPowerSources.size}
                >
                  {availableFilterOptions.powerSources.map((powerSource) => (
                    <Check
                      key={powerSource.value || powerSource}
                      label={powerSource.display || powerSource}
                      checked={selectedPowerSources.has(powerSource.value || powerSource)}
                      onChange={() =>
                        toggleSetValue(setSelectedPowerSources, selectedPowerSources, powerSource.value || powerSource)
                      }
                    />
                  ))}
                </FilterGroup>

                <FilterGroup 
                  title="Location" 
                  sectionId="locations"
                  isExpanded={expandedSections.has('locations')}
                  onToggle={() => toggleSection('locations')}
                  selectedCount={selectedLocations.size}
                >
                  {availableFilterOptions.locations.map((warehouseId) => {
                    // Find the warehouse name for display
                    const warehouse = warehouses.find(w => w.id === warehouseId);
                    const displayName = warehouse ? `${warehouseId} - ${warehouse.name}` : warehouseId;
                    
                    return (
                      <Check
                        key={warehouseId}
                        label={displayName}
                        checked={selectedLocations.has(warehouseId)}
                        onChange={() =>
                          toggleSetValue(setSelectedLocations, selectedLocations, warehouseId)
                        }
                      />
                    );
                  })}
                </FilterGroup>

                <button
                  onClick={clearFilters}
                  className="mt-4 w-full rounded-xl border border-makmex-border bg-makmex-panel px-3 py-2 text-sm font-semibold text-makmex-muted hover:border-makmex-orange/60 hover:text-makmex-text"
                >
                  Clear filters
                </button>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {shownProducts.length === 0 ? (
              <div className="rounded-2xl border border-makmex-border bg-makmex-surface p-12 text-center">
                <h3 className="text-lg font-semibold text-makmex-text">No products found</h3>
                <p className="mt-2 text-sm text-makmex-muted">
                  Try adjusting your filters or check back later for new inventory.
                </p>
              </div>
            ) : (
              <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {shownProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </section>
            )}
          </div>
        </div>
      )}

      {/* Pagination placeholder (when not loading and has products) */}
      {!loading && !error && shownProducts.length > 0 && (
        <div className="flex justify-center gap-2 pt-2">
          {["1", "2", "3", "Next"].map((p) => (
            <button
              key={p}
              className="rounded-xl border border-makmex-border bg-makmex-surface px-4 py-2 text-sm font-semibold text-makmex-muted hover:border-makmex-orange hover:text-makmex-text"
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function FilterGroup({ title, children, sectionId, isExpanded, onToggle, selectedCount }) {
  return (
    <div className="border border-makmex-border rounded-xl bg-makmex-panel">
      {/* Header - Always visible */}
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-makmex-surface transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-wide text-makmex-muted">
            {title}
          </span>
          {selectedCount > 0 && (
            <span className="bg-makmex-orange text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {selectedCount}
            </span>
          )}
        </div>
        <svg 
          className={`w-4 h-4 text-makmex-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Content - Collapsible */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 max-h-56 overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-makmex-muted hover:text-makmex-text leading-relaxed">
      <input
        type="checkbox"
        className="accent-makmex-orange flex-shrink-0"
        checked={checked}
        onChange={onChange}
      />
      <span className="break-words">{label}</span>
    </label>
  );
}
