import { useMemo, useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "../components/FilterSidebar";
import { getProducts, getBrands, getConditions, getWarehouses, getPowerSources } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";

export default function CategoryPage({ title = "Power Tools" }) {
  const { t } = useLanguage();  // FIXED: Added language support

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
  const [showOnlyWithImages, setShowOnlyWithImages] = useState(false);
  
  // Price range filter
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [priceInputs, setPriceInputs] = useState({ min: '', max: '' });

  // Sorting
  const [sort, setSort] = useState("relevance");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

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

    // FIXED: Images filter - only show items that have images (consistent with combos/kits)
    if (showOnlyWithImages) {
      items = items.filter((p) => {
        // Check if product has primary_image with signed_url or images array
        return p.primary_image?.signed_url || (p.images && p.images.length > 0);
      });
    }

    // Sorting
    if (sort === "price_asc") {
      items.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      items.sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      items.sort((a, b) => new Date(b.created_at || b.id) - new Date(a.created_at || a.id));
    }

    return items;
  }, [products, selectedBrands, selectedConditions, selectedPowerSources, selectedLocations, selectedProductTypes, showOnlyWithImages, sort, priceInputs]);

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

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const shownProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrands, selectedConditions, selectedPowerSources, selectedLocations, selectedProductTypes, showOnlyWithImages, sort, priceInputs]);

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // FIXED: Consolidated filter handlers to match FilterSidebar API
  const handleBrandChange = (brand) => {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  };

  const handleConditionChange = (condition) => {
    setSelectedConditions((prev) => {
      const next = new Set(prev);
      if (next.has(condition)) next.delete(condition);
      else next.add(condition);
      return next;
    });
  };

  const handleLocationChange = (location) => {
    setSelectedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(location)) next.delete(location);
      else next.add(location);
      return next;
    });
  };

  const handleProductTypeChange = (productType) => {
    setSelectedProductTypes((prev) => {
      const next = new Set(prev);
      if (next.has(productType)) next.delete(productType);
      else next.add(productType);
      return next;
    });
  };

  const handlePowerSourceChange = (powerSource) => {
    setSelectedPowerSources((prev) => {
      const next = new Set(prev);
      if (next.has(powerSource)) next.delete(powerSource);
      else next.add(powerSource);
      return next;
    });
  };

  const clearAllFilters = () => {
    setSelectedBrands(new Set());
    setSelectedConditions(new Set());
    setSelectedPowerSources(new Set());
    setSelectedLocations(new Set());
    setSelectedProductTypes(new Set());
    setShowOnlyWithImages(false);
    setSort("relevance");
    setCurrentPage(1);
    
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
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-makmex-muted">
            {loading ? t('loading') + "..." : `${t('showing') || 'Showing'} ${startIndex + 1}-${Math.min(endIndex, totalItems)} ${t('of') || 'of'} ${totalItems} ${t('results') || 'results'}`}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Items per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-makmex-muted">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="rounded-lg border border-makmex-border bg-makmex-surface px-3 py-2 text-sm font-semibold text-makmex-text focus:border-makmex-orange focus:outline-none"
            >
              <option value={6}>6 per page</option>
              <option value={12}>12 per page</option>
              <option value={24}>24 per page</option>
              <option value={48}>48 per page</option>
            </select>
          </div>

          {/* Sort selector */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              disabled={loading}
              className="rounded-xl border border-makmex-border bg-makmex-surface px-4 py-2 pr-10 text-sm disabled:opacity-50 appearance-none w-full"
            >
              <option value="relevance">{t('relevance')}</option>
              <option value="price_asc">{t('priceLowToHigh')}</option>
              <option value="price_desc">{t('priceHighToLow')}</option>
              <option value="newest">{t('newestFirst')}</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-makmex-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Top Pagination */}
      {!loading && !error && totalPages > 1 && (
        <PaginationControls 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={goToPage}
          onPreviousPage={goToPreviousPage}
          onNextPage={goToNextPage}
        />
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800">{t('error')} {t('loading')} {t('products')}</h3>
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
            {t('loading')} {t('products').toLowerCase()}...
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <div className="flex gap-6">
          {/* FIXED: Now uses FilterSidebar component with language support */}
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
              selectedPowerSources={selectedPowerSources}
              handlePowerSourceChange={handlePowerSourceChange}
              availableFilterOptions={availableFilterOptions}
              clearAllFilters={clearAllFilters}
              showOnlyWithImages={showOnlyWithImages}
              setShowOnlyWithImages={setShowOnlyWithImages}
            />
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
              <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3">
                {shownProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </section>
            )}
          </div>
        </div>
      )}

      {/* Bottom Pagination */}
      {!loading && !error && totalPages > 1 && (
        <PaginationControls 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={goToPage}
          onPreviousPage={goToPreviousPage}
          onNextPage={goToNextPage}
        />
      )}
    </div>
  );
}

/* ---------------- Helpers ---------------- */

// Pagination component for CategoryPage
function PaginationControls({ currentPage, totalPages, totalItems, onPageChange, onPreviousPage, onNextPage }) {
  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if we have 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        startPage = 2;
        endPage = Math.min(4, totalPages - 1);
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3);
        endPage = totalPages - 1;
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add middle pages (ensuring we don't duplicate first/last page)
      for (let i = startPage; i <= endPage; i++) {
        if (i > 1 && i < totalPages) {
          pages.push(i);
        }
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
      <p className="text-sm text-makmex-muted">
        Page {currentPage} of {totalPages} ({totalItems} total items)
      </p>
      
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={onPreviousPage}
          disabled={currentPage === 1}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            currentPage === 1
              ? 'bg-makmex-surface text-makmex-muted cursor-not-allowed border border-makmex-border'
              : 'bg-makmex-panel text-makmex-text hover:bg-makmex-orange hover:text-black border border-makmex-border hover:border-makmex-orange'
          }`}
        >
          Previous
        </button>
        
        {/* Page numbers */}
        <div className="flex gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-3 py-2 text-sm text-makmex-muted">
                  ...
                </span>
              );
            }
            
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  currentPage === page
                    ? 'bg-makmex-orange text-black border border-makmex-orange'
                    : 'bg-makmex-panel text-makmex-text hover:bg-makmex-orange hover:text-black border border-makmex-border hover:border-makmex-orange'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>
        
        {/* Next button */}
        <button
          onClick={onNextPage}
          disabled={currentPage === totalPages}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            currentPage === totalPages
              ? 'bg-makmex-surface text-makmex-muted cursor-not-allowed border border-makmex-border'
              : 'bg-makmex-panel text-makmex-text hover:bg-makmex-orange hover:text-black border border-makmex-border hover:border-makmex-orange'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
