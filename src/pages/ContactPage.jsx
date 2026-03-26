import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";

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

  useEffect(() => {
    async function loadLocations() {
      setLoading(true);
      const { data } = await supabase.from("warehouse").select("id, name, address").order("name", { ascending: true });

      const fallbackLocations = [
        { id: "CDMX", name: "Mexico City", address: "Placeholder Address 101, Mexico City" },
        { id: "GDL", name: "Guadalajara", address: "Placeholder Address 202, Guadalajara" },
        { id: "MTY", name: "Monterrey", address: "Placeholder Address 303, Monterrey" }
      ];

      const source = data && data.length > 0 ? data : fallbackLocations;
      setLocations(source.slice(0, 3));
      setLoading(false);
    }

    loadLocations();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-3xl border border-makmex-border bg-gradient-to-br from-makmex-panel via-makmex-bg to-black p-8 md:p-10">
        <h1 className="text-4xl font-extrabold md:text-5xl">{t("contactPageTitle")}</h1>
        <p className="mt-3 max-w-3xl text-sm text-makmex-muted md:text-base">{t("contactPageSubtitle")}</p>
      </section>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
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
        <section className="grid gap-6 md:grid-cols-3">
          {locations.map((location, index) => {
            const contact = buildPlaceholderContact(location.name || location.id || "store", index);

            return (
              <article key={location.id || `${location.name}-${index}`} className="rounded-2xl border border-makmex-border bg-makmex-panel p-6 shadow-card">
                <h2 className="text-2xl font-extrabold text-makmex-text">{location.name || location.id}</h2>
                <div className="mt-5 space-y-3 text-sm text-makmex-muted">
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
