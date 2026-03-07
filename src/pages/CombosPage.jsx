import { useMemo, useState, useEffect } from "react";
import ComboCard from "../components/ComboCard";
import FilterSidebar from "../components/FilterSidebar";
import { getCombos, getConditions } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";

export default function CombosPage() {
  const { t } = useLanguage();

  const [combos, setCombos] = useState([]);
  const [conditions, setConditions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [selectedConditions, setSelectedConditions] = useState(new Set());
  const [selectedLocations, setSelectedLocations] = useState(new Set());
  const [selectedProductTypes, setSelectedProductTypes] = useState(new Set());
  const [brandFilterMode, setBrandFilterMode] = useState("inclusive");
  const [showOnlyWithImages, setShowOnlyWithImages] = useState(false);

  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [priceInputs, setPriceInputs] = useState({ min: "", max: "" });

  const [sort, setSort] = useState("relevance");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [combosResult, conditionsResult] = await Promise.all([
          getCombos(),
          getConditions()
        ]);

        if (!combosResult.success) {
          throw new Error(`Combos: ${combosResult.error}`);
        }
        if (!conditionsResult.success) {
          throw new Error(`Conditions: ${conditionsResult.error}`);
        }

        setCombos(combosResult.data);
        setConditions(conditionsResult.data);

        if (combosResult.data && combosResult.data.length > 0) {
          const prices = combosResult.data.map((c) => c.price);
          const minPrice = Math.floor(Math.min(...prices));
          const maxPrice = Math.ceil(Math.max(...prices));
          setPriceRange({ min: minPrice, max: maxPrice });
          setPriceInputs({ min: minPrice.toString(), max: maxPrice.toString() });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredCombos = useMemo(() => {
    let items = [...combos];

    const minPrice = parseFloat(priceInputs.min) || 0;
    const maxPrice = parseFloat(priceInputs.max) || Infinity;
    items = items.filter((c) => c.price >= minPrice && c.price <= maxPrice);

    if (selectedBrands.size > 0) {
      if (brandFilterMode === "inclusive") {
        items = items.filter((c) => {
          const comboBrands = new Set();
          if (c.brand_name) comboBrands.add(c.brand_name);
          if (c.combo_items) {
            c.combo_items.forEach((item) => {
              const brandName = item.products?.brand_name || item.products?.brands?.name;
              if (brandName) {
                comboBrands.add(brandName);
              }
            });
          }
          return Array.from(selectedBrands).some((brand) => comboBrands.has(brand));
        });
      } else {
        items = items.filter((c) => {
          const comboBrands = new Set();
          if (c.brand_name) comboBrands.add(c.brand_name);
          if (c.combo_items) {
            c.combo_items.forEach((item) => {
              const brandName = item.products?.brand_name || item.products?.brands?.name;
              if (brandName) {
                comboBrands.add(brandName);
              }
            });
          }
          return Array.from(comboBrands).every((brand) => selectedBrands.has(brand)) && comboBrands.size > 0;
        });
      }
    }

    if (selectedConditions.size > 0) {
      items = items.filter((c) => {
        const comboConditions = new Set();
        if (c.combo_items) {
          c.combo_items.forEach((item) => {
            if (item.products?.conditions?.general_condition) {
              comboConditions.add(item.products.conditions.general_condition);
            }
          });
        }
        return Array.from(selectedConditions).some((condition) => comboConditions.has(condition));
      });
    }

    if (selectedLocations.size > 0) {
      items = items.filter((c) => selectedLocations.has(c.warehouse_location));
    }

    if (selectedProductTypes.size > 0) {
      items = items.filter((c) => {
        const comboProductTypes = new Set();
        if (c.combo_items) {
          c.combo_items.forEach((item) => {
            const productTypeName = item.products?.product_types?.name;
            if (productTypeName) {
              comboProductTypes.add(productTypeName);
            }
          });
        }
        return Array.from(selectedProductTypes).some((productType) => comboProductTypes.has(productType));
      });
    }

    // Use precomputed image presence from backend (same precedence as ItemDetailsPage).
    if (showOnlyWithImages) {
      items = items.filter((c) => {
        return Boolean(c.has_images || c.image_url || c.primary_image?.signed_url);
      });
    }

    if (sort === "price_asc") {
      items.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      items.sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      items.sort((a, b) => new Date(b.created_at || b.id) - new Date(a.created_at || a.id));
    }

    return items;
  }, [combos, selectedBrands, selectedConditions, selectedLocations, selectedProductTypes, sort, priceInputs, brandFilterMode, showOnlyWithImages]);

  // Pagination calculations
  const totalItems = filteredCombos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredCombos.slice(startIndex, endIndex);
  
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

  const availableFilterOptions = useMemo(() => {
    const inStockCombos = combos.filter((c) => c.in_stock);

    const allBrands = new Set();
    inStockCombos.forEach((c) => {
      if (c.brand_name) allBrands.add(c.brand_name);
      if (c.combo_items) {
        c.combo_items.forEach((item) => {
          const brandName = item.products?.brand_name || item.products?.brands?.name;
          if (brandName) {
            allBrands.add(brandName);
          }
        });
      }
    });

    const allConditions = new Set();
    inStockCombos.forEach((c) => {
      if (c.combo_items) {
        c.combo_items.forEach((item) => {
          if (item.products?.conditions?.general_condition) {
            allConditions.add(item.products.conditions.general_condition);
          }
        });
      }
    });

    const allProductTypes = new Set();
    inStockCombos.forEach((c) => {
      if (c.combo_items) {
        c.combo_items.forEach((item) => {
          const productTypeName = item.products?.product_types?.name;
          if (productTypeName) {
            allProductTypes.add(productTypeName);
          }
        });
      }
    });

    return {
      brands: Array.from(allBrands).sort(),
      conditions: conditions.filter((condition) => allConditions.has(condition.general_condition)),
      locations: Array.from(new Set(inStockCombos.map((c) => c.warehouse_location).filter(Boolean))).sort(),
      productTypes: Array.from(allProductTypes).sort()
    };
  }, [combos, conditions]);

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
        <h1 className="text-2xl font-bold">{t("combos")}</h1>
        <div className="text-makmex-muted">{t("loading")} {t("combos").toLowerCase()}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("combos")}</h1>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t("combos")}</h1>
          <p className="mt-1 text-sm text-makmex-muted">
            {t("loading") ? "Loading..." : `Showing ${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems} results`}
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
              <option value="relevance">{t("relevance")}</option>
              <option value="price_asc">{t("priceLowToHigh")}</option>
              <option value="price_desc">{t("priceHighToLow")}</option>
              <option value="newest">{t("newestFirst")}</option>
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

      {/* Main Content */}
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

        {/* Combos Grid */}
        <div className="flex-1">
          {currentItems.length === 0 ? (
            <div className="rounded-2xl border border-makmex-border bg-makmex-surface p-12 text-center">
              <h3 className="text-lg font-semibold text-makmex-text">{t("error")} {t("combos").toLowerCase()}</h3>
              <p className="mt-2 text-sm text-makmex-muted">
                Try adjusting your filters or check back later for new inventory.
              </p>
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3">
              {currentItems.map((combo) => (
                <ComboCard key={combo.id} {...combo} />
              ))}
            </section>
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
