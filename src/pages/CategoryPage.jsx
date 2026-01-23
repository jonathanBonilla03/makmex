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
  }, [products, selectedBrands, selectedConditions, selectedPowerSources, selectedLocations, selectedProductTypes, sort]);

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

  const clearFilters = () => {
    setSelectedBrands(new Set());
    setSelectedConditions(new Set());
    setSelectedPowerSources(new Set());
    setSelectedLocations(new Set());
    setSelectedProductTypes(new Set());
    setSort("relevance");
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

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          disabled={loading}
          className="rounded-xl border border-makmex-border bg-makmex-surface px-3 py-2 text-sm disabled:opacity-50"
        >
          <option value="relevance">Sort by relevance</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
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
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-6 rounded-2xl border border-makmex-border bg-makmex-surface p-4">
              <h2 className="mb-4 font-bold">Filters</h2>

              <div className="space-y-4 text-sm text-makmex-text">
                <FilterGroup 
                  title="Brand" 
                  sectionId="brands"
                  isExpanded={expandedSections.has('brands')}
                  onToggle={() => toggleSection('brands')}
                  selectedCount={selectedBrands.size}
                >
                  {brands.map((brand) => (
                    <Check
                      key={brand.id}
                      label={brand.name}
                      checked={selectedBrands.has(brand.name)}
                      onChange={() =>
                        toggleSetValue(setSelectedBrands, selectedBrands, brand.name)
                      }
                    />
                  ))}
                </FilterGroup>

                <FilterGroup 
                  title="Condition" 
                  sectionId="conditions"
                  isExpanded={expandedSections.has('conditions')}
                  onToggle={() => toggleSection('conditions')}
                  selectedCount={selectedConditions.size}
                >
                  {conditions.map((condition) => (
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
                  {conditions.length > 0 && (
                    <>
                      {Array.from(new Set(products.map(p => p.product_type_name))).sort().map((productType) => (
                        <Check
                          key={productType}
                          label={productType}
                          checked={selectedProductTypes.has(productType)}
                          onChange={() =>
                            toggleSetValue(setSelectedProductTypes, selectedProductTypes, productType)
                          }
                        />
                      ))}
                    </>
                  )}
                </FilterGroup>

                <FilterGroup 
                  title="Power Source" 
                  sectionId="powerSources"
                  isExpanded={expandedSections.has('powerSources')}
                  onToggle={() => toggleSection('powerSources')}
                  selectedCount={selectedPowerSources.size}
                >
                  {powerSources.map((powerSource) => (
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
                  {Array.from(new Set(products.map(p => p.warehouse_location).filter(Boolean))).sort().map((warehouseId) => {
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
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        className="w-full flex items-center justify-between p-3 text-left hover:bg-makmex-surface transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-makmex-muted">
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
        <div className="px-3 pb-3 space-y-2 max-h-48 overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-makmex-muted hover:text-makmex-text">
      <input
        type="checkbox"
        className="accent-makmex-orange"
        checked={checked}
        onChange={onChange}
      />
      {label}
    </label>
  );
}
