import { useEffect } from "react";
import { Link } from "react-router-dom";

const showcaseSections = [
  {
    id: "01",
    title: "Hero Campaign",
    subtitle: "Placeholder headline for flagship promotion",
    body: "Use this space for your strongest value proposition, launch message, and visual storytelling block.",
    accent: "from-makmex-orange/30 via-makmex-orange/5 to-transparent"
  },
  {
    id: "02",
    title: "Feature Story",
    subtitle: "Placeholder narrative section",
    body: "Highlight trust signals, differentiators, and an image-first layout that supports brand perception.",
    accent: "from-blue-500/20 via-blue-500/5 to-transparent"
  },
  {
    id: "03",
    title: "Category Spotlight",
    subtitle: "Placeholder section for category cards",
    body: "Swap these placeholders with product family visuals, short copy, and links to curated collections.",
    accent: "from-purple-500/20 via-purple-500/5 to-transparent"
  },
  {
    id: "04",
    title: "Final CTA",
    subtitle: "Placeholder closing section",
    body: "Use this final panel as a conversion push with urgency, social proof, or a seasonal campaign.",
    accent: "from-emerald-500/20 via-emerald-500/5 to-transparent"
  }
];

function PlaceholderMedia({ label }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-makmex-border bg-makmex-panel p-4 shadow-card">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-makmex-border bg-black/25 text-sm font-semibold text-makmex-muted transition-colors duration-500 group-hover:border-makmex-orange/60 group-hover:text-makmex-text">
        {label}
      </div>
    </div>
  );
}

export default function HomePage() {
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

  return (
    <div className="space-y-16 pb-20">
      <section
        data-reveal
        className="reveal-block relative overflow-hidden rounded-3xl border border-makmex-border bg-gradient-to-br from-makmex-panel via-makmex-bg to-black p-8 md:p-12"
      >
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-makmex-orange/15 blur-3xl float-soft" />
        <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl float-soft [animation-delay:600ms]" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <span className="inline-flex rounded-full border border-makmex-orange/40 bg-makmex-orange/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-makmex-orange">
            MAKMEX Home Skeleton
          </span>
          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
            Animated Homepage Structure
          </h1>
          <p className="max-w-2xl text-base text-makmex-muted md:text-lg">
            This is a presentation-first layout foundation with cinematic section transitions, placeholder media zones,
            and conversion-oriented flow ready for final copy and assets.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/shopping"
              className="rounded-xl bg-makmex-orange px-5 py-3 text-sm font-semibold text-black transition-transform duration-300 hover:-translate-y-0.5 hover:bg-makmex-ember"
            >
              Enter Shopping
            </Link>
            <button
              type="button"
              className="rounded-xl border border-makmex-border bg-makmex-surface px-5 py-3 text-sm font-semibold text-makmex-text transition-colors duration-300 hover:border-makmex-orange/60"
            >
              Placeholder Secondary Action
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {["Placeholder Hero Image", "Placeholder Product Collage", "Placeholder Metrics Panel"].map((label, index) => (
          <div key={label} data-reveal className="reveal-block" style={{ transitionDelay: `${index * 120}ms` }}>
            <PlaceholderMedia label={label} />
          </div>
        ))}
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
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-makmex-muted">Section {section.id}</span>
                <h2 className="text-2xl font-extrabold md:text-3xl">{section.title}</h2>
                <p className="text-sm font-semibold text-makmex-text md:text-base">{section.subtitle}</p>
                <p className="max-w-2xl text-sm text-makmex-muted md:text-base">{section.body}</p>
              </div>
              <PlaceholderMedia label={`Placeholder Visual ${section.id}`} />
            </div>
          </article>
        ))}
      </section>

      <section data-reveal className="reveal-block rounded-3xl border border-makmex-border bg-makmex-surface/70 p-8 text-center md:p-12">
        <h3 className="text-2xl font-extrabold md:text-3xl">Final Presentation Block</h3>
        <p className="mx-auto mt-3 max-w-3xl text-sm text-makmex-muted md:text-base">
          Replace this block with social proof, customer logos, FAQs, or campaign-specific conversion components.
          All transitions are already wired and ready for real content.
        </p>
      </section>
    </div>
  );
}
