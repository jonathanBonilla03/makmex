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

  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [priceInputs, setPriceInputs] = useState({ min: "", max: "" });

  const [sort, setSort] = useState("relevance");

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

    if (sort === "price_asc") {
      items.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      items.sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      items.sort((a, b) => new Date(b.created_at || b.id) - new Date(a.created_at || a.id));
    }

    return items;
  }, [combos, selectedBrands, selectedConditions, selectedLocations, selectedProductTypes, sort, priceInputs, brandFilterMode]);

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
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="font-semibold text-red-400">{t("error")} {t("combos").toLowerCase()}</div>
          <div className="text-sm text-red-300 mt-1">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("combos")}</h1>
        <div className="text-sm text-makmex-muted">
          {filteredCombos.length} {filteredCombos.length === 1 ? t("item") : t("items")} {t("available")}
        </div>
      </div>

      <div className="flex gap-6">
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

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-makmex-muted">{t("sortBy")}</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-makmex-border bg-makmex-surface px-3 py-2 text-sm"
              >
                <option value="relevance">{t("relevance")}</option>
                <option value="price_asc">{t("priceLowToHigh")}</option>
                <option value="price_desc">{t("priceHighToLow")}</option>
                <option value="newest">{t("newestFirst")}</option>
              </select>
            </div>
          </div>

          {filteredCombos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-makmex-muted">No {t("combos").toLowerCase()} match your {t("filters").toLowerCase()}</div>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-3 lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1">
              {filteredCombos.slice(0, 12).map((combo) => (
                <ComboCard key={combo.id} {...combo} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
