import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCombos, getKits, getProducts, supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";
import { useLoadingStatus } from "../context/LoadingContext";

const REQUEST_TIMEOUT_MS = 20000;
const BRAND_IMAGE_EXTENSIONS = ["webp", "avif", "jpg", "jpeg", "png"];
const BRAND_IMAGE_ALIASES = {
  husky: ["Husky", "husky", "HUSKY"]
};

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

const normalizeBrandSlug = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "-");

const normalizeBrandUnderscore = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "_");

const buildBrandImageCandidates = (brandName) => {
  const trimmed = String(brandName || "").trim();
  if (!trimmed) return [];

  const lower = trimmed.toLowerCase();
  const upper = trimmed.toUpperCase();
  const slug = normalizeBrandSlug(trimmed);
  const slugLower = slug.toLowerCase();
  const slugUpper = slug.toUpperCase();
  const underscored = normalizeBrandUnderscore(trimmed);
  const underscoredLower = underscored.toLowerCase();
  const aliasVariants = BRAND_IMAGE_ALIASES[lower] || [];

  const nameVariants = Array.from(
    new Set([
      ...aliasVariants,
      trimmed,
      lower,
      upper,
      slug,
      slugLower,
      slugUpper,
      underscored,
      underscoredLower
    ].filter(Boolean))
  );

  return nameVariants.flatMap((nameVariant) =>
    BRAND_IMAGE_EXTENSIONS.map((extension) => `brands-page/${nameVariant}.${extension}`)
  );
};

const getPublicStorageUrl = (path) => {
  const { data } = supabase.storage.from("web-images").getPublicUrl(path);
  return data?.publicUrl || "";
};

const buildBrandImageUrls = (brandName) =>
  buildBrandImageCandidates(brandName)
    .map((path) => getPublicStorageUrl(path))
    .filter(Boolean);

function BrandCard({ brand, t }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hasImageError, setHasImageError] = useState(false);
  const imageUrls = brand.image_urls || [];
  const activeImageUrl = imageUrls[currentImageIndex] || "";

  const showImage = Boolean(activeImageUrl) && !hasImageError;

  return (
    <Link
      key={brand.id}
      to={`/shopping?brand=${encodeURIComponent(brand.name)}`}
      className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-makmex-border bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-makmex-orange/60"
    >
      <div className="absolute inset-0 bg-white" />
      {showImage ? (
        <img
          src={activeImageUrl}
          alt={brand.name}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="relative z-10 h-full w-full object-contain p-3 transition duration-500 group-hover:scale-105"
          onError={() => {
            setCurrentImageIndex((prev) => {
              if (prev >= imageUrls.length - 1) {
                setHasImageError(true);
                return prev;
              }
              return prev + 1;
            });
          }}
        />
      ) : (
        <div className="relative z-10 flex h-full w-full items-center justify-center p-3 text-center">
          <span className="rounded-xl border border-black/15 bg-black/5 px-4 py-2 text-sm font-semibold text-black/70">
            {brand.name}
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-black/10 bg-white/95 p-3 sm:p-4 backdrop-blur-[1px]">
        <h2 className="text-base sm:text-lg font-extrabold text-black">{brand.name}</h2>
        <p className="text-xs sm:text-sm text-black/80">
          {brand.inStockCount} {brand.inStockCount === 1 ? t("itemInStock") : t("itemsInStock")}
        </p>
      </div>
    </Link>
  );
}

export default function BrandsPage() {
  const { t } = useLanguage();
  const { startLoading, stopLoading } = useLoadingStatus();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadBrands() {
      setLoading(true);
      setError(null);
      startLoading();

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

        if (!isActive) return;
        setBrands(
          inStockBrands
            .map((brand) => ({
              ...brand,
              image_urls: buildBrandImageUrls(brand.name)
            }))
            .filter((brand) => brand.image_urls.length > 0)
        );
      } catch (err) {
        if (isActive) {
          setError(err.message || "Failed to load brands");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
        stopLoading();
      }
    }

    loadBrands();

    return () => {
      isActive = false;
    };
  }, [startLoading, stopLoading]);

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
          {brands.map((brand) => <BrandCard key={brand.id} brand={brand} t={t} />)}
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
