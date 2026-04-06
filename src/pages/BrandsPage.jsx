import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCombos, getKits, getProducts, supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";

const REQUEST_TIMEOUT_MS = 20000;
const BRAND_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "avif"];

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

const buildBrandImageCandidates = (brandName) => {
  const trimmed = String(brandName || "").trim();
  if (!trimmed) return [];

  return BRAND_IMAGE_EXTENSIONS.map((extension) => `brands-page/${trimmed}.${extension}`);
};

const getPublicStorageUrl = (path) => {
  const { data } = supabase.storage.from("web-images").getPublicUrl(path);
  return data?.publicUrl || "";
};

const imageExists = (url) =>
  new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });

const resolveBrandImageUrl = async (brandName) => {
  const candidates = buildBrandImageCandidates(brandName);

  for (const path of candidates) {
    const url = getPublicStorageUrl(path);
    // getPublicUrl always returns a URL shape; verify it actually resolves.
    if (await imageExists(url)) {
      return url;
    }
  }

  return "";
};

export default function BrandsPage() {
  const { t } = useLanguage();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadBrands() {
      setLoading(true);
      setError(null);

      try {
        const [brandsResult, productsInStockResult, combosInStockResult, kitsInStockResult] = await Promise.all([
          withTimeout(supabase.from("brands").select("id, name"), "brands"),
          withTimeout(getProducts(), "products"),
          withTimeout(getCombos(), "combos"),
          withTimeout(getKits(), "kits").catch((err) => ({ success: false, error: err.message }))
        ]);

        if (brandsResult.error) throw new Error(brandsResult.error.message);
        if (!productsInStockResult.success) throw new Error(productsInStockResult.error);
        if (!combosInStockResult.success) throw new Error(combosInStockResult.error);
        if (!kitsInStockResult.success) {
          console.warn('Kits failed to load on brands page:', kitsInStockResult.error);
        }

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

        const inStockBrands = rankedBrands.filter((brand) => brand.inStockCount > 0);

        const withImages = await Promise.all(
          inStockBrands.map(async (brand) => ({
            ...brand,
            image_url: await resolveBrandImageUrl(brand.name)
          }))
        );

        if (!isActive) return;
        setBrands(withImages.filter((brand) => brand.image_url));
      } catch (err) {
        if (isActive) {
          setError(err.message || "Failed to load brands");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadBrands();

    return () => {
      isActive = false;
    };
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
            <div key={index} className="aspect-square w-full overflow-hidden rounded-2xl border border-makmex-border bg-makmex-panel">
              <div className="h-full w-full animate-pulse bg-makmex-border/40" />
            </div>
          ))}
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              to={`/shopping?brand=${encodeURIComponent(brand.name)}`}
              className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-makmex-border bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-makmex-orange/60"
            >
              <div className="absolute inset-0 bg-white" />
              <img
                src={brand.image_url}
                alt={brand.name}
                loading="lazy"
                className="relative z-10 h-full w-full object-contain p-3 transition duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-x-0 bottom-0 z-20 border-t border-black/10 bg-white/95 p-3 sm:p-4 backdrop-blur-[1px]">
                <h2 className="text-base sm:text-lg font-extrabold text-black">{brand.name}</h2>
                <p className="text-xs sm:text-sm text-black/80">
                  {brand.inStockCount} {brand.inStockCount === 1 ? t("itemInStock") : t("itemsInStock")}
                </p>
              </div>
            </Link>
          ))}
        </section>
      )}

      {!loading && !error && brands.length === 0 && (
        <div className="rounded-2xl border border-makmex-border bg-makmex-panel p-6 text-center text-sm text-makmex-muted">
          {t("noItemsFound")}
        </div>
      )}
    </div>
  );
}
