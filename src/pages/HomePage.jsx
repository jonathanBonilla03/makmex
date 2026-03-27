import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";
import { getProducts } from "../lib/supabase";

const getSafeImageUrl = (value) => {
  if (!value) return "";

  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return "";
  }

  return "";
};

const { data: homeHeroImageData } = supabase.storage
  .from("web-images")
  .getPublicUrl("home-page/Shelf-Showcase_Wide-MakMex.jpg");

const homeHeroImageUrl = getSafeImageUrl(homeHeroImageData?.publicUrl || "");

const sectionImagePaths = {
  "01": "home-page/Tool-Showcase-CloseUp-5.jpg",
  "02": "home-page/Tool-Showcase-CloseUp-1.jpg",
  "03": "home-page/Store-Showcase-MakMex.jpg",
  "04": "home-page/Shelf-Showcase_MakMex.jpg"
};

const sectionImageUrls = Object.fromEntries(
  Object.entries(sectionImagePaths).map(([id, path]) => {
    const { data } = supabase.storage.from("web-images").getPublicUrl(path);
    return [id, getSafeImageUrl(data?.publicUrl || "")];
  })
);

const NEWEST_MAX_ITEMS = 15;

const showcaseSections = [
  {
    id: "01",
    title: "Shop Everything Milwaukee",
    subtitle: "From daily drivers to hard-to-find essentials",
    body: "Browse a deep lineup of tools, batteries, and accessories sourced for real jobs and real budgets.",
    accent: "from-makmex-orange/30 via-makmex-orange/5 to-transparent"
  },
  {
    id: "02",
    title: "Transparent Conditions",
    subtitle: "Know exactly what you are buying",
    body: "Every listing includes clear condition grading so you can compare value fast and shop with confidence.",
    accent: "from-blue-500/20 via-blue-500/5 to-transparent"
  },
  {
    id: "03",
    title: "Multiple Locations",
    subtitle: "Inventory where you need it",
    body: "Check stock by location and choose pickup or shipping options that match your timeline.",
    accent: "from-purple-500/20 via-purple-500/5 to-transparent"
  },
  {
    id: "04",
    title: "Shop Your Way",
    subtitle: "Products, kits, and combos in one place",
    body: "Filter fast, compare quickly, and build the setup that fits your work style and budget.",
    accent: "from-emerald-500/20 via-emerald-500/5 to-transparent"
  }
];

export default function HomePage() {
  const { t } = useLanguage();
  const [newestProducts, setNewestProducts] = useState([]);
  const [newestPageIndex, setNewestPageIndex] = useState(0);
  const [featuredItemsPerPage, setFeaturedItemsPerPage] = useState(5);

  useEffect(() => {
    const nodes = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function loadNewestProducts() {
      const result = await getProducts();
      if (!result.success || !result.data) {
        setNewestProducts([]);
        return;
      }

      const topStockedWithImages = result.data
        .map((product) => ({
          id: product.id,
          type: "product",
          name: product.description || product.name || "Product",
          quantity: product.quantity || 0,
          imageUrl: getSafeImageUrl(product.primary_image?.public_url || product.image_url)
        }))
        .filter((product) => Boolean(product.imageUrl))
        .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
        .slice(0, NEWEST_MAX_ITEMS);

      setNewestProducts(topStockedWithImages);
      setNewestPageIndex(0);
    }

    loadNewestProducts();
  }, []);

  useEffect(() => {
    const updateFeaturedItemsPerPage = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setFeaturedItemsPerPage(2);
        return;
      }

      if (width < 1024) {
        setFeaturedItemsPerPage(3);
        return;
      }

      setFeaturedItemsPerPage(5);
    };

    updateFeaturedItemsPerPage();
    window.addEventListener("resize", updateFeaturedItemsPerPage);

    return () => window.removeEventListener("resize", updateFeaturedItemsPerPage);
  }, []);

  const newestProductPages = useMemo(() => {
    if (newestProducts.length === 0) return [];
    const pages = [];

    for (let i = 0; i < newestProducts.length; i += featuredItemsPerPage) {
      pages.push(newestProducts.slice(i, i + featuredItemsPerPage));
    }

    return pages;
  }, [newestProducts, featuredItemsPerPage]);

  const newestTotalPages = newestProductPages.length;
  const safeNewestPageIndex = newestTotalPages === 0
    ? 0
    : Math.min(newestPageIndex, newestTotalPages - 1);

  useEffect(() => {
    if (newestTotalPages <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setNewestPageIndex((prev) => (prev + 1) % newestTotalPages);
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [newestTotalPages]);

  const goToPreviousNewestPage = () => {
    if (newestTotalPages <= 1) return;
    setNewestPageIndex((prev) => (prev - 1 + newestTotalPages) % newestTotalPages);
  };

  const goToNextNewestPage = () => {
    if (newestTotalPages <= 1) return;
    setNewestPageIndex((prev) => (prev + 1) % newestTotalPages);
  };

  const currentNewestPage = newestProductPages[safeNewestPageIndex] || [];

  return (
    <div className="space-y-16 pb-20">
      <section
        data-reveal
        className="reveal-block relative overflow-hidden rounded-3xl border border-makmex-border bg-cover bg-center bg-no-repeat p-8 md:p-12"
        style={{
          backgroundImage: `linear-gradient(120deg, rgba(7, 7, 9, 0.74), rgba(7, 7, 9, 0.52)), url(${homeHeroImageUrl})`
        }}
      >
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-makmex-orange/15 blur-3xl float-soft" />
        <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl float-soft [animation-delay:600ms]" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <span className="inline-flex rounded-full border border-makmex-orange/40 bg-makmex-orange/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            {t("makmexHome")}
          </span>
          <h1 className="text-4xl font-extrabold leading-tight text-white md:text-6xl">
            {t("homeHeroTitle")}
          </h1>
          <p className="max-w-2xl text-base text-slate-200 md:text-lg">
            {t("homeHeroSubtitle")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/shopping"
              className="rounded-xl bg-makmex-orange px-5 py-3 text-sm font-semibold text-black transition-transform duration-300 hover:-translate-y-0.5 hover:bg-makmex-ember"
            >
              {t("shopMakmex")}
            </Link>
            <Link
              to="/brands"
              className="rounded-xl border border-makmex-border bg-makmex-surface px-5 py-3 text-sm font-semibold text-makmex-text transition-colors duration-300 hover:border-makmex-orange/60"
            >
              {t("brandsPageTitle")}
            </Link>
            <Link
              to="/contact"
              className="rounded-xl border border-makmex-border bg-makmex-surface px-5 py-3 text-sm font-semibold text-makmex-text transition-colors duration-300 hover:border-makmex-orange/60"
            >
              {t("contact")}
            </Link>
          </div>
        </div>
      </section>

      <section data-reveal className="reveal-block relative rounded-3xl border border-makmex-border bg-makmex-panel p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold md:text-2xl">Featured Products</h2>
          <div className="text-xs text-makmex-muted">
            {newestTotalPages > 0 ? `${safeNewestPageIndex + 1} / ${newestTotalPages}` : "0 / 0"}
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={goToPreviousNewestPage}
            disabled={newestTotalPages <= 1}
            className="absolute left-0 top-0 bottom-0 z-10 flex w-10 md:w-11 items-center justify-center rounded-l-2xl border border-makmex-border bg-makmex-surface/95 text-xl text-makmex-text shadow-card transition hover:border-makmex-orange/60 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Previous featured products"
          >
            ←
          </button>

          <div className="px-12">
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${featuredItemsPerPage}, minmax(0, 1fr))` }}
            >
              {currentNewestPage.map((product) => (
                <Link
                  key={product.id}
                  to={`/item/${product.type}/${product.id}`}
                  className="group relative block overflow-hidden rounded-2xl border border-makmex-border bg-black/20 aspect-square"
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/70 to-transparent p-2">
                    <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-white md:text-xs" title={product.name}>
                      {product.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={goToNextNewestPage}
            disabled={newestTotalPages <= 1}
            className="absolute right-0 top-0 bottom-0 z-10 flex w-10 md:w-11 items-center justify-center rounded-r-2xl border border-makmex-border bg-makmex-surface/95 text-xl text-makmex-text shadow-card transition hover:border-makmex-orange/60 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Next featured products"
          >
            →
          </button>
        </div>
      </section>

      <section className="space-y-8">
        {showcaseSections.map((section, index) => (
          <article
            key={section.id}
            data-reveal
            className="reveal-block relative overflow-hidden rounded-3xl border border-makmex-border bg-makmex-panel p-6 md:p-8"
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${section.accent}`} />
            <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_26rem] lg:items-center">
              <div className="space-y-4">
                <h2 className="text-2xl font-extrabold md:text-3xl">{section.title}</h2>
                <p className="text-sm font-semibold text-makmex-text md:text-base">{section.subtitle}</p>
                <p className="max-w-2xl text-sm text-makmex-muted md:text-base">{section.body}</p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-makmex-border bg-makmex-surface/70">
                <img
                  src={sectionImageUrls[section.id]}
                  alt={section.title}
                  className="h-52 w-full object-cover md:h-64"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
