import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ItemCard from "../components/ItemCard";
import FilterSidebar from "../components/FilterSidebar";
import { getProducts, getCombos, getKits, getConditions, getPowerSources } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";
import { useLocations } from "../context/LocationContext";

const CONDITION_ORDER = ['AA', 'A', 'B', 'C', 'D', 'E', 'F'];

const getSubItems = (item) => {
  if (item.type === 'combo') return item.combo_items || [];
  if (item.type === 'kit') return item.kit_items || [];
  return [];
};

const getItemBrands = (item) => {
  const values = new Set();
  if (item.brand_name) values.add(item.brand_name);

  getSubItems(item).forEach((subItem) => {
    const nestedBrand = subItem.products?.brand_name || subItem.products?.brands?.name;
    if (nestedBrand) values.add(nestedBrand);
  });

  return values;
};

const getItemConditions = (item) => {
  const values = new Set();
  if (item.condition_name) values.add(item.condition_name);

  getSubItems(item).forEach((subItem) => {
    const nestedCondition = subItem.products?.condition_name || subItem.products?.conditions?.general_condition;
    if (nestedCondition) values.add(nestedCondition);
  });

  return values;
};

const getItemProductTypes = (item) => {
  const values = new Set();
  if (item.product_type_name) values.add(item.product_type_name);

  getSubItems(item).forEach((subItem) => {
    const nestedType = subItem.products?.product_type_name || subItem.products?.product_types?.name;
    if (nestedType) values.add(nestedType);
  });

  return values;
};

const getItemPowerSources = (item) => {
  const values = new Set();
  if (item.power_source) values.add(item.power_source);

  getSubItems(item).forEach((subItem) => {
    const nestedPower = subItem.products?.power_source;
    if (nestedPower) values.add(nestedPower);
  });

  return values;
};

const hasItemImage = (item) => {
  if (item.primary_image?.public_url || item.image_url) return true;
  if (item.images && item.images.length > 0) return true;

  const subHasImage = getSubItems(item).some((subItem) => {
    if (subItem.products?.primary_image?.public_url || subItem.products?.image_url) return true;
    return Boolean(subItem.products?.images?.length);
  });

  return subHasImage;
};

const normalizeSearchText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const buildSearchBlob = (item) => {
  const rootParts = [
    item.name,
    item.description,
    item.display_sku,
    item.model,
    item.brand_name,
    item.power_source,
    item.product_type_name,
    item.condition_name,
    item.warehouse_location
  ];

  const nestedParts = getSubItems(item).flatMap((subItem) => {
    const nestedProduct = subItem.products || {};
    return [
      nestedProduct.name,
      nestedProduct.description,
      nestedProduct.display_sku,
      nestedProduct.model,
      nestedProduct.brand_name,
      nestedProduct.product_type_name,
      nestedProduct.power_source,
      nestedProduct.condition_name
    ];
  });

  const base = normalizeSearchText(rootParts.filter(Boolean).join(" "));
  const nested = normalizeSearchText(nestedParts.filter(Boolean).join(" "));

  return {
    base,
    nested,
    full: `${base} ${nested}`.trim()
  };
};

const calculateRelevanceScore = (item, query, tokens) => {
  const title = normalizeSearchText(item.name || item.description || "");
  const sku = normalizeSearchText(item.display_sku || "");
  const brand = normalizeSearchText(item.brand_name || "");
  const { base, nested, full } = buildSearchBlob(item);

  if (!full || !query) return 0;

  let score = 0;

  if (title === query) score += 180;
  if (title.includes(query)) score += 110;
  if (sku && (sku === query || sku.includes(query))) score += 90;
  if (brand && brand.includes(query)) score += 45;
  if (base.includes(query)) score += 70;
  if (nested.includes(query)) score += 35;

  tokens.forEach((token) => {
    if (!token) return;

    if (title.includes(token)) score += 24;
    if (sku.includes(token)) score += 20;
    if (brand.includes(token)) score += 14;
    if (base.includes(token)) score += 10;
    if (nested.includes(token)) score += 6;
  });

  return score;
};

export default function CategoryPage({ title = "Shopping" }) {
  const { t } = useLanguage();
  const { selectedLocations, toggleLocation, clearLocations, updateAvailableLocations } = useLocations();
  const [searchParams] = useSearchParams();

  // Data state
  const [items, setItems] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [powerSources, setPowerSources] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedItemTypes, setSelectedItemTypes] = useState(new Set());
  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [selectedConditions, setSelectedConditions] = useState(new Set());
  const [selectedPowerSources, setSelectedPowerSources] = useState(new Set());
  const [selectedProductTypes, setSelectedProductTypes] = useState(new Set());
  const [showOnlyWithImages, setShowOnlyWithImages] = useState(false);
  
  // Price range filter
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [priceInputs, setPriceInputs] = useState({ min: '', max: '' });

  // Sorting
  const [sort, setSort] = useState("relevance");
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('makmex-shopping-view-mode');
    return saved === 'standard' ? 'standard' : 'compact';
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const searchQuery = (searchParams.get("q") || "").trim();

  const normalizedSearchQuery = useMemo(
    () => normalizeSearchText(searchQuery),
    [searchQuery]
  );

  const searchTokens = useMemo(
    () => normalizedSearchQuery.split(/\s+/).filter(Boolean),
    [normalizedSearchQuery]
  );

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [
          productsResult,
          combosResult,
          kitsResult,
          conditionsResult,
          powerSourcesResult
        ] = await Promise.all([
          getProducts(),
          getCombos(),
          getKits(),
          getConditions(),
          getPowerSources()
        ]);

        if (!productsResult.success) {
          throw new Error(`Products: ${productsResult.error}`);
        }
        if (!combosResult.success) {
          throw new Error(`Combos: ${combosResult.error}`);
        }
        if (!kitsResult.success) {
          throw new Error(`Kits: ${kitsResult.error}`);
        }
        if (!conditionsResult.success) {
          throw new Error(`Conditions: ${conditionsResult.error}`);
        }
        if (!powerSourcesResult.success) {
          throw new Error(`Power Sources: ${powerSourcesResult.error}`);
        }

        const unifiedItems = [
          ...(productsResult.data || []),
          ...(combosResult.data || []),
          ...(kitsResult.data || [])
        ];

        setItems(unifiedItems);
        setConditions(conditionsResult.data);
        setPowerSources(powerSourcesResult.data);
        
        if (unifiedItems.length > 0) {
          const prices = unifiedItems.map((entry) => entry.price);
          const minPrice = Math.floor(Math.min(...prices));
          const maxPrice = Math.ceil(Math.max(...prices));
          setPriceRange({ min: minPrice, max: maxPrice });
          setPriceInputs({ min: minPrice.toString(), max: maxPrice.toString() });
        }
      } catch (err) {
        setError(err.message);
        console.error("Error loading shopping page data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('makmex-shopping-view-mode', viewMode);
  }, [viewMode]);

  const filteredItems = useMemo(() => {
    let filtered = [...items];

    const minPrice = parseFloat(priceInputs.min) || 0;
    const maxPrice = parseFloat(priceInputs.max) || Infinity;
    filtered = filtered.filter((entry) => entry.price >= minPrice && entry.price <= maxPrice);

    if (selectedItemTypes.size > 0) {
      filtered = filtered.filter((entry) => selectedItemTypes.has(entry.type));
    }

    if (selectedBrands.size > 0) {
      filtered = filtered.filter((entry) => {
        const entryBrands = getItemBrands(entry);
        return Array.from(selectedBrands).some((brand) => entryBrands.has(brand));
      });
    }

    if (selectedConditions.size > 0) {
      filtered = filtered.filter((entry) => {
        const entryConditions = getItemConditions(entry);
        return Array.from(selectedConditions).some((condition) => entryConditions.has(condition));
      });
    }

    if (selectedPowerSources.size > 0) {
      filtered = filtered.filter((entry) => {
        const entryPowerSources = getItemPowerSources(entry);
        return Array.from(selectedPowerSources).some((powerSource) => entryPowerSources.has(powerSource));
      });
    }

    if (selectedLocations.size > 0) {
      filtered = filtered.filter((entry) => selectedLocations.has(entry.warehouse_location));
    }

    if (selectedProductTypes.size > 0) {
      filtered = filtered.filter((entry) => {
        const entryTypes = getItemProductTypes(entry);
        return Array.from(selectedProductTypes).some((productType) => entryTypes.has(productType));
      });
    }

    if (showOnlyWithImages) {
      filtered = filtered.filter((entry) => hasItemImage(entry));
    }

    if (searchTokens.length > 0) {
      const scoredEntries = filtered
        .map((entry) => ({
          entry,
          score: calculateRelevanceScore(entry, normalizedSearchQuery, searchTokens)
        }))
        .filter(({ score }) => score > 0);

      if (sort === "relevance") {
        scoredEntries.sort((a, b) => b.score - a.score || a.entry.price - b.entry.price);
      }

      filtered = scoredEntries.map(({ entry }) => entry);
    }

    if (sort === "price_asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      filtered.sort((a, b) => new Date(b.created_at || b.id) - new Date(a.created_at || a.id));
    }

    return filtered;
  }, [
    items,
    selectedItemTypes,
    selectedBrands,
    selectedConditions,
    selectedPowerSources,
    selectedLocations,
    selectedProductTypes,
    showOnlyWithImages,
    sort,
    priceInputs,
    normalizedSearchQuery,
    searchTokens
  ]);

  const availableFilterOptions = useMemo(() => {
    const inStockItems = items.filter((entry) => entry.in_stock);
    const brandsSet = new Set();
    const conditionsSet = new Set();
    const productTypesSet = new Set();
    const powerSourcesSet = new Set();

    inStockItems.forEach((entry) => {
      getItemBrands(entry).forEach((brand) => brandsSet.add(brand));
      getItemConditions(entry).forEach((condition) => conditionsSet.add(condition));
      getItemProductTypes(entry).forEach((productType) => productTypesSet.add(productType));
      getItemPowerSources(entry).forEach((powerSource) => powerSourcesSet.add(powerSource));
    });
    
    return {
      itemTypes: [
        { value: 'product', label: t('products') },
        { value: 'combo', label: t('combos') },
        { value: 'kit', label: t('kits') }
      ],
      brands: Array.from(brandsSet).sort(),
      conditions: conditions
        .filter((condition) => conditionsSet.has(condition.general_condition))
        .sort((a, b) => CONDITION_ORDER.indexOf(a.id) - CONDITION_ORDER.indexOf(b.id)),
      productTypes: Array.from(productTypesSet).sort(),
      powerSources: powerSources.filter((powerSource) => {
        const value = powerSource.value || powerSource;
        return powerSourcesSet.has(value);
      }),
      locations: Array.from(new Set(inStockItems.map((entry) => entry.warehouse_location).filter(Boolean))).sort()
    };
  }, [items, conditions, powerSources, t]);

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const shownItems = filteredItems.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedItemTypes, selectedBrands, selectedConditions, selectedPowerSources, selectedLocations, selectedProductTypes, showOnlyWithImages, sort, priceInputs, normalizedSearchQuery]);

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

  const handleItemTypeChange = (itemType) => {
    setSelectedItemTypes((prev) => {
      const next = new Set(prev);
      if (next.has(itemType)) next.delete(itemType);
      else next.add(itemType);
      return next;
    });
  };

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
    toggleLocation(location);
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
    setSelectedItemTypes(new Set());
    setSelectedConditions(new Set());
    setSelectedPowerSources(new Set());
    clearLocations();
    setSelectedProductTypes(new Set());
    setShowOnlyWithImages(false);
    setSort("relevance");
    setCurrentPage(1);
    
    if (items.length > 0) {
      const prices = items.map((entry) => entry.price);
      const minPrice = Math.floor(Math.min(...prices));
      const maxPrice = Math.ceil(Math.max(...prices));
      setPriceInputs({ min: minPrice.toString(), max: maxPrice.toString() });
    }
  };

  useEffect(() => {
    updateAvailableLocations(availableFilterOptions.locations || []);
  }, [availableFilterOptions.locations, updateAvailableLocations]);

  useEffect(() => {
    const brandFromQuery = searchParams.get("brand");
    if (!brandFromQuery) return;

    setSelectedBrands(new Set([brandFromQuery]));
    setCurrentPage(1);
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-makmex-border bg-gradient-to-br from-makmex-panel via-makmex-bg to-black p-8 md:p-12">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-makmex-orange/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="inline-flex rounded-full border border-makmex-orange/40 bg-makmex-orange/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-makmex-orange">
            {t('shopping')}
          </span>
          <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">{title}</h1>
          <p className="text-sm text-makmex-muted md:text-base">
            {t('shoppingPageSubtitle') || 'Browse products, combos, and kits with unified filters and view controls.'}
          </p>
        </div>
      </section>

      {/* Controls row (directly above pagination) */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 lg:pl-3">
        <p className="text-sm text-makmex-muted">
          {loading ? `${t('loading')}...` : `${t('Showing') || 'Showing'} ${startIndex + 1}-${Math.min(endIndex, totalItems)} ${t('of') || 'of'} ${totalItems} ${t('results') || 'results'}`}
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-end">
          <div className="flex items-center gap-2">
            <span className="text-sm text-makmex-muted">{t('viewMode')}:</span>
            <div className="inline-flex rounded-lg border border-makmex-border bg-makmex-surface p-1">
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${viewMode === 'compact' ? 'bg-makmex-orange text-black' : 'text-makmex-muted hover:text-makmex-text'}`}
              >
                {t('compact')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('standard')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${viewMode === 'standard' ? 'bg-makmex-orange text-black' : 'text-makmex-muted hover:text-makmex-text'}`}
              >
                {t('standard')}
              </button>
            </div>
          </div>

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
        <div className="lg:pl-3">
          <PaginationControls 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={goToPage}
            onPreviousPage={goToPreviousPage}
            onNextPage={goToNextPage}
          />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800">{t('error')} {t('loading')} {title}</h3>
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
            {t('loading')} {title.toLowerCase()}...
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <div className="flex gap-6">
          <aside className="w-72 flex-shrink-0">
            <FilterSidebar
              priceRange={priceRange}
              priceInputs={priceInputs}
              setPriceInputs={setPriceInputs}
              selectedItemTypes={selectedItemTypes}
              handleItemTypeChange={handleItemTypeChange}
              selectedBrands={selectedBrands}
              handleBrandChange={handleBrandChange}
              selectedConditions={selectedConditions}
              handleConditionChange={handleConditionChange}
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

          {/* Item Grid */}
          <div className="flex-1 min-w-0">
            {shownItems.length === 0 ? (
              <div className="rounded-2xl border border-makmex-border bg-makmex-surface p-12 text-center">
                <h3 className="text-lg font-semibold text-makmex-text">No items found</h3>
                <p className="mt-2 text-sm text-makmex-muted">
                  Try adjusting your filters or check back later for new inventory.
                </p>
              </div>
            ) : (
              <section className={viewMode === 'compact'
                ? "grid gap-6 [grid-template-columns:repeat(3,280px)]"
                : "flex flex-col gap-4"
              }>
                {shownItems.map((item) => (
                  <ItemCard key={`${item.type}-${item.id}`} layout={viewMode} {...item} />
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
