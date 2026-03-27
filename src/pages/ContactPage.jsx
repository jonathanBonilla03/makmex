import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";

const REQUEST_TIMEOUT_MS = 12000;

const { data: contactHeroImageData } = supabase.storage
  .from("web-images")
  .getPublicUrl("home-page/Tool-Showcase-CloseUp-2.jpg");

const contactHeroImageUrl = contactHeroImageData?.publicUrl || "";

const withTimeout = (promise, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(`${label} request timed out`)), REQUEST_TIMEOUT_MS);
    })
  ]);

function buildPlaceholderContact(locationName, index) {
  const numberSuffix = String(index + 1).padStart(2, "0");
  return {
    phone: `+52 (55) 5555-55${numberSuffix}`,
    email: `contact.${locationName.toLowerCase().replace(/\s+/g, "-")}@makmex.mx`
  };
}

export default function ContactPage() {
  const { t } = useLanguage();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadLocations() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: warehouseError } = await withTimeout(
          supabase.from("warehouse").select("id, name, address").order("name", { ascending: true }),
          "warehouse"
        );

        if (warehouseError) {
          throw new Error(warehouseError.message);
        }

        const fallbackLocations = [
          { id: "CDMX", name: "Mexico City", address: "Placeholder Address 101, Mexico City" },
          { id: "GDL", name: "Guadalajara", address: "Placeholder Address 202, Guadalajara" },
          { id: "MTY", name: "Monterrey", address: "Placeholder Address 303, Monterrey" }
        ];

        const source = data && data.length > 0 ? data : fallbackLocations;
        setLocations(source.slice(0, 3));
      } catch (err) {
        setError(err.message || "Failed to load contact locations");
        setLocations([]);
      } finally {
        setLoading(false);
      }
    }

    loadLocations();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <section
        className="relative overflow-hidden rounded-3xl border border-makmex-border bg-cover bg-center bg-no-repeat p-8 md:p-12"
        style={{
          backgroundImage: `linear-gradient(120deg, rgba(7, 7, 9, 0.76), rgba(7, 7, 9, 0.56)), url(${contactHeroImageUrl})`
        }}
      >
        <h1 className="text-4xl font-extrabold text-white md:text-5xl">{t("contactPageTitle")}</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">{t("contactPageSubtitle")}</p>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-makmex-border bg-makmex-panel p-6">
              <div className="h-6 w-1/2 animate-pulse rounded bg-makmex-border/50" />
              <div className="mt-5 space-y-3">
                <div className="h-4 w-4/5 animate-pulse rounded bg-makmex-border/40" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-makmex-border/40" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-makmex-border/40" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <section className="grid gap-4 grid-cols-1 sm:gap-6 md:grid-cols-3">
          {locations.map((location, index) => {
            const contact = buildPlaceholderContact(location.name || location.id || "store", index);

            return (
              <article
                key={location.id || `${location.name}-${index}`}
                className="rounded-2xl border border-makmex-border bg-makmex-panel p-4 shadow-card sm:p-6"
              >
                <h2 className="text-xl font-extrabold text-makmex-text sm:text-2xl">{location.name || location.id}</h2>
                <div className="mt-3 space-y-2 text-xs text-makmex-muted sm:mt-5 sm:space-y-3 sm:text-sm">
                  <p>
                    <span className="font-semibold text-makmex-text">{t("contactAddress")}: </span>
                    {location.address || "Placeholder Address"}
                  </p>
                  <p>
                    <span className="font-semibold text-makmex-text">{t("contactPhone")}: </span>
                    {contact.phone}
                  </p>
                  <p>
                    <span className="font-semibold text-makmex-text">{t("contactEmail")}: </span>
                    {contact.email}
                  </p>
                  <p>
                    <span className="font-semibold text-makmex-text">{t("contactHours")}: </span>
                    {t("contactHoursValue")}
                  </p>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
