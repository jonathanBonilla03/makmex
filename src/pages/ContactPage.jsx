import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";
import { useLoadingStatus } from "../context/LoadingContext";

const REQUEST_TIMEOUT_MS = 20000;

const { data: contactHeroImageData } = supabase.storage
  .from("web-images")
  .getPublicUrl("home-page/Tool-Showcase-CloseUp-2.jpg");

const contactHeroImageUrl = contactHeroImageData?.publicUrl || "";
const CONTACT_LOAD_ERROR_KEY = "contactLoadError";
const CONTACT_TIMEOUT_ERROR_KEY = "contactLoadTimeout";

const withTimeout = (promise, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} request timed out`)), REQUEST_TIMEOUT_MS);
    })
  ]);

function buildMapsSearchUrl(location) {
  const query = encodeURIComponent(location.address || location.name || location.id || "Makmex");
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function buildEmbedMapUrl(location) {
  const query = encodeURIComponent(location.address || location.name || location.id || "Makmex");
  return `https://www.google.com/maps?q=${query}&z=12&output=embed`;
}

export default function ContactPage() {
  const { t } = useLanguage();
  const { startLoading, stopLoading } = useLoadingStatus();
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadLocations() {
      setLoading(true);
      setError(null);
      startLoading();

      try {
        const { data, error: warehouseError } = await withTimeout(
          supabase
            .from("warehouse")
            .select('id, name, address, phone, email')
            .order("id", { ascending: true }),
          "warehouse"
        );

        if (warehouseError) {
          throw new Error(warehouseError.message);
        }

        const fallbackLocations = [
          {
            id: "CDMX",
            name: "CDMX",
            address: "Ciudad de Mexico",
            phone: "8484990393",
            email: ""
          },
          {
            id: "CEDIS",
            name: "CEDIS",
            address: "Chihuahua",
            phone: "+52 614 366 0847",
            email: ""
          },
          {
            id: "DENMOR",
            name: "DENMOR",
            address: "Monterrey",
            phone: "646474839",
            email: ""
          }
        ];

        const source = data && data.length > 0 ? data : fallbackLocations;

        if (isActive) {
          const trimmed = source.slice(0, 3);
          setLocations(trimmed);
          setSelectedLocation(trimmed[0] || null);
        }
      } catch (err) {
        if (isActive) {
          const isTimeout =
            err &&
            typeof err.message === "string" &&
            err.message.toLowerCase().includes("timed out");

          setError(isTimeout ? CONTACT_TIMEOUT_ERROR_KEY : CONTACT_LOAD_ERROR_KEY);
          setLocations([]);
          setSelectedLocation(null);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
        stopLoading();
      }
    }

    loadLocations();

    return () => {
      isActive = false;
    };
  }, [startLoading, stopLoading]);

  const selectedMapUrl = useMemo(() => {
    if (!selectedLocation) return "";
    return buildEmbedMapUrl(selectedLocation);
  }, [selectedLocation]);

  return (
    <div className="pb-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <section
          className="relative overflow-hidden rounded-3xl border border-makmex-border bg-cover bg-center bg-no-repeat px-8 py-10 md:px-12 md:py-14"
          style={{
            backgroundImage: `linear-gradient(120deg, rgba(7, 7, 9, 0.76), rgba(7, 7, 9, 0.56)), url(${contactHeroImageUrl})`
          }}
        >
          <h1 className="text-4xl font-extrabold text-white md:text-5xl">{t("contactPageTitle")}</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">{t("contactPageSubtitle")}</p>
        </section>

        {error && (
          <div className="rounded-2xl border border-makmex-border bg-makmex-panel p-4 text-sm text-makmex-text">
            {t(error)}
          </div>
        )}

        {loading ? (
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="min-h-[260px] rounded-3xl border border-makmex-border bg-makmex-panel p-6 shadow-card"
              >
                <div className="h-7 w-1/2 animate-pulse rounded bg-makmex-border/50" />
                <div className="mt-6 space-y-4">
                  <div className="h-4 w-4/5 animate-pulse rounded bg-makmex-border/40" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-makmex-border/40" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-makmex-border/40" />
                  <div className="h-10 w-32 animate-pulse rounded-xl bg-makmex-border/40" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
              {locations.map((location, index) => {
                const hasPhone = location.phone && String(location.phone).trim();
                const hasEmail = location.email && String(location.email).trim();
                const mapsUrl = buildMapsSearchUrl(location);
                const isSelected =
                  selectedLocation &&
                  (selectedLocation.id === location.id || selectedLocation.name === location.name);

                return (
                  <article
                    key={location.id || `${location.name}-${index}`}
                    className={`flex min-h-[290px] flex-col rounded-3xl border bg-makmex-panel p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg ${
                      isSelected ? "border-makmex-primary ring-1 ring-makmex-primary/30" : "border-makmex-border"
                    }`}
                  >
                    <div className="flex-1">
                      <h2 className="text-2xl font-extrabold text-makmex-text">
                        {location.name || location.id}
                      </h2>

                      <div className="mt-5 space-y-4 text-sm text-makmex-muted">
                        <p>
                          <span className="font-semibold text-makmex-text">{t("contactAddress")}: </span>
                          {location.address || t("contactNoAddress")}
                        </p>

                        <p>
                          <span className="font-semibold text-makmex-text">{t("contactPhone")}: </span>
                          {hasPhone ? (
                            <a
                              href={`tel:${location.phone}`}
                              className="font-medium text-makmex-text transition hover:text-makmex-primary hover:underline"
                            >
                              {location.phone}
                            </a>
                          ) : (
                            t("contactNoPhone")
                          )}
                        </p>

                        {hasEmail && (
                          <p>
                            <span className="font-semibold text-makmex-text">{t("contactEmail")}: </span>
                            <a
                              href={`mailto:${location.email}`}
                              className="font-medium text-makmex-text transition hover:text-makmex-primary hover:underline"
                            >
                              {location.email}
                            </a>
                          </p>
                        )}

                        <p>
                          <span className="font-semibold text-makmex-text">{t("contactHours")}: </span>
                          {t("contactHoursValue")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedLocation(location)}
                        className="inline-flex items-center rounded-xl border border-makmex-border px-4 py-2 text-sm font-semibold text-makmex-text transition hover:border-makmex-primary hover:text-makmex-primary"
                      >
                        {t("contactViewOnMap")}
                      </button>

                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-xl bg-makmex-primary px-4 py-2 text-sm font-semibold text-makmex-text transition hover:opacity-90"
                      >
                        {t("contactGetDirections")}
                      </a>
                    </div>
                  </article>
                );
              })}
            </section>

            {selectedLocation && selectedMapUrl && (
              <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-makmex-border bg-makmex-panel shadow-card">
                <div className="flex flex-col gap-2 border-b border-makmex-border px-6 py-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-extrabold text-makmex-text">
                      {selectedLocation.name || selectedLocation.id}
                    </h3>
                    <p className="text-sm text-makmex-muted">
                      {selectedLocation.address || t("contactNoAddress")}
                    </p>
                  </div>

                  <a
                    href={buildMapsSearchUrl(selectedLocation)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-xl bg-makmex-primary px-4 py-2 text-sm font-semibold text-makmex-text transition hover:opacity-90"
                  >
                    {t("contactOpenInGoogleMaps")}
                  </a>
                </div>

                <div className="h-[360px] w-full md:h-[420px]">
                  <iframe
                    title={t("contactMapTitle", {
                      location: selectedLocation.name || selectedLocation.id || "Makmex"
                    })}
                    src={selectedMapUrl}
                    className="h-full w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}