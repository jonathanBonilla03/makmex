import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function FilterSidebar({
  priceRange,
  priceInputs,
  setPriceInputs,
  selectedItemTypes,
  handleItemTypeChange,
  selectedBrands,
  handleBrandChange,
  selectedConditions,
  handleConditionChange,
  selectedProductTypes,
  handleProductTypeChange,
  // FIXED: Added optional power sources support for products page
  selectedPowerSources,
  handlePowerSourceChange,
  brandFilterMode,
  setBrandFilterMode,
  availableFilterOptions,
  clearAllFilters,
  showOnlyWithImages,
  setShowOnlyWithImages,
  compactGridMode = false
}) {
  const { t, translateConditionName } = useLanguage();
  const [expandedSections, setExpandedSections] = useState(new Set(['brands']));

  const toggleSection = (section) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handlePriceInputChange = (key, value) => {
    setPriceInputs((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const FilterSection = ({ title, sectionKey, selectedCount = 0, children }) => {
    const isExpanded = expandedSections.has(sectionKey);
    
    return (
      <div className="border border-makmex-border rounded-xl bg-makmex-panel">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-makmex-surface transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-wide text-makmex-muted">{title}</span>
            {selectedCount > 0 && (
              <span className="bg-makmex-orange text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center">
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
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 max-h-56 overflow-y-auto">
            {children}
          </div>
        )}
      </div>
    );
  };

  const CheckboxList = ({ items, selected, onChange, getLabel = (item) => item, getDisplayLabel = null }) => (
    <div className="space-y-2">
      {items.map((item) => (
        <label
          key={typeof item === 'string' ? item : item.id || item.value}
          className="flex cursor-pointer items-center gap-3 text-sm text-makmex-muted hover:text-makmex-text leading-relaxed"
        >
          <input
            type="checkbox"
            checked={selected.has(typeof item === 'string' ? item : getLabel(item))}
            onChange={() => onChange(typeof item === 'string' ? item : getLabel(item))}
            className="accent-makmex-orange shrink-0"
          />
          <span className="wrap-break-word">
            {typeof item === 'string' ? item : (getDisplayLabel ? getDisplayLabel(item) : getLabel(item))}
          </span>
        </label>
      ))}
    </div>
  );

  if (compactGridMode) {
    return (
      <div className="rounded-2xl border border-makmex-border bg-makmex-surface p-3">
        <div className="grid grid-cols-3 gap-2 text-sm text-makmex-text">
          {availableFilterOptions.itemTypes?.length > 0 && selectedItemTypes && handleItemTypeChange && (
            <div className="h-56 rounded-xl border border-makmex-border bg-makmex-panel p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-makmex-muted">{t('items')}</span>
                {selectedItemTypes.size > 0 && (
                  <span className="bg-makmex-orange text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center">
                    {selectedItemTypes.size}
                  </span>
                )}
              </div>
              <div className="max-h-44 overflow-y-auto pr-1">
                <CheckboxList
                  items={availableFilterOptions.itemTypes}
                  selected={selectedItemTypes}
                  onChange={handleItemTypeChange}
                  getLabel={(itemType) => itemType.value}
                  getDisplayLabel={(itemType) => itemType.label}
                />
              </div>
            </div>
          )}

          <div className="h-56 rounded-xl border border-makmex-border bg-makmex-panel p-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-makmex-muted">{t('priceRange')}</div>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-1.5">
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-makmex-muted">{t('min')}</label>
                  <input
                    type="number"
                    value={priceInputs?.min ?? ""}
                    onChange={(e) => handlePriceInputChange('min', e.target.value)}
                    min="0"
                    className="w-full rounded border border-makmex-border bg-makmex-surface px-1.5 py-1 text-[11px] text-makmex-text"
                    placeholder="0"
                  />
                </div>
                <span className="pb-1 text-makmex-muted">-</span>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-makmex-muted">{t('max')}</label>
                  <input
                    type="number"
                    value={priceInputs?.max ?? ""}
                    onChange={(e) => handlePriceInputChange('max', e.target.value)}
                    min="0"
                    className="w-full rounded border border-makmex-border bg-makmex-surface px-1.5 py-1 text-[11px] text-makmex-text"
                    placeholder="10000"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-medium text-makmex-muted">{t('min')}: ${priceInputs?.min ?? 0}</label>
                <input
                  type="range"
                  min={priceRange?.min ?? 0}
                  max={priceRange?.max ?? 10000}
                  value={priceInputs?.min ?? 0}
                  onChange={(e) => handlePriceInputChange('min', e.target.value)}
                  className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-makmex-border"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-medium text-makmex-muted">{t('max')}: ${priceInputs?.max ?? 0}</label>
                <input
                  type="range"
                  min={priceRange?.min ?? 0}
                  max={priceRange?.max ?? 10000}
                  value={priceInputs?.max ?? 0}
                  onChange={(e) => handlePriceInputChange('max', e.target.value)}
                  className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-makmex-border"
                />
              </div>

              <div className="rounded bg-makmex-surface px-2 py-1 text-center text-[11px] text-makmex-muted">
                ${priceInputs?.min ?? 0} - ${priceInputs?.max ?? 0}
              </div>
            </div>
          </div>

          <div className="h-56 rounded-xl border border-makmex-border bg-makmex-panel p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-makmex-muted">{t('brands')}</span>
              {selectedBrands.size > 0 && (
                <span className="bg-makmex-orange text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center">
                  {selectedBrands.size}
                </span>
              )}
            </div>
            <div className="max-h-44 overflow-y-auto pr-1">
              <CheckboxList items={availableFilterOptions.brands} selected={selectedBrands} onChange={handleBrandChange} />
            </div>
          </div>

          {availableFilterOptions.conditions?.length > 0 && (
            <div className="h-56 rounded-xl border border-makmex-border bg-makmex-panel p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-makmex-muted">{t('conditions')}</span>
                {selectedConditions.size > 0 && (
                  <span className="bg-makmex-orange text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center">
                    {selectedConditions.size}
                  </span>
                )}
              </div>
              <div className="max-h-44 overflow-y-auto pr-1">
                <CheckboxList
                  items={availableFilterOptions.conditions}
                  selected={selectedConditions}
                  onChange={handleConditionChange}
                  getLabel={(condition) => condition.general_condition}
                  getDisplayLabel={(condition) => translateConditionName(condition.general_condition)}
                />
              </div>
            </div>
          )}

          {availableFilterOptions.powerSources && availableFilterOptions.powerSources.length > 0 && selectedPowerSources && handlePowerSourceChange && (
            <div className="h-56 rounded-xl border border-makmex-border bg-makmex-panel p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-makmex-muted">{t('powerSources')}</span>
                {selectedPowerSources.size > 0 && (
                  <span className="bg-makmex-orange text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center">
                    {selectedPowerSources.size}
                  </span>
                )}
              </div>
              <div className="max-h-44 overflow-y-auto pr-1">
                <CheckboxList
                  items={availableFilterOptions.powerSources}
                  selected={selectedPowerSources}
                  onChange={(item) => {
                    const value = typeof item === 'string' ? item : item.value || item;
                    handlePowerSourceChange(value);
                  }}
                  getLabel={(powerSource) => typeof powerSource === 'string' ? powerSource : (powerSource.display || powerSource.value || powerSource)}
                />
              </div>
            </div>
          )}

          {availableFilterOptions.productTypes?.length > 0 && (
            <div className="h-56 rounded-xl border border-makmex-border bg-makmex-panel p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-makmex-muted">{t('productTypes')}</span>
                {selectedProductTypes.size > 0 && (
                  <span className="bg-makmex-orange text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center">
                    {selectedProductTypes.size}
                  </span>
                )}
              </div>
              <div className="max-h-44 overflow-y-auto pr-1">
                <CheckboxList
                  items={availableFilterOptions.productTypes}
                  selected={selectedProductTypes}
                  onChange={handleProductTypeChange}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-makmex-border bg-makmex-panel px-3 py-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlyWithImages}
              onChange={(e) => setShowOnlyWithImages(e.target.checked)}
              className="h-4 w-4 rounded border-makmex-border bg-makmex-bg text-makmex-orange accent-makmex-orange"
            />
            <span className="text-xs font-medium text-makmex-text">{t('hasImages')}</span>
          </label>

          <button
            onClick={clearAllFilters}
            className="rounded-lg border border-makmex-border bg-makmex-surface px-2.5 py-1.5 text-xs font-semibold text-makmex-muted hover:border-makmex-orange/60 hover:text-makmex-text"
          >
            {t('clearAll')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-makmex-border bg-makmex-surface p-5 pr-3">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-makmex-text">{t('filters')}</h2>
      </div>

      <div className="space-y-3 text-sm text-makmex-text">
      {availableFilterOptions.itemTypes?.length > 0 && selectedItemTypes && handleItemTypeChange && (
      <div className="border border-makmex-border rounded-xl bg-makmex-panel p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-wide text-makmex-muted">{t('items')}</span>
          {selectedItemTypes.size > 0 && (
            <span className="bg-makmex-orange text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center">
              {selectedItemTypes.size}
            </span>
          )}
        </div>
        <CheckboxList
          items={availableFilterOptions.itemTypes}
          selected={selectedItemTypes}
          onChange={handleItemTypeChange}
          getLabel={(itemType) => itemType.value}
          getDisplayLabel={(itemType) => itemType.label}
        />
      </div>
      )}

      <FilterSection title={t('priceRange')} sectionKey="price">
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <label className="block text-xs font-medium text-makmex-muted mb-1">{t('min')}</label>
              <input
                type="number"
                value={priceInputs?.min ?? ""}
                onChange={(e) => handlePriceInputChange("min", e.target.value)}
                min="0"
                className="w-full px-2 py-1 text-xs rounded border border-makmex-border bg-makmex-surface text-makmex-text"
                placeholder="0"
              />
            </div>
            <span className="text-makmex-muted mt-4">-</span>
            <div className="flex-1">
              <label className="block text-xs font-medium text-makmex-muted mb-1">{t('max')}</label>
              <input
                type="number"
                value={priceInputs?.max ?? ""}
                onChange={(e) => handlePriceInputChange("max", e.target.value)}
                min="0"
                className="w-full px-2 py-1 text-xs rounded border border-makmex-border bg-makmex-surface text-makmex-text"
                placeholder="10000"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-makmex-muted mb-1">
                {t('min')}: ${priceInputs?.min ?? 0}
              </label>
              <input
                type="range"
                min={priceRange?.min ?? 0}
                max={priceRange?.max ?? 10000}
                value={priceInputs?.min ?? 0}
                onChange={(e) => handlePriceInputChange('min', e.target.value)}
                className="w-full h-2 bg-makmex-border rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-makmex-muted mb-1">
                {t('max')}: ${priceInputs?.max ?? 0}
              </label>
              <input
                type="range"
                min={priceRange?.min ?? 0}
                max={priceRange?.max ?? 10000}
                value={priceInputs?.max ?? 0}
                onChange={(e) => handlePriceInputChange('max', e.target.value)}
                className="w-full h-2 bg-makmex-border rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          <div className="text-xs text-center text-makmex-muted bg-makmex-panel px-2 py-1 rounded">
            ${priceInputs?.min ?? 0} - ${priceInputs?.max ?? 0}
          </div>
        </div>
      </FilterSection>

      {/* Brands */}
      <FilterSection title={t('brands')} sectionKey="brands" selectedCount={selectedBrands.size}>
        <div className="space-y-3">
          {/* Brand filter mode - only show if setBrandFilterMode is provided */}
          {brandFilterMode && setBrandFilterMode && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="brandFilterMode"
                  value="inclusive"
                  checked={brandFilterMode === 'inclusive'}
                  onChange={(e) => setBrandFilterMode(e.target.value)}
                  className="text-makmex-orange"
                />
                <span className="text-makmex-text">{t('anyBrand')}</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="brandFilterMode"
                  value="exclusive"
                  checked={brandFilterMode === 'exclusive'}
                  onChange={(e) => setBrandFilterMode(e.target.value)}
                  className="text-makmex-orange"
                />
                <span className="text-makmex-text">{t('allBrands')}</span>
              </label>
            </div>
          )}
          <CheckboxList
            items={availableFilterOptions.brands}
            selected={selectedBrands}
            onChange={handleBrandChange}
          />
        </div>
      </FilterSection>

      {/* Conditions */}
      {availableFilterOptions.conditions?.length > 0 && (
      <FilterSection title={t('conditions')} sectionKey="conditions" selectedCount={selectedConditions.size}>
        <CheckboxList
          items={availableFilterOptions.conditions}
          selected={selectedConditions}
          onChange={handleConditionChange}
          getLabel={(condition) => condition.general_condition}
          getDisplayLabel={(condition) => translateConditionName(condition.general_condition)}
        />
      </FilterSection>
      )}

      {/* FIXED: Power Sources - Only show if provided (for products page) */}
      {availableFilterOptions.powerSources && availableFilterOptions.powerSources.length > 0 && selectedPowerSources && handlePowerSourceChange && (
      <FilterSection title={t('powerSources')} sectionKey="powerSources" selectedCount={selectedPowerSources.size}>
        <CheckboxList
          items={availableFilterOptions.powerSources}
          selected={selectedPowerSources}
          onChange={(item) => {
            // Handle both string and object power sources
            const value = typeof item === 'string' ? item : item.value || item;
            handlePowerSourceChange(value);
          }}
          getLabel={(powerSource) => typeof powerSource === 'string' ? powerSource : (powerSource.display || powerSource.value || powerSource)}
        />
      </FilterSection>
      )}

      {/* Product Types */}
      {availableFilterOptions.productTypes?.length > 0 && (
      <FilterSection title={t('productTypes')} sectionKey="productTypes" selectedCount={selectedProductTypes.size}>
        <CheckboxList
          items={availableFilterOptions.productTypes}
          selected={selectedProductTypes}
          onChange={handleProductTypeChange}
        />
      </FilterSection>
      )}

      {/* Images Filter */}
      <div className="border-t border-makmex-border px-3 py-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyWithImages}
            onChange={(e) => setShowOnlyWithImages(e.target.checked)}
            className="h-4 w-4 rounded border-makmex-border bg-makmex-bg text-makmex-orange accent-makmex-orange"
          />
          <span className="text-sm font-medium text-makmex-text">{t('hasImages')}</span>
        </label>
      </div>

      <button
        onClick={clearAllFilters}
        className="mt-4 w-full rounded-xl border border-makmex-border bg-makmex-panel px-3 py-2 text-sm font-semibold text-makmex-muted hover:border-makmex-orange/60 hover:text-makmex-text"
      >
        {t('clearAll')}
      </button>
      </div>
    </div>
  );
}
