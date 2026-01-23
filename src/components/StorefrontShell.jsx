import { useState } from "react";
import { Link } from "react-router-dom";

function Icon({ children }) {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-makmex-border bg-makmex-panel text-makmex-muted">
      {children}
    </span>
  );
}

export default function StorefrontShell({ children }) {
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-screen bg-makmex-bg text-makmex-text">
      {/* Top promo bar */}
      <div className="border-b border-makmex-border bg-black/40">
        <div className="mx-auto max-w-6xl px-4 py-2 text-center text-xs text-makmex-muted">
          Up to 20% off kits this week • Free pickup in AZ • Fast shipping available
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-makmex-border bg-makmex-bg/90 backdrop-blur">
        {/* Row 1 */}
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-makmex-orange px-3 py-2 font-extrabold tracking-tight text-black">
                MAKMEX
              </div>
              <div className="hidden text-sm font-semibold text-makmex-muted sm:block">
                Store
              </div>
            </div>

            {/* Search */}
            <div className="flex-1">
              <div className="flex items-center overflow-hidden rounded-2xl border border-makmex-border bg-makmex-surface">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tools, batteries, kits…"
                  className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-makmex-muted/70"
                />
                <button
                  className="m-1 rounded-xl bg-makmex-orange px-4 py-2 text-sm font-semibold text-black hover:bg-makmex-ember"
                  onClick={() => console.log("search:", query)}
                >
                  Search
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="hidden items-center gap-3 md:flex">
              <button className="relative flex items-center gap-2 rounded-2xl border border-makmex-border bg-makmex-surface px-3 py-2 hover:border-makmex-orange/60">
                <Icon>🛒</Icon>
                <div className="text-left leading-tight">
                  <div className="text-xs text-makmex-muted">Cart</div>
                  <div className="text-sm font-semibold">$0.00</div>
                </div>
                <span className="absolute -right-2 -top-2 rounded-full bg-makmex-orange px-2 py-0.5 text-xs font-bold text-black">
                  0
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Nav */}
        <div className="border-t border-makmex-border bg-black/30">
          <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-2 text-sm">
        
{[
  { label: "Products", to: "/products" },
  { label: "Combos", to: "/combos" },
  { label: "Kits", to: "/kits" },
  { label: "Brands", to: "/brands" },
  { label: "Deals", to: "/deals" },
].map((item) => (
  <Link
    key={item.label}
    to={item.to}
    className="rounded-xl px-3 py-2 font-semibold text-makmex-muted hover:bg-makmex-surface hover:text-makmex-text"
  >
    <span className="flex items-center gap-2">
      {item.label}
    </span>
  </Link>
))}


            <div className="ml-auto hidden text-xs text-makmex-muted md:block">
              Arizona • Local pickup available
            </div>
          </nav>
        </div>
      </header>

      {/* Main content slot */}
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
