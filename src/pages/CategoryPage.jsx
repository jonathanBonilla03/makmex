import { useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";

/**
 * Temporary mock data matching the actual Supabase schema with inventory
 * Only shows products that are in stock (quantity > 0)
 * Replace this with real Supabase queries once you're ready
 */
const MOCK_PRODUCTS = Array.from({ length: 24 }).map((_, i) => {
  const brandNames = ["Milwaukee", "DeWalt", "Makita"];
  const conditions = [
    { id: "new", general_condition: "New", full_description: "Brand new, never used" },
    { id: "refurb", general_condition: "Refurbished", full_description: "Professionally refurbished, tested and certified" },
    { id: "open", general_condition: "Open Box", full_description: "Open box, all original accessories included" }
  ];
  const typeNames = ["Drill", "Saw", "Kit", "Combo", "Battery"];
  const powerSources = ["Cordless", "Corded", "Battery", "Gas"];
  const warehouses = [
    { id: "WH001", name: "Downtown Warehouse" },
    { id: "WH002", name: "North Location" },
    { id: "WH003", name: "South Depot" }
  ];

  const warehouse = warehouses[i % warehouses.length];
  const condition = conditions[i % conditions.length];
  // Generate realistic SKUs based on brand and product type
  const brandCodes = { "Milwaukee": "MIL", "DeWalt": "DWT", "Makita": "MAK" };
  const brandName = brandNames[i % 3];
  const productNumber = String(10000 + i * 47).slice(-4); // More realistic product numbers
  const conditionSuffix = { "New": "AA", "Refurbished": "RF", "Open Box": "OB" };
  const actualSku = `${brandCodes[brandName]}${productNumber}-${conditionSuffix[condition.general_condition]}`;
  
  return {
    id: `mock-uuid-${i + 1}`,
    // Customer-facing information
    description: `${brandName} ${typeNames[i % typeNames.length]} - Professional Grade`,
    sku: actualSku, // Use the realistic SKU
    image_url: null,
    condition_id: condition.id,
    product_type_id: (i % 5) + 1,
    brand_id: (i % 3) + 1,
    power_source: powerSources[i % powerSources.length],
    specs: `Weight: ${2 + (i % 5)}lbs, Power: ${18 + (i % 12)}V, Max Torque: ${300 + (i * 25)}in-lbs`,
    
    // Derived fields for display (from JOINs)
    brand_name: brandName,
    condition_name: condition.general_condition,
    condition_description: condition.full_description,
    product_type_name: typeNames[i % typeNames.length],
    
    // Inventory information
    quantity: Math.floor(Math.random() * 10) + 1, // 1-10 in stock
    warehouse_location: warehouse.id,
    warehouse_name: warehouse.name,
    
    // Always in stock since we only show available items
    in_stock: true,
    
    // Customer pricing
    price: Math.floor(Math.random() * 300 + 50) + 0.99,
  };
});

const BRAND_OPTIONS = ["Milwaukee", "DeWalt", "Makita"]; // You'll get these from your brands table
const CONDITION_OPTIONS = ["New", "Refurbished", "Open Box"]; // You'll get these from your conditions table
const POWER_SOURCE_OPTIONS = ["Cordless", "Corded", "Battery", "Gas"];
const LOCATION_OPTIONS = [
  { id: "WH001", name: "Downtown Warehouse" },
  { id: "WH002", name: "North Location" },
  { id: "WH003", name: "South Depot" }
]; // You'll get these from your warehouse table

export default function CategoryPage({ title = "Power Tools" }) {
  // Filters
  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [selectedConditions, setSelectedConditions] = useState(new Set());
  const [selectedPowerSources, setSelectedPowerSources] = useState(new Set());
  const [selectedLocations, setSelectedLocations] = useState(new Set());

  // Sorting
  const [sort, setSort] = useState("relevance"); // relevance | price_asc | price_desc | newest

  const filteredProducts = useMemo(() => {
    let items = [...MOCK_PRODUCTS];

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
      items = items.filter((p) => selectedPowerSources.has(p.power_source));
    }

    // Location filter
    if (selectedLocations.size > 0) {
      items = items.filter((p) => selectedLocations.has(p.warehouse_location));
    }

    // Sorting
    if (sort === "price_asc") {
      items.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      items.sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      // Mock: higher id = newer
      items.sort((a, b) => b.id - a.id);
    } // relevance = keep original order

    return items;
  }, [selectedBrands, selectedConditions, selectedPowerSources, selectedLocations, sort]);

  const shownProducts = filteredProducts.slice(0, 12);

  const toggleSetValue = (setSetter, currentSet, value) => {
    const next = new Set(currentSet);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setSetter(next);
  };

  const clearFilters = () => {
    setSelectedBrands(new Set());
    setSelectedConditions(new Set());
    setSelectedPowerSources(new Set());
    setSelectedLocations(new Set());
    setSort("relevance");
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-makmex-muted">
            Showing {filteredProducts.length} results
          </p>
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-makmex-border bg-makmex-surface px-3 py-2 text-sm"
        >
          <option value="relevance">Sort by relevance</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {/* Sidebar and Content Layout */}
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <div className="sticky top-6 rounded-2xl border border-makmex-border bg-makmex-surface p-4">
            <h2 className="mb-4 font-bold">Filters</h2>

            <div className="space-y-4 text-sm text-makmex-text">
              <FilterGroup title="Brand">
                {BRAND_OPTIONS.map((b) => (
                  <Check
                    key={b}
                    label={b}
                    checked={selectedBrands.has(b)}
                    onChange={() =>
                      toggleSetValue(setSelectedBrands, selectedBrands, b)
                    }
                  />
                ))}
              </FilterGroup>

              <FilterGroup title="Condition">
                {CONDITION_OPTIONS.map((c) => (
                  <Check
                    key={c}
                    label={c}
                    checked={selectedConditions.has(c)}
                    onChange={() =>
                      toggleSetValue(setSelectedConditions, selectedConditions, c)
                    }
                  />
                ))}
              </FilterGroup>

              <FilterGroup title="Power Source">
                {POWER_SOURCE_OPTIONS.map((ps) => (
                  <Check
                    key={ps}
                    label={ps}
                    checked={selectedPowerSources.has(ps)}
                    onChange={() =>
                      toggleSetValue(setSelectedPowerSources, selectedPowerSources, ps)
                    }
                  />
                ))}
              </FilterGroup>

              <FilterGroup title="Location">
                {LOCATION_OPTIONS.map((loc) => (
                  <Check
                    key={loc.id}
                    label={loc.name}
                    checked={selectedLocations.has(loc.id)}
                    onChange={() =>
                      toggleSetValue(setSelectedLocations, selectedLocations, loc.id)
                    }
                  />
                ))}
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

        {/* Main Content */}
        <div className="flex-1">
          {/* Product Grid */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shownProducts.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </section>
        </div>
      </div>

      {/* Pagination placeholder (next step we’ll make it real) */}
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
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function FilterGroup({ title, children }) {
  return (
    <div>
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-makmex-muted">
        {title}
      </div>
      <div className="space-y-2">{children}</div>
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
