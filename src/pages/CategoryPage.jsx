import { useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";

/**
 * Temporary mock data
 * Later we will replace this with Supabase query results.
 */
const MOCK_PRODUCTS = Array.from({ length: 24 }).map((_, i) => {
  const brand = i % 3 === 0 ? "Milwaukee" : i % 3 === 1 ? "DeWalt" : "Makita";
  const type = i % 5 === 0 ? "kit" : i % 7 === 0 ? "combo" : "product";

  return {
    id: i + 1,
    brand,
    name:
      type === "kit"
        ? "M18 Starter Kit"
        : type === "combo"
        ? "M18 Combo Kit"
        : "M18 Hammer Drill",
    subtitle: "Cordless • Fuel",
    price: 149.99 + i * 5,
    inStock: i !== 6 && i !== 13,
    type, // "product" | "kit" | "combo"
    condition: i % 4 === 0 ? "Refurbished" : "New",
  };
});

const BRAND_OPTIONS = ["Milwaukee", "DeWalt", "Makita"];
const CONDITION_OPTIONS = ["New", "Refurbished"];

export default function CategoryPage({ title = "Power Tools" }) {
  // Filters
  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [selectedConditions, setSelectedConditions] = useState(new Set());
  const [inStockOnly, setInStockOnly] = useState(false);

  // Sorting
  const [sort, setSort] = useState("relevance"); // relevance | price_asc | price_desc | newest

  const filteredProducts = useMemo(() => {
    let items = [...MOCK_PRODUCTS];

    // Brand filter
    if (selectedBrands.size > 0) {
      items = items.filter((p) => selectedBrands.has(p.brand));
    }

    // Condition filter
    if (selectedConditions.size > 0) {
      items = items.filter((p) => selectedConditions.has(p.condition));
    }

    // In-stock filter
    if (inStockOnly) {
      items = items.filter((p) => p.inStock);
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
  }, [selectedBrands, selectedConditions, inStockOnly, sort]);

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
    setInStockOnly(false);
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

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
        {/* Filters */}
        <aside className="rounded-2xl border border-makmex-border bg-makmex-surface p-4">
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

            <FilterGroup title="Availability">
              <Check
                label="In Stock"
                checked={inStockOnly}
                onChange={() => setInStockOnly((v) => !v)}
              />
            </FilterGroup>

            <button
              onClick={clearFilters}
              className="mt-2 w-full rounded-xl border border-makmex-border bg-makmex-panel px-3 py-2 text-sm font-semibold text-makmex-muted hover:border-makmex-orange/60 hover:text-makmex-text"
            >
              Clear filters
            </button>
          </div>
        </aside>

        {/* Product Grid */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {shownProducts.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </section>
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
