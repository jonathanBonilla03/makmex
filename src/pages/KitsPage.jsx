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
  const [showOnlyWithImages, setShowOnlyWithImages] = useState(false);
  // Price range filter
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [priceInputs, setPriceInputs] = useState({ min: '', max: '' });
  const [brandFilterMode, setBrandFilterMode] = useState('inclusive');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Sorting
  const [sort, setSort] = useState("relevance");

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

    // Use precomputed image presence from backend (same precedence as ItemDetailsPage).
    if (showOnlyWithImages) {
      items = items.filter((k) => {
        return Boolean(k.has_images || k.image_url || k.primary_image?.signed_url);
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
  }, [kits, selectedBrands, selectedConditions, selectedLocations, selectedProductTypes, sort, priceInputs, brandFilterMode, showOnlyWithImages]);

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

  // Pagination calculations
  const totalItems = filteredKits.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredKits.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrands, selectedConditions, selectedLocations, selectedProductTypes, sort, priceInputs, brandFilterMode, showOnlyWithImages]);
  
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

  const shownKits = currentItems;

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
    setShowOnlyWithImages(false);
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
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('kits')}</h1>
          <p className="mt-1 text-sm text-makmex-muted">
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} results
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

          {/* Sorting */}
          <div className="relative">
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
      </div>

      {/* Top Pagination */}
      {totalPages > 1 && (
        <PaginationControls 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={goToPage}
          onPreviousPage={goToPreviousPage}
          onNextPage={goToNextPage}
        />
      )}

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
            showOnlyWithImages={showOnlyWithImages}
            setShowOnlyWithImages={setShowOnlyWithImages}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {shownKits.length === 0 ? (
            <div className="rounded-2xl border border-makmex-border bg-makmex-surface p-12 text-center">
              <h3 className="text-lg font-semibold text-makmex-text">No kits found</h3>
              <p className="mt-2 text-sm text-makmex-muted">
                Try adjusting your filters or check back later for new inventory.
              </p>
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

      {/* Bottom Pagination */}
      {totalPages > 1 && (
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

function PaginationControls({ currentPage, totalPages, totalItems, onPageChange, onPreviousPage, onNextPage }) {
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 3) {
        startPage = 2;
        endPage = Math.min(4, totalPages - 1);
      }
      
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3);
        endPage = totalPages - 1;
      }
      
      if (startPage > 2) {
        pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        if (i > 1 && i < totalPages) {
          pages.push(i);
        }
      }
      
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
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
