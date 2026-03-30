import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCombos, getKits, getProducts, supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";

const REQUEST_TIMEOUT_MS = 20000;

const { data: brandsHeroImageData } = supabase.storage
  .from("web-images")
  .getPublicUrl("home-page/Tool-Showcase-CloseUp-7.jpg");

const brandsHeroImageUrl = brandsHeroImageData?.publicUrl || "";

const withTimeout = (promise, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(`${label} request timed out`)), REQUEST_TIMEOUT_MS);
    })
  ]);

const getSubItems = (item) => {
  if (item.type === "combo") return item.combo_items || [];
  if (item.type === "kit") return item.kit_items || [];
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

export default function BrandsPage() {
  const { t } = useLanguage();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadBrands() {
      setLoading(true);
      setError(null);

      try {
        const [brandsResult, productsInStockResult, combosInStockResult, kitsInStockResult] = await Promise.all([
          withTimeout(supabase.from("brands").select("id, name"), "brands"),
          withTimeout(getProducts(), "products"),
          withTimeout(getCombos(), "combos"),
          withTimeout(getKits(), "kits")
        ]);

        if (brandsResult.error) throw new Error(brandsResult.error.message);
        if (!productsInStockResult.success) throw new Error(productsInStockResult.error);
        if (!combosInStockResult.success) throw new Error(combosInStockResult.error);
        if (!kitsInStockResult.success) throw new Error(kitsInStockResult.error);

        const brandCounts = new Map();
        const brandNameToId = new Map();

        (brandsResult.data || []).forEach((brand) => {
          brandCounts.set(brand.id, 0);
          brandNameToId.set(String(brand.name || "").toLowerCase(), brand.id);
        });

        const countItem = (item) => {
          const itemBrands = getItemBrands(item);
          itemBrands.forEach((brandName) => {
            const mappedId = brandNameToId.get(String(brandName || "").toLowerCase());
            if (!mappedId) return;
            brandCounts.set(mappedId, (brandCounts.get(mappedId) || 0) + 1);
          });
        };

        const allInStockItems = [
          ...(productsInStockResult.data || []),
          ...(combosInStockResult.data || []),
          ...(kitsInStockResult.data || [])
        ];

        allInStockItems.forEach(countItem);

        const rankedBrands = (brandsResult.data || [])
          .map((brand) => ({
            ...brand,
            inStockCount: brandCounts.get(brand.id) || 0
          }))
          .sort((a, b) => {
            if (b.inStockCount !== a.inStockCount) return b.inStockCount - a.inStockCount;
            return a.name.localeCompare(b.name);
          });

        setBrands(rankedBrands);
      } catch (err) {
        setError(err.message || "Failed to load brands");
      } finally {
        setLoading(false);
      }
    }

    loadBrands();
  }, []);

  const topThree = useMemo(() => brands.slice(0, 3), [brands]);

  return (
    <div className="space-y-10 pb-16">
      <section
        className="relative overflow-hidden rounded-3xl border border-makmex-border bg-cover bg-center bg-no-repeat p-8 md:p-12"
        style={{
          backgroundImage: `linear-gradient(120deg, rgba(7, 7, 9, 0.76), rgba(7, 7, 9, 0.56)), url(${brandsHeroImageUrl})`
        }}
      >
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-makmex-orange/15 blur-3xl float-soft" />
        <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl float-soft [animation-delay:600ms]" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <span className="inline-flex rounded-full border border-makmex-orange/40 bg-makmex-orange/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-makmex-orange">
            {t("brands")}
          </span>
          <h1 className="text-4xl font-extrabold leading-tight text-white md:text-5xl">{t("brandsPageTitle")}</h1>
          <p className="text-sm text-slate-200 md:text-base">{t("brandsPageSubtitle")}</p>

          {topThree.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {topThree.map((brand) => (
                <span
                  key={brand.id}
                  className="rounded-full border border-white/30 bg-black/25 px-3 py-1 text-xs font-semibold text-slate-100"
                >
                  {brand.name} • {brand.inStockCount}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="aspect-square w-full rounded-2xl border border-makmex-border bg-makmex-panel p-4 sm:p-5">
              <div className="h-24 sm:h-28 animate-pulse rounded-xl border border-dashed border-makmex-border bg-black/20" />
              <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-makmex-border/60" />
              <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-makmex-border/40" />
              <div className="mt-6 h-10 w-full animate-pulse rounded-xl bg-makmex-border/60" />
            </div>
          ))}
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {brands.map((brand, index) => (
            <article
              key={brand.id}
              className={`group aspect-square w-full flex flex-col overflow-hidden rounded-2xl border border-makmex-border bg-makmex-panel p-4 sm:p-5 shadow-card transition duration-300 ${
                brand.inStockCount > 0
                  ? 'hover:-translate-y-1 hover:border-makmex-orange/60'
                  : 'opacity-50 saturate-75'
              }`}
            >
              <div className="relative mb-3 sm:mb-4 overflow-hidden rounded-xl border border-dashed border-makmex-border bg-black/25 p-3 sm:p-4">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="flex h-16 sm:h-20 items-center justify-center text-center text-xs font-semibold uppercase tracking-wider text-makmex-muted">
                  {t("brandLogoPlaceholder")}
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-extrabold text-makmex-text">{brand.name}</h2>
                <p className="text-xs sm:text-sm text-makmex-muted">
                  {brand.inStockCount} {brand.inStockCount === 1 ? t("itemInStock") : t("itemsInStock")}
                </p>
              </div>

              <div className="mt-auto pt-3 sm:pt-4">
                {brand.inStockCount > 0 ? (
                  <Link
                    to={`/shopping?brand=${encodeURIComponent(brand.name)}`}
                    className="block w-full rounded-xl bg-makmex-orange px-3 sm:px-4 py-2 sm:py-2.5 text-center text-xs sm:text-sm font-semibold text-black transition-colors duration-300 hover:bg-makmex-ember"
                  >
                    {t("shopWithBrand", { brand: brand.name })}
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="block w-full cursor-not-allowed rounded-xl bg-makmex-border px-3 sm:px-4 py-2 sm:py-2.5 text-center text-xs sm:text-sm font-semibold text-makmex-muted"
                  >
                    {t("outOfStock")}
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
